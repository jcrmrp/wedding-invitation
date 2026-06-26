import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json({
    message: 'Account created successfully',
    user: { id: data.user.id, email: data.user.email },
  });
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({
    success: true,
    message: 'Login successful!',
    user: { id: data.user.id, email: data.user.email },
    session: data.session,
  });
});

app.get('/api/weddings', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('weddings')
    .select('*')
    .eq('user_id', user.id);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

app.post('/api/weddings', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const weddingData = {
    ...req.body,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('weddings')
    .insert(weddingData)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.status(201).json(data);
});

app.put('/api/weddings/:id', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.params;
  const { error } = await supabase
    .from('weddings')
    .update(req.body)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json({ message: 'Wedding updated successfully' });
});

app.get('/api/guest-photos', async (req: Request, res: Response) => {
  const { wedding_id } = req.query;

  const { data, error } = await supabase
    .from('guest_photos')
    .select('*')
    .eq('wedding_id', wedding_id as string)
    .eq('is_approved', true)
    .order('display_order');

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  res.json(data);
});

app.post('/api/notify', async (req: Request, res: Response) => {
  const { type, message, reference } = req.body;
  const developerEmail = process.env.DEVELOPER_EMAIL;

  if (!developerEmail) {
    return res.status(500).json({ message: 'Developer email not configured' });
  }

  console.log(`[NOTIFICATION] ${type}: ${message} | Ref: ${reference} | To: ${developerEmail}`);

  res.json({ success: true, message: 'Notification logged' });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const PLAN_PRICES: Record<string, { name: string; amount: number }> = {
  essential:    { name: 'The Essential Plan',             amount: 50000 },
  storyteller:  { name: 'The Storyteller Plan',           amount: 70000 },
  'keepsake-20':  { name: 'The Keepsake Plan (20 images)',  amount: 500000 },
  'keepsake-50':  { name: 'The Keepsake Plan (50 images)',  amount: 600000 },
  'keepsake-100': { name: 'The Keepsake Plan (100 images)', amount: 700000 },
  'keepsake-200': { name: 'The Keepsake Plan (200 images)', amount: 1000000 },
};

app.post('/api/functions/create-checkout', async (req: Request, res: Response) => {
  const { tier } = req.body;
  const plan = PLAN_PRICES[tier] || PLAN_PRICES.essential;

  const paymongoKey = process.env.PAYMONGO_SECRET_KEY;
  if (!paymongoKey) {
    return res.status(500).json({ error: 'Payment system not configured' });
  }

  try {
    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const checkoutResponse = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(paymongoKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [{
              amount: plan.amount,
              currency: 'PHP',
              name: plan.name,
              quantity: 1,
            }],
            payment_method_types: ['gcash', 'card'],
            redirect_urls: {
              success: `${frontendUrl}/dashboard?payment=success`,
              canceled: `${frontendUrl}/payment`,
            },
          },
        },
      }),
    });

    const data = await checkoutResponse.json();
    const checkoutUrl = data?.data?.attributes?.checkout_url;

    if (!checkoutUrl) {
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }

    res.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/functions/paymongo-webhook', async (req: Request, res: Response) => {
  const signature = req.headers['paymongo-signature'] as string | undefined;
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

  if (!webhookSecret || !signature) {
    return res.status(400).json({ error: 'Missing webhook signature' });
  }

  const crypto = await import('crypto');
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(JSON.stringify(req.body));
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body;
  if (event.type === 'checkout_session.payment_paid') {
    const session = event.data.attributes;
    const metadata = session.data?.attributes?.metadata || {};
    const userId = metadata.user_id;
    const tier = metadata.tier;
    const plan = metadata.plan;

    if (userId) {
      await supabase.from('weddings').update({
        plan: tier || plan,
        is_published: true,
      }).eq('user_id', userId);
    }
  }

  res.json({ received: true });
});

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

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

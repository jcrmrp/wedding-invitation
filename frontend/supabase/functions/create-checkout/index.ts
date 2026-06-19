import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Prices in PHP centavos (PayMongo uses smallest currency unit)
// 50000 = ₱500.00
const prices: Record<string, number> = {
  // Plan keys from the frontend
  essential:       50000,    // ₱500
  storyteller:     70000,    // ₱700
  'keepsake-20':   500000,   // ₱5,000
  'keepsake-50':   600000,   // ₱6,000
  'keepsake-100':  700000,   // ₱7,000
  'keepsake-200':  1000000,  // ₱10,000

  // Legacy keys kept for backwards compatibility
  A: 29900,
  B: 49900,
  C: 79900,
  D: 149900,
};

const planNames: Record<string, string> = {
  essential:       'The Essential Plan',
  storyteller:     'The Storyteller Plan',
  'keepsake-20':   'The Keepsake Plan — 20 images',
  'keepsake-50':   'The Keepsake Plan — 50 images',
  'keepsake-100':  'The Keepsake Plan — 100 images',
  'keepsake-200':  'The Keepsake Plan — 200 images',
  A: 'Tier A',
  B: 'Tier B',
  C: 'Tier C',
  D: 'Tier D',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const PAYMONGO_SECRET = Deno.env.get('PAYMONGO_SECRET_KEY');
    if (!PAYMONGO_SECRET) {
      return new Response(
        JSON.stringify({ error: 'PayMongo secret key not configured on server.' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const { tier } = await req.json();
    const amount = prices[tier as string];

    if (!amount) {
      return new Response(
        JSON.stringify({ error: `Unknown plan tier: "${tier}"` }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:5173';

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(PAYMONGO_SECRET + ':'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [{
              currency: 'PHP',
              amount,
              name: planNames[tier] || 'Wedding Invitation Subscription',
              quantity: 1,
            }],
            payment_method_types: ['gcash', 'card'],
            success_url: `${origin}/dashboard?payment=success`,
            cancel_url:  `${origin}/pricing`,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PayMongo error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: data?.errors?.[0]?.detail || 'PayMongo request failed.' }),
        { status: response.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutUrl = data?.data?.attributes?.checkout_url;
    if (!checkoutUrl) {
      return new Response(
        JSON.stringify({ error: 'No checkout URL in PayMongo response.' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ url: checkoutUrl }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});

import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import api from '../services/api';

const PLAN_PRICES: Record<string, { name: string; price: string; cycle: string; accent: string }> = {
  essential:      { name: 'The Essential Plan',             price: '₱500',    cycle: 'per month', accent: '#b07f56' },
  storyteller:    { name: 'The Storyteller Plan',           price: '₱700',    cycle: 'per month', accent: '#7a5b7d' },
  'keepsake-20':  { name: 'The Keepsake Plan — 20 images',  price: '₱5,000',  cycle: 'per year',  accent: '#c68a4f' },
  'keepsake-50':  { name: 'The Keepsake Plan — 50 images',  price: '₱6,000',  cycle: 'per year',  accent: '#c68a4f' },
  'keepsake-100': { name: 'The Keepsake Plan — 100 images', price: '₱7,000',  cycle: 'per year',  accent: '#c68a4f' },
  'keepsake-200': { name: 'The Keepsake Plan — 200 images', price: '₱10,000', cycle: 'per year',  accent: '#c68a4f' },
};

export default function PaymentGateway() {
  const location = useLocation();
  const navigate = useNavigate();

  const plan = (location.state as any)?.plan || 'essential';
  const form = (location.state as any)?.form;
  const planInfo = PLAN_PRICES[plan] || PLAN_PRICES.essential;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('functions/create-checkout', { tier: plan });
      const checkoutUrl = response.data.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create checkout session');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #faf4eb 0%, #f9ece9 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: '"Playfair Display", Georgia, serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          background: '#fffdf9', borderRadius: '28px', padding: '48px 44px',
          width: '100%', maxWidth: '460px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #e5d9ce',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '1.6rem', marginBottom: '12px' }}>🔒</div>
        <h1 style={{ fontSize: '1.7rem', fontStyle: 'italic', color: '#4a3f35', margin: '0 0 8px' }}>
          Secure Checkout
        </h1>
        <p style={{ color: '#7b6a5d', fontSize: '0.85rem', margin: '0 0 32px' }}>
          Review your order before paying.
        </p>

        {/* Order summary */}
        <div style={{
          background: '#faf4eb', border: '1px solid #e5d9ce', borderRadius: '18px',
          padding: '24px', marginBottom: '28px', textAlign: 'left',
        }}>
          <div style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: planInfo.accent, fontWeight: 700, marginBottom: '8px' }}>
            Selected Plan
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, fontStyle: 'italic', color: '#4a3f35', marginBottom: '4px' }}>
            {planInfo.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: form ? '16px' : '0' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: planInfo.accent }}>{planInfo.price}</span>
            <span style={{ fontSize: '0.82rem', color: '#b0a090' }}>{planInfo.cycle}</span>
          </div>

          {form && (
            <>
              <div style={{ height: '1px', background: '#e5d9ce', margin: '16px 0 14px' }} />
              <div style={{ fontSize: '0.82rem', color: '#7b6a5d', lineHeight: 1.8 }}>
                <div><strong style={{ color: '#4a3f35' }}>Couple:</strong> {form.partnerA} & {form.partnerB}</div>
                {form.date && (
                  <div><strong style={{ color: '#4a3f35' }}>Date:</strong> {new Date(form.date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                )}
                {form.venue && (
                  <div><strong style={{ color: '#4a3f35' }}>Venue:</strong> {form.venue}</div>
                )}
                {form.template && (
                  <div><strong style={{ color: '#4a3f35' }}>Template:</strong> {form.template.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</div>
                )}
              </div>
            </>
          )}
        </div>

<motion.button
           whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
           onClick={handleCheckout}
           disabled={loading}
           style={{
             width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
             background: planInfo.accent, color: '#ffffff', fontSize: '0.9rem',
             fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
             cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
             boxShadow: `0 6px 20px rgba(0,0,0,0.15)`, transition: 'opacity 0.2s',
             opacity: loading ? 0.7 : 1,
           }}
         >
           {loading ? 'Preparing checkout…' : `Pay ${planInfo.price} via PayMongo →`}
         </motion.button>

         {error && (
           <p style={{ color: '#c0392b', fontSize: '0.82rem', margin: '12px 0 0' }}>{error}</p>
         )}

        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '14px', background: 'none', border: 'none',
            color: '#b0a090', fontSize: '0.82rem', cursor: 'pointer',
            fontFamily: 'inherit', textDecoration: 'underline',
          }}
        >
          ← Go back and edit
        </button>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

const TEMPLATES = [
  { id: 'classic-ivory',    name: 'Classic Ivory',     accent: '#b07f56', bg: '#faf4eb' },
  { id: 'rose-garden',      name: 'Rose Garden',        accent: '#d98c6a', bg: '#f9ece9' },
  { id: 'modern-minimal',   name: 'Modern Minimal',     accent: '#0f4c81', bg: '#f3f5f8' },
  { id: 'desert-dunes',     name: 'Desert Dunes',       accent: '#c5855e', bg: '#f4ece4' },
  { id: 'moonlit-lace',     name: 'Moonlit Lace',       accent: '#7f6b9e', bg: '#f9f6f3' },
  { id: 'botanical-green',  name: 'Botanical Green',    accent: '#4c7a52', bg: '#f1f5f1' },
  { id: 'coastal-breeze',   name: 'Coastal Breeze',     accent: '#5fa0c7', bg: '#f3f7f9' },
  { id: 'velvet-night',     name: 'Velvet Night',       accent: '#2d4a78', bg: '#f3f3f8' },
  { id: 'paper-blossom',    name: 'Paper Blossom',      accent: '#c1886f', bg: '#fbf2ef' },
  { id: 'golden-glow',      name: 'Golden Glow',        accent: '#c68a4f', bg: '#f7f0e8' },
  { id: 'vintage-bloom',    name: 'Vintage Bloom',      accent: '#a67b6f', bg: '#f4ece8' },
  { id: 'winter-pearl',     name: 'Winter Pearl',       accent: '#5f7f95', bg: '#f4f6f7' },
  { id: 'meadow-light',     name: 'Meadow Light',       accent: '#6d9b7b', bg: '#eef7ef' },
  { id: 'blush-charm',      name: 'Blush Charm',        accent: '#d18d82', bg: '#fbf1ef' },
  { id: 'twilight-romance', name: 'Twilight Romance',   accent: '#7a5b7d', bg: '#f4f1f4' },
  { id: 'garden-party',     name: 'Garden Party',       accent: '#a3b063', bg: '#fbf7f2' },
  { id: 'sage-stone',       name: 'Sage & Stone',       accent: '#7a8b7f', bg: '#f1f3f1' },
  { id: 'art-deco',         name: 'Art Deco',           accent: '#ad8a4a', bg: '#f5f3f1' },
  { id: 'rustic-barn',      name: 'Rustic Barn',        accent: '#a56f43', bg: '#f5efe6' },
  { id: 'starlit-waltz',    name: 'Starlit Waltz',      accent: '#6373b2', bg: '#f3f4f7' },
  { id: 'celestial-vow',    name: 'Celestial Vow',      accent: '#5f7caf', bg: '#f5f7fa' },
];

const STEPS = ['Your Details', 'Wedding Info', 'Choose Template'];

function toSlug(name: string): string {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function OnboardingForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = (location.state as any)?.plan || 'essential';

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    partnerA: '', partnerB: '',
    date: '', venue: '', message: '',
    template: 'classic-ivory',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  // ── On mount: check if returning from a successful PayMongo payment ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') !== 'success') return;

    const saved = localStorage.getItem('onboarding_form');
    const savedPlan = localStorage.getItem('onboarding_plan');
    if (!saved) return;

    const parsedForm = JSON.parse(saved);
    setSaving(true);

    const saveAfterPayment = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const coupleName = `${parsedForm.partnerA} & ${parsedForm.partnerB}`;
      const slug = toSlug(coupleName);

      // Check if a wedding record already exists
      const { data: existing } = await supabase
        .from('weddings')
        .select('id, subscription_id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Update existing record
        await supabase.from('weddings').update({
          couple_names: coupleName,
          wedding_date: parsedForm.date,
          venue:        parsedForm.venue,
          description:  parsedForm.message,
          custom_url:   slug,
          is_published: true,
          title:        coupleName + ' Wedding',
        }).eq('user_id', user.id);
      } else {
        // Insert new record - subscription_id can be null for dev accounts
        await supabase.from('weddings').insert({
          user_id:         user.id,
          couple_names:    coupleName,
          wedding_date:    parsedForm.date,
          venue:           parsedForm.venue,
          description:     parsedForm.message,
          custom_url:      slug,
          is_published:    true,
          title:           coupleName + ' Wedding',
        });
      }

      // Clean up localStorage
      localStorage.removeItem('onboarding_form');
      localStorage.removeItem('onboarding_plan');

      navigate('/dashboard');
    };

    saveAfterPayment();
  }, []);

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: '1.5px solid #e5d9ce', background: '#fffdf9',
    color: '#4a3f35', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };
  const labelStyle = {
    display: 'block' as const, marginBottom: '7px', fontSize: '0.72rem',
    letterSpacing: '0.14em', textTransform: 'uppercase' as const,
    color: '#7b6a5d', fontWeight: 600,
  };

  const canNext = () => {
    if (step === 0) return form.partnerA.trim() && form.partnerB.trim();
    if (step === 1) return form.date.trim() && form.venue.trim();
    return true;
  };

  // Save form to localStorage then go to payment
  const handleSubmit = () => {
    localStorage.setItem('onboarding_form', JSON.stringify(form));
    localStorage.setItem('onboarding_plan', plan);
    navigate('/payment', { state: { plan, form } });
  };

  // Show a saving screen while processing the post-payment redirect
  if (saving) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #faf4eb 0%, #f9ece9 100%)',
        fontFamily: '"Playfair Display", Georgia, serif', gap: '16px',
      }}>
        <motion.div
          animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #e5d9ce', borderTopColor: '#b07f56' }}
        />
        <p style={{ color: '#7b6a5d', fontSize: '1rem', margin: 0 }}>Setting up your invitation…</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #faf4eb 0%, #f9ece9 100%)',
      padding: '40px 20px', fontFamily: '"Playfair Display", Georgia, serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '1.3rem', color: '#b07f56', marginBottom: '8px' }}>✦</div>
        <h1 style={{ fontSize: '1.9rem', fontStyle: 'italic', color: '#4a3f35', margin: '0 0 6px' }}>
          Build Your Invitation
        </h1>
        <p style={{ color: '#7b6a5d', fontSize: '0.83rem', margin: 0 }}>
          Fill in your details — you can always edit these later.
        </p>
      </motion.div>

      {/* Step indicators */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        {STEPS.map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: i <= step ? '#b07f56' : '#e5d9ce',
                color: i <= step ? '#fff' : '#b0a090',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.3s',
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '0.68rem', color: i === step ? '#b07f56' : '#b0a090', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: '60px', height: '1px', background: i < step ? '#b07f56' : '#e5d9ce', margin: '0 4px 18px', transition: 'background 0.3s' }} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: '#fffdf9', borderRadius: '28px', padding: '44px 40px',
          width: '100%', maxWidth: step === 2 ? '860px' : '480px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.09)', border: '1px solid #e5d9ce',
          transition: 'max-width 0.4s ease',
        }}
      >
        <AnimatePresence mode="wait">

          {/* Step 0 — Partner names */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 style={{ color: '#4a3f35', fontStyle: 'italic', fontSize: '1.3rem', margin: '0 0 28px' }}>Who's getting married? 💍</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Partner 1 — Full Name</label>
                  <input style={inputStyle} placeholder="e.g. Alexandra Santos" value={form.partnerA}
                    onChange={e => set('partnerA', e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = '#b07f56')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5d9ce')} />
                </div>
                <div>
                  <label style={labelStyle}>Partner 2 — Full Name</label>
                  <input style={inputStyle} placeholder="e.g. Jordan Reyes" value={form.partnerB}
                    onChange={e => set('partnerB', e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = '#b07f56')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5d9ce')} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1 — Wedding details */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 style={{ color: '#4a3f35', fontStyle: 'italic', fontSize: '1.3rem', margin: '0 0 28px' }}>Tell us about the big day 🗓</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Wedding Date</label>
                  <input type="date" style={inputStyle} value={form.date}
                    onChange={e => set('date', e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = '#b07f56')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5d9ce')} />
                </div>
                <div>
                  <label style={labelStyle}>Venue</label>
                  <input style={inputStyle} placeholder="e.g. The Grand Ballroom, Manila" value={form.venue}
                    onChange={e => set('venue', e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = '#b07f56')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5d9ce')} />
                </div>
                <div>
                  <label style={labelStyle}>A Message to Your Guests <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                  <textarea
                    rows={4} style={{ ...inputStyle, resize: 'vertical' as const }}
                    placeholder="Share a short note or quote for your guests…"
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    onFocus={e => (e.currentTarget.style.borderColor = '#b07f56')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#e5d9ce')}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Template picker */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <h2 style={{ color: '#4a3f35', fontStyle: 'italic', fontSize: '1.3rem', margin: '0 0 6px' }}>Choose your template 🎨</h2>
              <p style={{ color: '#7b6a5d', fontSize: '0.82rem', margin: '0 0 24px' }}>You can change this anytime from your editor.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                {TEMPLATES.map(t => {
                  const isActive = form.template === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => set('template', t.id)}
                      style={{
                        padding: '16px 12px', borderRadius: '16px', cursor: 'pointer',
                        border: `2px solid ${isActive ? t.accent : '#e5d9ce'}`,
                        background: isActive ? t.bg : '#fffdf9',
                        transition: 'all 0.2s', textAlign: 'left' as const,
                        boxShadow: isActive ? `0 4px 16px rgba(0,0,0,0.1)` : 'none',
                        transform: isActive ? 'translateY(-2px)' : 'none',
                        fontFamily: 'inherit',
                      }}>
                      <div style={{ width: '100%', height: '8px', borderRadius: '4px', background: t.accent, marginBottom: '10px', opacity: 0.7 }} />
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a3f35', lineHeight: 1.3 }}>{t.name}</div>
                      {isActive && <div style={{ fontSize: '0.65rem', color: t.accent, marginTop: '4px', fontWeight: 600 }}>Selected ✓</div>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', gap: '12px' }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              style={{
                padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #e5d9ce',
                background: 'transparent', color: '#7b6a5d', cursor: 'pointer',
                fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 600,
              }}>
              ← Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              style={{
                padding: '12px 32px', borderRadius: '12px', border: 'none',
                background: canNext() ? '#b07f56' : '#e5d9ce',
                color: canNext() ? '#fff' : '#b0a090',
                cursor: canNext() ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem', fontFamily: 'inherit', fontWeight: 700,
                letterSpacing: '0.06em', boxShadow: canNext() ? '0 4px 16px rgba(176,127,86,0.25)' : 'none',
              }}>
              Continue →
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              style={{
                padding: '12px 32px', borderRadius: '12px', border: 'none',
                background: '#b07f56', color: '#fff',
                cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit',
                fontWeight: 700, letterSpacing: '0.06em',
                boxShadow: '0 4px 16px rgba(176,127,86,0.25)',
              }}>
              Proceed to Payment →
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

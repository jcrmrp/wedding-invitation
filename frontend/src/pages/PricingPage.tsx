import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const KEEPSAKE_TIERS = [
  { id: 'keepsake-20',  images: 20,  price: '₱5,000',  amount: 500000 },
  { id: 'keepsake-50',  images: 50,  price: '₱6,000',  amount: 600000 },
  { id: 'keepsake-100', images: 100, price: '₱7,000',  amount: 700000 },
  { id: 'keepsake-200', images: 200, price: '₱10,000', amount: 1000000 },
];

const plans = [
  {
    id: 'essential',
    name: 'The Essential Plan',
    badge: 'Basic',
    price: '₱500',
    cycle: '/ month',
    tagline: 'Perfect for a clean, elegant, and straightforward invitation.',
    accent: '#b07f56',
    features: [
      'Single Featured Image',
      'Main Invitation Page View',
      'Countdown Timer',
      'Celebration Showcase Page',
    ],
  },
  {
    id: 'storyteller',
    name: 'The Storyteller Plan',
    badge: 'Semi-Premium',
    price: '₱700',
    cycle: '/ month',
    tagline: 'Best for couples who want to share their journey and favorite moments.',
    accent: '#7a5b7d',
    popular: true,
    features: [
      'All Essential features included',
      '"Our Journey" section (3 photos)',
      '"Our Gallery" (up to 5 photos)',
      'Number of guests RSVP tracking',
      'Redirect after RSVP',
      '"Gift of Love" digital registry section',
    ],
  },
  {
    id: 'keepsake',
    name: 'The Keepsake Plan',
    badge: 'Premium',
    price: 'From ₱5,000',
    cycle: '/ year',
    tagline: 'Our most comprehensive package for a full, high-definition digital gallery experience.',
    accent: '#c68a4f',
    features: [
      'All Storyteller features included',
      '"Our Journey" section (3 photos)',
      'Scalable Gallery Storage — choose below',
    ],
  },
];

export default function PricingPage() {
  const [selected, setSelected] = useState('storyteller');
  const [keepsakeTier, setKeepsakeTier] = useState(KEEPSAKE_TIERS[0].id);
  const navigate = useNavigate();

  const selectedKeepsake = KEEPSAKE_TIERS.find(t => t.id === keepsakeTier) || KEEPSAKE_TIERS[0];

  // Resolve the display price for the CTA
  const resolvedPrice = selected === 'keepsake' ? selectedKeepsake.price : plans.find(p => p.id === selected)?.price;

  const handleProceed = () => {
    navigate('/onboarding', {
      state: {
        plan: selected === 'keepsake' ? keepsakeTier : selected,
        planLabel: selected === 'keepsake'
          ? `The Keepsake Plan — ${selectedKeepsake.images} images`
          : plans.find(p => p.id === selected)?.name,
      },
    });
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #faf4eb 0%, #f9ece9 100%)',
      padding: '60px 20px', fontFamily: '"Playfair Display", Georgia, serif',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 56px' }}
      >
        <div style={{ fontSize: '1.4rem', color: '#b07f56', marginBottom: '12px' }}>✦</div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, fontStyle: 'italic', color: '#4a3f35', margin: '0 0 14px' }}>
          Invitation Packages
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '18px' }}>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: '#e5d9ce' }} />
          <span style={{ fontSize: '0.55rem', color: '#b07f56' }}>◆</span>
          <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: '#e5d9ce' }} />
        </div>
        <p style={{ color: '#7b6a5d', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
          Wedding Digital Invitation Packages — make your wedding invitation timeless,
          interactive, and accessible. Choose the plan that best fits your love story.
        </p>
      </motion.div>

      {/* Plan cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px', maxWidth: '1000px', margin: '0 auto 48px',
      }}>
        {plans.map((plan, i) => {
          const isSelected = selected === plan.id;
          const isKeepsake = plan.id === 'keepsake';
          const displayPrice = isKeepsake && isSelected ? selectedKeepsake.price : plan.price;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              onClick={() => setSelected(plan.id)}
              style={{
                background: '#fffdf9', borderRadius: '24px', padding: '36px 30px',
                border: `2px solid ${isSelected ? plan.accent : '#e5d9ce'}`,
                boxShadow: isSelected ? `0 12px 40px rgba(0,0,0,0.12)` : '0 4px 16px rgba(0,0,0,0.06)',
                cursor: 'pointer', position: 'relative', transition: 'all 0.25s ease',
                transform: isSelected ? 'translateY(-4px)' : 'none',
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div style={{
                  position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                  background: plan.accent, color: '#fff', fontSize: '0.68rem', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 16px',
                  borderRadius: '20px', whiteSpace: 'nowrap',
                }}>
                  Most Popular
                </div>
              )}

              {/* Selected indicator */}
              <div style={{
                position: 'absolute', top: '18px', right: '18px',
                width: '22px', height: '22px', borderRadius: '50%',
                border: `2px solid ${isSelected ? plan.accent : '#e5d9ce'}`,
                background: isSelected ? plan.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {isSelected && <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
              </div>

              {/* Badge */}
              <div style={{
                display: 'inline-block', fontSize: '0.65rem', letterSpacing: '0.16em',
                textTransform: 'uppercase', color: plan.accent, fontWeight: 700, marginBottom: '10px',
              }}>
                {plan.badge}
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontStyle: 'italic', color: '#4a3f35', margin: '0 0 8px' }}>
                {plan.name}
              </h2>
              <p style={{ color: '#7b6a5d', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 20px' }}>
                {plan.tagline}
              </p>

              {/* Price — animates when keepsake tier changes */}
              <div style={{ marginBottom: '24px', minHeight: '44px' }}>
                <motion.span
                  key={displayPrice}
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ fontSize: '1.8rem', fontWeight: 700, color: plan.accent }}
                >
                  {displayPrice}
                </motion.span>
                <span style={{ fontSize: '0.82rem', color: '#b0a090', marginLeft: '4px' }}>{plan.cycle}</span>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: '#e5d9ce', marginBottom: '20px' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {plan.features.map((f, fi) => (
                  <li key={fi} style={{
                    fontSize: '0.83rem', color: '#4a3f35',
                    display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.5,
                  }}>
                    <span style={{ color: plan.accent, flexShrink: 0, marginTop: '1px' }}>✦</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Keepsake storage selector — slides open when selected */}
              <AnimatePresence>
                {isKeepsake && isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{ overflow: 'hidden' }}
                    onClick={e => e.stopPropagation()} // prevent card deselect
                  >
                    <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #e5d9ce' }}>
                      <p style={{
                        fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                        color: plan.accent, fontWeight: 700, margin: '0 0 12px',
                      }}>
                        Choose Gallery Storage
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {KEEPSAKE_TIERS.map(tier => {
                          const isActiveTier = keepsakeTier === tier.id;
                          return (
                            <button
                              key={tier.id}
                              type="button"
                              onClick={() => setKeepsakeTier(tier.id)}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '11px 14px', borderRadius: '12px', cursor: 'pointer',
                                border: `1.5px solid ${isActiveTier ? plan.accent : '#e5d9ce'}`,
                                background: isActiveTier ? `${plan.accent}18` : 'transparent',
                                transition: 'all 0.18s ease', fontFamily: 'inherit',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                                  border: `2px solid ${isActiveTier ? plan.accent : '#d5c8be'}`,
                                  background: isActiveTier ? plan.accent : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  {isActiveTier && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                                </div>
                                <span style={{ fontSize: '0.83rem', color: '#4a3f35', fontWeight: isActiveTier ? 700 : 400 }}>
                                  {tier.images} images
                                </span>
                              </div>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isActiveTier ? plan.accent : '#7b6a5d' }}>
                                {tier.price} <span style={{ fontSize: '0.7rem', fontWeight: 400, color: '#b0a090' }}>/yr</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginBottom: '56px' }}>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={handleProceed}
          style={{
            padding: '16px 48px', borderRadius: '30px', border: 'none',
            background: '#b07f56', color: '#ffffff', fontSize: '0.9rem',
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 8px 28px rgba(176,127,86,0.35)',
          }}
        >
          Get Started — {resolvedPrice} →
        </motion.button>
        <p style={{ color: '#b0a090', fontSize: '0.78rem', marginTop: '12px' }}>
          {selected === 'keepsake'
            ? `${selectedKeepsake.images} image gallery · billed yearly`
            : "You'll fill in your details before payment."}
        </p>
      </div>

      {/* Important info */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
        style={{
          maxWidth: '680px', margin: '0 auto', background: '#fffdf9',
          border: '1px solid #e5d9ce', borderRadius: '20px', padding: '32px 36px',
        }}
      >
        <h3 style={{ color: '#4a3f35', fontStyle: 'italic', fontSize: '1.1rem', margin: '0 0 18px' }}>
          Important Information
        </h3>
        {[
          ['Billing & Maintenance', 'Subscription fees ensure your site remains online, secure, and updated.'],
          ['Grace Period', 'If a payment is missed, your page will be deactivated. We provide a 30-day grace period for renewal.'],
          ['Data Security', 'If the subscription remains unpaid after 30 days, the page will be permanently archived and deleted from our servers.'],
        ].map(([title, body]) => (
          <div key={title} style={{ marginBottom: '14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ color: '#b07f56', flexShrink: 0, marginTop: '2px' }}>◆</span>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#7b6a5d', lineHeight: 1.7 }}>
              <strong style={{ color: '#4a3f35' }}>{title}:</strong> {body}
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

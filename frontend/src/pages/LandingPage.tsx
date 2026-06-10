import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';

// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  { icon: '✉️', title: 'Digital Invitations',     desc: 'Fully customisable invitations with your photos, colours, and personal touch — delivered instantly.' },
  { icon: '📸', title: 'Beautiful Gallery',        desc: 'Share up to 200 curated photos with guests in a stunning, scrollable gallery they can revisit forever.' },
  { icon: '💌', title: 'RSVP in One Tap',          desc: 'Guests confirm attendance, add plus-ones, and note dietary needs — right from their phone.' },
  { icon: '🎵', title: 'Background Music',         desc: 'Set the mood with your wedding song. Plays automatically the moment your invitation is opened.' },
  { icon: '💍', title: 'Full Entourage List',      desc: 'Beautifully display your bridal party, sponsors, and family members in a dedicated section.' },
  { icon: '🎁', title: 'Gift of Love Registry',   desc: 'Let guests send blessings via GCash — include your QR code and number directly on the page.' },
];

const testimonials = [
  { quote: "Our guests kept saying the invitation felt like a real website. It was so beautiful and personal.", name: 'Andrea & Miguel', location: 'Cebu City' },
  { quote: "Setting everything up took less than an hour. Worth every peso — our families loved it.", name: 'Trisha & James',   location: 'Metro Manila' },
  { quote: "The music started playing the moment my ninang opened it. She literally cried.", name: 'Sofia & Rafael',   location: 'Davao' },
];

const planData = [
  {
    id: 'essential',
    name: 'Essential',
    badge: 'Basic',
    price: '₱500',
    cycle: '/ month',
    tagline: 'Clean, elegant, and straightforward.',
    accent: '#b07f56',
    bg: '#fff8f2',
    features: ['Single featured image', 'Couple names & venue', 'Countdown timer', 'Celebration page'],
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    badge: 'Most Popular',
    price: '₱700',
    cycle: '/ month',
    tagline: 'Share your journey, your moments.',
    accent: '#7a5b7d',
    bg: '#f9f5fb',
    popular: true,
    features: ['Everything in Essential', '"Our Journey" section', 'Gallery up to 5 photos', 'RSVP tracking', 'Gift of Love section'],
  },
  {
    id: 'keepsake',
    name: 'Keepsake',
    badge: 'Premium',
    price: 'From ₱5,000',
    cycle: '/ year',
    tagline: 'The full experience, nothing held back.',
    accent: '#c68a4f',
    bg: '#fff9f4',
    features: ['Everything in Storyteller', 'Gallery up to 200 photos', 'Custom hero & celebration images', 'Priority support'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return y;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [user, setUser]               = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [autoPay, setAutoPay]         = useState(false);
  const [autoPaySaving, setAutoPaySaving] = useState(false);
  const [subTimeLeft, setSubTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const scrollY = useScrollY();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const { data: sub } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle();
        setSubscription(sub);
        if (sub?.auto_pay !== undefined) setAutoPay(sub.auto_pay);
      }
    });
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user || null));
    return () => authSub.unsubscribe();
  }, []);

  // Live countdown ticker
  useEffect(() => {
    if (!subscription?.end_date) return;
    const tick = () => {
      const diff = new Date(subscription.end_date).getTime() - Date.now();
      if (diff <= 0) { setSubTimeLeft(null); return; }
      setSubTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [subscription]);

  // Rotate testimonials every 5 s
  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate(0); };

  const toggleAutoPay = async () => {
    if (!subscription) return;
    setAutoPaySaving(true);
    const next = !autoPay;
    await supabase.from('subscriptions').update({ auto_pay: next }).eq('id', subscription.id);
    setAutoPay(next);
    setAutoPaySaving(false);
  };

  const subExpired  = subTimeLeft === null && subscription?.end_date && new Date(subscription.end_date) < new Date();
  const daysLeft    = subTimeLeft?.d ?? 0;
  const urgentColor = daysLeft <= 7 ? '#b04a4a' : daysLeft <= 14 ? '#c9965e' : '#4a7c59';

  return (
    <div style={{ minHeight: '100vh', fontFamily: '"Playfair Display", Georgia, serif', background: '#faf4eb', overflowX: 'hidden' }}>

      {/* ── Sticky nav ───────────────────────────────────────────────────── */}
      <motion.header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '0 32px',
          height: '64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: scrollY > 40 ? 'rgba(250,244,235,0.96)' : 'transparent',
          backdropFilter: scrollY > 40 ? 'blur(12px)' : 'none',
          borderBottom: scrollY > 40 ? '1px solid #e5d9ce' : 'none',
          transition: 'background 0.3s, border 0.3s',
        }}
      >
        <motion.span
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          style={{ fontSize: '1.7rem', color: '#4a3f35', fontStyle: 'italic', fontWeight: 700, letterSpacing: '-0.01em' }}
        >
          Luxora
        </motion.span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user ? (
            <>
              {subTimeLeft && (
                <span style={{ fontSize: '0.72rem', color: urgentColor, background: `${urgentColor}18`, padding: '4px 12px', borderRadius: '20px', fontWeight: 700, letterSpacing: '0.02em' }}>
                  {subTimeLeft.d}d {subTimeLeft.h}h {subTimeLeft.m}m left
                </span>
              )}
              {subExpired && (
                <span style={{ fontSize: '0.72rem', color: '#b04a4a', background: '#fdeaea', padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>
                  Subscription expired
                </span>
              )}
              <NavBtn onClick={() => navigate('/dashboard')} filled>Dashboard</NavBtn>
              <NavBtn onClick={handleLogout}>Logout</NavBtn>
            </>
          ) : (
            <>
              <Link to="/login"><NavBtn>Sign In</NavBtn></Link>
              <Link to="/pricing"><NavBtn filled>Get Started</NavBtn></Link>
            </>
          )}
        </div>
      </motion.header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Background image with parallax */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: `center ${50 + scrollY * 0.15}%`,
          filter: 'brightness(0.45)',
          transform: 'scale(1.05)',
        }} />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(74,63,53,0.2) 0%, rgba(74,63,53,0.55) 60%, rgba(250,244,235,1) 100%)',
        }} />

        {/* Content */}
        <div style={{ position: 'relative', textAlign: 'center', padding: '120px 24px 80px', maxWidth: '780px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ fontSize: '0.72rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: '20px', fontWeight: 600 }}
          >
            Digital Wedding Invitations
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              fontSize: 'clamp(2.6rem, 7vw, 4.8rem)',
              color: '#ffffff',
              margin: '0 0 24px',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 1.15,
              textShadow: '0 2px 24px rgba(0,0,0,0.3)',
            }}
          >
            Your Love Story,<br />Beautifully Shared
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            style={{ fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', color: 'rgba(255,255,255,0.85)', margin: '0 auto 40px', lineHeight: 1.7, maxWidth: '540px' }}
          >
            Create stunning digital invitations your guests will cherish — with gallery, music, RSVP, and more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {user ? (
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 12px 36px rgba(176,127,86,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dashboard')}
                style={{ padding: '16px 40px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg, #b07f56, #c9965e)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(176,127,86,0.4)', letterSpacing: '0.04em' }}
              >
                Go to Dashboard →
              </motion.button>
            ) : (
              <>
                <Link to="/pricing">
                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: '0 12px 36px rgba(176,127,86,0.5)' }}
                    whileTap={{ scale: 0.97 }}
                    style={{ padding: '16px 40px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg, #b07f56, #c9965e)', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 28px rgba(176,127,86,0.4)', letterSpacing: '0.04em' }}
                  >
                    Create Your Invitation
                  </motion.button>
                </Link>
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ padding: '16px 40px', borderRadius: '50px', border: '2px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: '#fff', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Sign In
                  </motion.button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            style={{ marginTop: '64px' }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.4rem' }}
            >
              ↓
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────────────────── */}
      <div style={{ background: '#fffdf9', borderBottom: '1px solid #e5d9ce', padding: '18px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          {[
            ['✦', 'Instant delivery'],
            ['✦', 'Works on any device'],
            ['✦', 'Filipino-made & supported'],
            ['✦', 'No app download needed'],
          ].map(([icon, text]) => (
            <span key={text} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', color: '#7b6a5d', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#b07f56', fontSize: '0.55rem' }}>{icon}</span>
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <SectionLabel>What You Get</SectionLabel>
        <SectionHeading>Everything Your Invitation Needs</SectionHeading>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px', marginTop: '48px',
        }}>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.07 }}
              whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.1)' }}
              style={{
                background: '#fffdf9',
                border: '1.5px solid #e5d9ce',
                borderRadius: '22px',
                padding: '32px 28px',
                transition: 'box-shadow 0.25s',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '14px' }}>{f.icon}</div>
              <h3 style={{ fontSize: '1.1rem', color: '#4a3f35', margin: '0 0 10px', fontWeight: 700 }}>{f.title}</h3>
              <p style={{ fontSize: '0.88rem', color: '#7b6a5d', margin: 0, lineHeight: 1.75 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Sample invitation preview ─────────────────────────────────────── */}
      <section style={{ background: '#f4ece4', padding: '96px 24px', overflow: 'hidden' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '64px', flexWrap: 'wrap' }}>
          {/* Text */}
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            <SectionLabel>See It in Action</SectionLabel>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: '#4a3f35', fontStyle: 'italic', margin: '12px 0 20px', lineHeight: 1.2 }}>
              An Invitation That Feels Like a Memory
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#7b6a5d', lineHeight: 1.8, margin: '0 0 32px' }}>
              Every detail — names, venue, music, photos, entourage — lives on one beautiful page. Guests open it on any device, RSVP in seconds, and walk away feeling the love.
            </p>
            <Link to="/invite/alex-and-jordan">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '14px 32px', borderRadius: '50px', border: 'none',
                  background: '#4a3f35', color: '#fff', fontWeight: 700,
                  fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '0.05em',
                }}
              >
                View Sample Invitation →
              </motion.button>
            </Link>
          </div>

          {/* Mock phone frame */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', minWidth: 0 }}
          >
            <div style={{
              width: '260px',
              background: '#1a1a1a',
              borderRadius: '40px',
              padding: '12px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            }}>
              <div style={{ borderRadius: '30px', overflow: 'hidden', aspectRatio: '9/16', position: 'relative' }}>
                <img
                  src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80"
                  alt="Sample invitation preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '24px',
                }}>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', margin: '0 0 6px' }}>Together with their families</p>
                  <h3 style={{ color: '#fff', fontSize: '1.4rem', fontStyle: 'italic', margin: '0 0 4px' }}>Alexandra & Jordan</h3>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', margin: 0, letterSpacing: '0.12em' }}>October 15, 2026</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: '#fffdf9' }}>
        <SectionLabel>Kind Words</SectionLabel>
        <SectionHeading>Couples Who Trusted Luxora</SectionHeading>

        <div style={{ maxWidth: '620px', margin: '48px auto 0', textAlign: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIdx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45 }}
            >
              <div style={{ fontSize: '2rem', color: '#e5d9ce', marginBottom: '20px' }}>"</div>
              <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#4a3f35', fontStyle: 'italic', lineHeight: 1.75, margin: '0 0 24px' }}>
                {testimonials[testimonialIdx].quote}
              </p>
              <div style={{ width: '40px', height: '2px', background: '#b07f56', margin: '0 auto 18px' }} />
              <p style={{ fontSize: '0.85rem', color: '#b07f56', fontWeight: 700, margin: '0 0 4px' }}>
                {testimonials[testimonialIdx].name}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#b0a090', margin: 0, letterSpacing: '0.06em' }}>
                {testimonials[testimonialIdx].location}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                style={{
                  width: i === testimonialIdx ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === testimonialIdx ? '#b07f56' : '#e5d9ce',
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.3s',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Plans ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '96px 24px', background: 'linear-gradient(135deg, #faf4eb 0%, #f9ece9 100%)' }}>
        <SectionLabel>Pricing</SectionLabel>

        {user && subscription ? (
          /* ── Logged-in: subscription management ── */
          <>
            <SectionHeading>Your Current Plan</SectionHeading>
            <p style={{ textAlign: 'center', color: '#7b6a5d', fontSize: '0.95rem', maxWidth: '500px', margin: '8px auto 40px', lineHeight: 1.7 }}>
              Manage your subscription and billing preferences.
            </p>

            <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Plan card */}
              <div style={{ background: '#fffdf9', border: '2px solid #b07f56', borderRadius: '24px', padding: '32px 36px', boxShadow: '0 8px 32px rgba(176,127,86,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#b07f56', fontWeight: 700, marginBottom: '6px' }}>Active Plan</div>
                    <h3 style={{ fontSize: '1.6rem', fontStyle: 'italic', color: '#4a3f35', margin: '0 0 6px', fontWeight: 700 }}>
                      {planData.find(p => p.id === subscription.tier)?.name || subscription.tier}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#7b6a5d', margin: 0 }}>
                      {planData.find(p => p.id === subscription.tier)?.tagline || 'Your current subscription'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7b6a5d', marginBottom: '4px' }}>Renews</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4a3f35' }}>
                      {subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Live countdown */}
                {subTimeLeft && (
                  <div style={{ marginTop: '20px', padding: '16px 20px', background: `${urgentColor}10`, border: `1px solid ${urgentColor}44`, borderRadius: '14px' }}>
                    <div style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: urgentColor, fontWeight: 700, marginBottom: '10px' }}>
                      {daysLeft <= 7 ? '⚠️ Expiring Soon' : '⏳ Time Remaining'}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      {[
                        { val: subTimeLeft.d, label: 'Days' },
                        { val: subTimeLeft.h, label: 'Hours' },
                        { val: subTimeLeft.m, label: 'Mins' },
                        { val: subTimeLeft.s, label: 'Secs' },
                      ].map(u => (
                        <div key={u.label} style={{ textAlign: 'center', minWidth: '52px', padding: '8px', background: '#fffdf9', borderRadius: '10px', border: `1px solid ${urgentColor}30` }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: urgentColor, lineHeight: 1 }}>
                            {String(u.val).padStart(2, '0')}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: '#b0a090', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>{u.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {subExpired && (
                  <div style={{ marginTop: '16px', padding: '14px 18px', background: '#fdeaea', border: '1px solid #f0b0b0', borderRadius: '12px', textAlign: 'center' }}>
                    <p style={{ color: '#b04a4a', fontWeight: 700, fontSize: '0.88rem', margin: '0 0 4px' }}>Your subscription has expired</p>
                    <p style={{ color: '#7b6a5d', fontSize: '0.78rem', margin: 0 }}>Renew to keep your invitation page online.</p>
                  </div>
                )}
              </div>

              {/* Auto-pay toggle */}
              <div style={{ background: '#fffdf9', border: '1.5px solid #e5d9ce', borderRadius: '18px', padding: '24px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: '#4a3f35', margin: '0 0 4px', fontWeight: 700 }}>Auto-Pay</h4>
                    <p style={{ fontSize: '0.82rem', color: '#7b6a5d', margin: 0 }}>
                      Automatically renew your subscription when the countdown hits zero.
                    </p>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={toggleAutoPay}
                    disabled={autoPaySaving}
                    style={{
                      width: '52px', height: '28px', borderRadius: '14px', border: 'none',
                      background: autoPay ? '#4a7c59' : '#e5d9ce',
                      cursor: 'pointer', position: 'relative', flexShrink: 0,
                      transition: 'background 0.25s', opacity: autoPaySaving ? 0.6 : 1,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: '4px', left: autoPay ? '28px' : '4px',
                      width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                      transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#b0a090', margin: 0, lineHeight: 1.6, borderTop: '1px solid #f0ece8', paddingTop: '10px' }}>
                  {autoPay
                    ? '✓ Auto-pay is ON — your plan will renew automatically using your saved payment method via PayMongo.'
                    : 'Auto-pay is OFF — you will need to manually renew before expiry to keep your invitation online.'}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/pricing" style={{ flex: '1 1 200px' }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{ width: '100%', padding: '13px', borderRadius: '14px', border: 'none', background: '#b07f56', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    View or Change Plan →
                  </motion.button>
                </Link>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/dashboard')} style={{ flex: '1 1 140px', padding: '13px', borderRadius: '14px', border: '1.5px solid #e5d9ce', background: 'transparent', color: '#4a3f35', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Dashboard
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          /* ── Guest: normal pricing cards ── */
          <>
            <SectionHeading>Pick Your Perfect Plan</SectionHeading>
            <p style={{ textAlign: 'center', color: '#7b6a5d', fontSize: '0.95rem', maxWidth: '500px', margin: '-8px auto 48px', lineHeight: 1.7 }}>
              Every plan includes a shareable link, countdown timer, and mobile-friendly design.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', maxWidth: '980px', margin: '0 auto' }}>
              {planData.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1 }}
                  style={{ background: plan.bg, border: `2px solid ${plan.popular ? plan.accent : '#e5d9ce'}`, borderRadius: '24px', padding: '36px 28px', position: 'relative', boxShadow: plan.popular ? `0 12px 40px ${plan.accent}28` : '0 4px 16px rgba(0,0,0,0.05)' }}
                >
                  {plan.popular && (
                    <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: plan.accent, color: '#fff', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 18px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                      Most Popular
                    </div>
                  )}
                  <div style={{ fontSize: '0.62rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: plan.accent, fontWeight: 700, marginBottom: '8px' }}>{plan.badge}</div>
                  <h3 style={{ fontSize: '1.4rem', fontStyle: 'italic', color: '#4a3f35', margin: '0 0 8px', fontWeight: 700 }}>{plan.name}</h3>
                  <p style={{ fontSize: '0.82rem', color: '#7b6a5d', margin: '0 0 20px', lineHeight: 1.6 }}>{plan.tagline}</p>
                  <div style={{ marginBottom: '24px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 700, color: plan.accent }}>{plan.price}</span>
                    <span style={{ fontSize: '0.8rem', color: '#b0a090', marginLeft: '4px' }}>{plan.cycle}</span>
                  </div>
                  <div style={{ height: '1px', background: '#e5d9ce', marginBottom: '20px' }} />
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', fontSize: '0.85rem', color: '#4a3f35', lineHeight: 1.5 }}>
                        <span style={{ color: plan.accent, flexShrink: 0, fontSize: '0.6rem', marginTop: '4px' }}>✦</span>{f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/pricing">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      style={{ width: '100%', padding: '13px', borderRadius: '14px', border: plan.popular ? 'none' : `1.5px solid ${plan.accent}`, background: plan.popular ? plan.accent : 'transparent', color: plan.popular ? '#fff' : plan.accent, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em' } as React.CSSProperties}>
                      {plan.popular ? 'Get Started →' : 'Choose Plan →'}
                    </motion.button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '96px 24px', textAlign: 'center' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.35)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(74,63,53,0.5)' }} />

        <div style={{ position: 'relative', maxWidth: '640px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div style={{ fontSize: '1.6rem', marginBottom: '16px' }}>♡</div>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', color: '#fff', fontStyle: 'italic', margin: '0 0 16px', lineHeight: 1.2 }}>
              Ready to Celebrate?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', margin: '0 auto 36px', lineHeight: 1.7, maxWidth: '460px' }}>
              Your invitation is waiting to be made. Set it up in minutes — no tech experience needed.
            </p>
            <Link to={user ? '/dashboard' : '/pricing'}>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 16px 48px rgba(176,127,86,0.6)' }}
                whileTap={{ scale: 0.97 }}
                style={{ padding: '18px 52px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg, #b07f56, #c9965e)', color: '#fff', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 32px rgba(176,127,86,0.45)', letterSpacing: '0.04em' }}
              >
                {user ? 'Go to Dashboard →' : 'Create Your Invitation'}
              </motion.button>
            </Link>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', marginTop: '14px' }}>
              {user ? 'Your invitation is live.' : 'Starting at ₱500 / month'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#fffdf9', borderTop: '1px solid #e5d9ce', padding: '48px 32px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <span style={{ fontSize: '1.5rem', fontStyle: 'italic', color: '#4a3f35', fontWeight: 700 }}>Luxora</span>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <Link to="/pricing"  style={footerLink}>Pricing</Link>
            <Link to="/login"    style={footerLink}>Sign In</Link>
            <Link to="/register" style={footerLink}>Create Account</Link>
          </div>
          <p style={{ color: '#b0a090', fontSize: '0.78rem', margin: 0 }}>© 2024 Luxora. Made with love in the Philippines.</p>
        </div>
      </footer>
    </div>
  );
}

// ─── Micro-components ────────────────────────────────────────────────────────

function NavBtn({ children, onClick, filled }: { children: React.ReactNode; onClick?: () => void; filled?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        padding: '9px 20px', borderRadius: '20px', fontFamily: '"Playfair Display", Georgia, serif',
        fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
        border: filled ? 'none' : '1.5px solid #e5d9ce',
        background: filled ? '#b07f56' : 'transparent',
        color: filled ? '#fff' : '#4a3f35',
        boxShadow: filled ? '0 4px 14px rgba(176,127,86,0.28)' : 'none',
      }}
    >
      {children}
    </motion.button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
      <div style={{ width: '32px', height: '1px', background: '#b07f56' }} />
      <span style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#b07f56', fontWeight: 700 }}>
        {children}
      </span>
      <div style={{ width: '32px', height: '1px', background: '#b07f56' }} />
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', color: '#4a3f35', fontStyle: 'italic', margin: '0 0 0', fontWeight: 400, lineHeight: 1.2 }}>
      {children}
    </h2>
  );
}

const footerLink: React.CSSProperties = {
  color: '#7b6a5d', fontSize: '0.85rem', textDecoration: 'none', fontFamily: '"Playfair Display", Georgia, serif',
};

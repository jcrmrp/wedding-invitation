import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const inputStyle = {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: '1.5px solid #e5d9ce', background: '#fffdf9',
    color: '#4a3f35', fontSize: '0.95rem', outline: 'none',
    boxSizing: 'border-box' as const, fontFamily: 'inherit',
    transition: 'border-color 0.2s',
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }

    // Check if they already have a filled wedding record
    const userId = data.user?.id;
    if (userId) {
      const { data: wedding } = await supabase
        .from('weddings')
        .select('couple_names')
        .eq('user_id', userId)
        .single();

      if (!wedding || !wedding.couple_names || wedding.couple_names === 'Name & Name') {
        navigate('/onboarding');
        return;
      }
    }
    navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #faf4eb 0%, #f9ece9 100%)',
      padding: '20px', fontFamily: '"Playfair Display", Georgia, serif',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          background: '#fffdf9', borderRadius: '28px', padding: '48px 44px',
          width: '100%', maxWidth: '420px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #e5d9ce',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: '10px' }}>♡</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, fontStyle: 'italic', color: '#4a3f35', margin: '0 0 8px' }}>
            Welcome Back
          </h1>
          <p style={{ color: '#7b6a5d', fontSize: '0.85rem', margin: 0, letterSpacing: '0.03em' }}>
            Sign in to manage your invitation
          </p>
        </div>

        {/* Google button */}
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={{
            width: '100%', padding: '13px', borderRadius: '12px',
            border: '1.5px solid #e5d9ce', background: '#ffffff',
            color: '#4a3f35', fontSize: '0.9rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px', marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontFamily: 'inherit',
            transition: 'box-shadow 0.2s',
          }}
        >
          {/* Google icon */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </motion.button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5d9ce' }} />
          <span style={{ fontSize: '0.72rem', color: '#b0a090', letterSpacing: '0.1em' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e5d9ce' }} />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7b6a5d', fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email" required placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#b07f56')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5d9ce')}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '7px', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7b6a5d', fontWeight: 600 }}>
              Password
            </label>
            <input
              type="password" required placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#b07f56')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5d9ce')}
            />
          </div>

          {error && (
            <p style={{ color: '#c0392b', fontSize: '0.82rem', margin: 0, textAlign: 'center' }}>{error}</p>
          )}

          <motion.button
            type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              background: '#b07f56', color: '#ffffff', fontSize: '0.88rem',
              fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(176,127,86,0.3)', transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </form>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.83rem', color: '#7b6a5d' }}>
          Don't have an account?{' '}
          <Link to="/pricing" style={{ color: '#b07f56', fontWeight: 700, textDecoration: 'none' }}>
            Create your invitation →
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

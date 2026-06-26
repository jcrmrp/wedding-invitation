import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState('essential');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return alert(authError.message);
    if (!authData.user?.id) return;

    alert('Account created successfully! Please choose your plan to get started.');
    navigate('/pricing');
  };

  const plans = [
    { id: 'essential', label: 'The Essential Plan — ₱500/mo' },
    { id: 'storyteller', label: 'The Storyteller Plan — ₱700/mo' },
    { id: 'keepsake-20', label: 'The Keepsake Plan — ₱5,000/yr (20 images)' },
    { id: 'keepsake-50', label: 'The Keepsake Plan — ₱6,000/yr (50 images)' },
    { id: 'keepsake-100', label: 'The Keepsake Plan — ₱7,000/yr (100 images)' },
    { id: 'keepsake-200', label: 'The Keepsake Plan — ₱10,000/yr (200 images)' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #faf4eb 0%, #f9ece9 100%)',
      padding: '20px', fontFamily: '"Playfair Display", Georgia, serif',
    }}>
      <div style={{
        background: '#fffdf9', borderRadius: '28px', padding: '48px 44px',
        width: '100%', maxWidth: '420px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #e5d9ce',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '1.6rem', marginBottom: '10px' }}>♡</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, fontStyle: 'italic', color: '#4a3f35', margin: '0 0 8px' }}>
            Create Account
          </h1>
          <p style={{ color: '#7b6a5d', fontSize: '0.85rem', margin: 0, letterSpacing: '0.03em' }}>
            Start your wedding invitation journey
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block', marginBottom: '7px', fontSize: '0.72rem',
              letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7b6a5d', fontWeight: 600,
            }}>
              Email
            </label>
            <input
              type="email" required placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: '12px',
                border: '1.5px solid #e5d9ce', background: '#fffdf9',
                color: '#4a3f35', fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#b07f56')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5d9ce')}
            />
          </div>
          <div>
            <label style={{
              display: 'block', marginBottom: '7px', fontSize: '0.72rem',
              letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7b6a5d', fontWeight: 600,
            }}>
              Password
            </label>
            <input
              type="password" required placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: '12px',
                border: '1.5px solid #e5d9ce', background: '#fffdf9',
                color: '#4a3f35', fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#b07f56')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e5d9ce')}
            />
          </div>

          <div>
            <label style={{
              display: 'block', marginBottom: '7px', fontSize: '0.72rem',
              letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7b6a5d', fontWeight: 600,
            }}>
              Select Plan
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              style={{
                width: '100%', padding: '13px 16px', borderRadius: '12px',
                border: '1.5px solid #e5d9ce', background: '#fffdf9',
                color: '#4a3f35', fontSize: '0.95rem', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" style={{
            width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
            background: '#b07f56', color: '#ffffff', fontSize: '0.88rem',
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(176,127,86,0.3)',
            marginTop: '8px',
          }}>
            Create Account
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.83rem', color: '#7b6a5d' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#b07f56', fontWeight: 700, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
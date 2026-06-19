import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function RequireAuth({ children }: { children: React.JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!cancelled) {
          setAuthed(!!user);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setAuthed(false);
          setLoading(false);
        }
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#7b6a5d', background: '#faf4eb' }}>Loading…</div>
    );
  }
  if (!authed) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

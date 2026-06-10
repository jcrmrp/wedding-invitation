import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState('A');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) return alert(authError.message);
    const userId = authData.user?.id;
    if (!userId) return;

    // 2. Insert into users table
    await supabase.from('users').insert({ id: userId, email });

    // 3. Create Subscription
    const { data: subData, error: subError } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, tier: tier, status: 'active' })
      .select()
      .single();

    if (subError) return alert("Subscription setup failed: " + subError.message);

    // 4. Initialize Wedding record
    if (subData) {
      await supabase.from('weddings').insert({
        user_id: userId,
        subscription_id: subData.id,
        title: "My Wedding",
        couple_names: "Name & Name",
        is_published: false
      });
    }

    alert("Account created successfully!");
    navigate('/dashboard');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Create Account</h1>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        
        <label>Select Subscription Tier:</label>
        <select onChange={(e) => setTier(e.target.value)} value={tier}>
          <option value="A">Tier A - Basic</option>
          <option value="B">Tier B - Standard</option>
          <option value="C">Tier C - Premium</option>
        </select>
        
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
}

export default Register;
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

function classifyTemplate(guestCount: number, hasRegisty: boolean, hasStory: boolean, hasGuestWall: boolean, plan: string): { id: string; confidence: number; reason: string }[] {
  const recs: { id: string; confidence: number; reason: string }[] = [];
  if (guestCount <= 50) {
    recs.push({ id: 'essential', confidence: 100, reason: 'Small guest list — Essential Plan covers all your needs' });
  }
  if (guestCount > 50 && guestCount <= 100) {
    recs.push({ id: 'storyteller', confidence: 90, reason: `${guestCount} guests with full features` });
  }
  if (hasGuestWall && guestCount > 50) recs.push({ id: 'keepsake-100', confidence: 95, reason: 'Guest photo wall adds storage needs for media-rich interactions' });
  recs.sort((a, b) => b.confidence - a.confidence);
  recs.push({ id: plan, confidence: recs.length ? 60 : 100, reason: 'Your current plan matches typical usage' });
  return recs;
}

function SmartTemplates() {
  const [weddingId, setWeddingId] = useState('');
  const [plan, setPlan] = useState('essential');
  const [guestCount, setGuestCount] = useState(0);
  const [hasRegistry, setHasRegistry] = useState(false);
  const [hasStory, setHasStory] = useState(false);
  const [hasGuestWall, setHasGuestWall] = useState(false);
  const [recommendations, setRecommendations] = useState<{ id: string; confidence: number; reason: string }[]>([]);
  const [applying, setApplying] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: wedding } = await supabase.from('weddings').select('*').eq('user_id', user.id).maybeSingle();
    if (wedding) {
      setWeddingId(wedding.id);
      setPlan(wedding.plan || 'essential');
      setHasRegistry(!!wedding.gcash_number);
      setHasStory(!!wedding.story);
      setHasGuestWall(wedding.guest_photo_wall_enabled || false);
    }

    const { count } = await supabase.from('guests').select('*', { count: 'exact', head: true }).eq('wedding_id', wedding?.id || '');
    if (count !== null) setGuestCount(count);

    if (wedding?.id) {
      const recs = classifyTemplate(count || 0, hasRegistry, hasStory, hasGuestWall, wedding.plan || 'essential');
      setRecommendations(recs);
      for (const rec of recs.slice(0, 3)) {
        supabase.from('template_recommendations').insert({
          user_id: user.id,
          wedding_id: wedding.id,
          recommended_template: rec.id,
          reason: rec.reason,
        });
      }
    }
  };

  const applyPlan = async (planId: string) => {
    setApplying(true);
    await supabase.from('weddings').update({ plan: planId }).eq('id', weddingId);
    setPlan(planId);
    alert(`Plan applied: ${planId}`);
    setApplying(false);
  };

  const plans = [
    { id: 'essential', label: 'Essential', desc: 'Perfect for small intimate ceremonies', price: '500/mo', features: ['1 image', 'Basic countdown', 'RSVP'] },
    { id: 'storyteller', label: 'Storyteller', desc: 'Share your full love story', price: '700/mo', features: ['5 photos', 'Your Journey story', 'Gift registry'] },
    { id: 'keepsake-20', label: 'Keepsake 20', desc: 'Beautiful gallery with 20 photos', price: '5K/yr', features: ['20 images', 'Full gallery', 'Guest photo wall compatible'] },
    { id: 'keepsake-100', label: 'Keepsake 100', desc: 'Rich media experience', price: '7K/yr', features: ['100 images', 'Guest photo wall', 'Priority support'] },
    { id: 'keepsake-200', label: 'Keepsake 200', desc: 'Ultimate wedding keepsake', price: '10K/yr', features: ['200 images', 'All features', 'Custom domain'] },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 400, color: '#4a3f35', margin: '0 0 8px', fontFamily: 'Georgia, serif' }}>✨ Smart Template Recommendations</h1>
        <p style={{ color: '#7b6a5d', fontSize: '1rem', maxWidth: '600px', lineHeight: 1.6 }}>
          Based on your guest list size, story, registry setup, and usage patterns, we recommend:
        </p>
      </div>

      {/* AI Recommendations */}
      <div style={{ display: 'grid', gap: '12px', marginBottom: '36px' }}>
        {recommendations.length > 0 && recommendations.slice(0, 3).map((rec, i) => (
          <motion.div key={rec.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            style={{ padding: '16px 20px', background: i === 0 ? '#f5e6d8' : '#fffdf9', border: `1.5px solid ${i === 0 ? '#b07f56' : '#e5d9ce'}`, borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '1.5rem' }}>{i === 0 ? '🏆' : '💡'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#4a3f35', marginBottom: '4px', fontFamily: 'Georgia, serif' }}>
                {plans.find(p => p.id === rec.id)?.label || rec.id} {i === 0 && <span style={{ fontSize: '0.7rem', background: '#b07f56', color: '#fff', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' }}>TOP PICK</span>}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#7b6a5d', lineHeight: 1.5 }}>{rec.reason}</div>
              <div style={{ fontSize: '0.72rem', color: '#b07f56', marginTop: '4px', fontWeight: 600 }}>{rec.confidence}% match</div>
            </div>
            <button onClick={() => applyPlan(rec.id)} disabled={applying} style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: '#b07f56', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Georgia, serif', opacity: applying ? 0.6 : 1 }}>
              {applying ? 'Applying...' : rec.id === plan ? 'Current' : 'Apply'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* All Plans Grid */}
      <h2 style={{ fontSize: '1.1rem', color: '#4a3f35', margin: '0 0 16px', fontFamily: 'Georgia, serif' }}>All Available Templates</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {plans.map(p => (
          <motion.div key={p.id} whileHover={{ y: -4 }} style={{ padding: '20px', borderRadius: '16px', background: plan === p.id ? '#f5e6d8' : '#fffdf9', border: plan === p.id ? '2px solid #b07f56' : '1.5px solid #e5d9ce', boxShadow: '0 2px 8px rgba(176,127,86,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#4a3f35', margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>{p.label}</h3>
                <p style={{ fontSize: '0.78rem', color: '#7b6a5d', margin: 0 }}>{p.desc}</p>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b07f56', fontFamily: 'Georgia, serif' }}>{p.price}</span>
            </div>
            <ul style={{ margin: '12px 0 16px', paddingLeft: '16px', fontSize: '0.78rem', color: '#7b6a5d', lineHeight: 1.8 }}>
              {p.features.map(f => <li key={f}>{f}</li>)}
            </ul>
            <button onClick={() => applyPlan(p.id)} disabled={applying} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: plan === p.id ? 'none' : '1.5px solid #e5d9ce', background: plan === p.id ? '#b07f56' : 'transparent', color: plan === p.id ? '#fff' : '#b07f56', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'Georgia, serif', transition: 'all 0.2s' }}>
              {plan === p.id ? 'Active Plan' : 'Switch to this Plan'}
            </button>
          </motion.div>
        ))}
      </div>

      {guestCount > 0 && <div style={{ textAlign: 'center', color: '#7b6a5d', fontSize: '0.82rem' }}>Guest list size: {guestCount} guests</div>}
    </div>
  );
}

export default SmartTemplates;

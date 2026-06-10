import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Home from '../Home';
import { useNavigate } from 'react-router-dom';

type WeddingRecord = {
  id: string;
  couple_names?: string;
  wedding_date?: string;
  venue?: string;
  description?: string;
  story?: string;
  music_url?: string;
  live_stream_url?: string;
  gcash_number?: string;
  gcash_qr_url?: string;
  dress_code_primary_color?: string;
  dress_code_secondary_color?: string;
  dress_code_message?: string;
  guest_photo_wall_enabled?: boolean;
  photobooth_enabled?: boolean;
  plan?: string;
  custom_url?: string;
  entourage?: Record<string, string[]>;
  is_published?: boolean;
  [key: string]: unknown;
};

export default function PreviewMode() {
  const { weddingId } = useParams<{ weddingId: string }>();
  const navigate = useNavigate();
  const [wedding, setWedding] = useState<WeddingRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!weddingId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('weddings')
        .select('*')
        .eq('id', weddingId)
        .maybeSingle();
      if (error) console.error('Preview fetch error:', error);
      setWedding(data);
      setLoading(false);
    };
    fetchPreview();
  }, [weddingId]);

  const invitationData = wedding ? {
    names:    wedding.couple_names || '',
    date:     wedding.wedding_date || '',
    venue:    wedding.venue || '',
    message:  wedding.description || '',
    story:    wedding.story || '',
    musicUrl: wedding.music_url || '',
    liveStreamUrl: wedding.live_stream_url || '',
    custom_url: wedding.custom_url || '',
    isGuestPhotoWallEnabled: wedding.guest_photo_wall_enabled || false,
  } : {};

  const slug = wedding?.custom_url || weddingId || '';

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#7b6a5d' }}>Loading preview…</div>
  );

  if (!wedding) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontFamily: 'Georgia, serif', color: '#4a3f35', background: '#faf4eb', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 400, margin: '0 0 8px' }}>Preview Unavailable</h2>
      <p style={{ color: '#7b6a5d', maxWidth: '400px' }}>This invitation has not been published yet or the link is invalid.</p>
    </div>
  );

  return (
    <div style={{ background: '#faf4eb', minHeight: '100vh' }}>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, padding: '10px 20px', zIndex: 9999,
        background: 'rgba(74,63,53,0.92)', color: '#fff', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.9 }}>🔒 Preview Mode</span>
          <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>— invitation is not published</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Public URL: <code style={{ background: 'rgba(0,0,0,0.35)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem' }}>/invite/{slug}</code></span>
          <button onClick={() => navigate(-1)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>← Back</button>
        </div>
      </div>
      <div style={{ paddingTop: '56px' }}>
        <Home invitationData={invitationData} isEditing={false} plan={wedding.plan} />
      </div>
    </div>
  );
}

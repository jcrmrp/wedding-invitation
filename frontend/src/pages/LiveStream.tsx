import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

function LiveStreamIntegration() {
  const [weddingId, setWeddingId] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wedding, setWedding] = useState<any>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [previewMode, setPreviewMode] = useState<'youtube' | 'url' | 'none'>('none');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: w } = await supabase.from('weddings').select('*').eq('user_id', user.id).maybeSingle();
    if (w) {
      setWedding(w);
      setWeddingId(w.id);
      setStreamUrl(w.live_stream_url || '');
    }
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('weddings').update({ live_stream_url: streamUrl }).eq('id', weddingId);
    if (error) { alert('Save failed: ' + error.message); }
    else { alert('Live stream settings saved!'); loadData(); }
    setSaving(false);
  };

  const embedUrl = extractVideoId(streamUrl);

  const providers: { id: string; label: string; placeholder: string; icon: string }[] = [
    { id: 'youtube', label: 'YouTube Live', placeholder: 'https://www.youtube.com/watch?v=...', icon: '▶️' },
    { id: 'facebook', label: 'Facebook Live', placeholder: 'https://www.facebook.com/...', icon: '📘' },
    { id: 'zoom', label: 'Zoom Meeting', placeholder: 'https://zoom.us/j/...', icon: '💻' },
    { id: 'vimeo', label: 'Vimeo', placeholder: 'https://vimeo.com/...', icon: '🎬' },
    { id: 'other', label: 'Custom Stream', placeholder: 'https://...', icon: '🌐' },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 400, color: '#4a3f35', margin: '0 0 20px', fontFamily: 'Georgia, serif' }}>📡 Live Stream Integration</h1>

      {/* Info Banner */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '16px 20px', background: '#f5e6d8', borderRadius: '12px', border: '1px solid #e5d9ce', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#4a3f35', margin: '0 0 4px', fontWeight: 600 }}>Let guests attend from anywhere</p>
              <p style={{ fontSize: '0.78rem', color: '#7b6a5d', margin: 0, lineHeight: 1.5 }}>Paste your live stream URL and guests will be able to watch the ceremony directly from your invitation.</p>
            </div>
            <button onClick={() => setShowInfo(false)} style={{ background: 'none', border: 'none', color: '#b07f56', cursor: 'pointer', fontSize: '1.2rem', flexShrink: 0 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* URL Input */}
        <div style={{ padding: '24px', background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#7b6a5d', display: 'block', marginBottom: '8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Stream URL</label>
          <input
            value={streamUrl}
            onChange={e => { setStreamUrl(e.target.value); setPreviewMode(extractVideoId(e.target.value) ? 'youtube' : e.target.value ? 'url' : 'none'); }}
            placeholder="https://www.youtube.com/watch?v=..."
            style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #e5d9ce', background: '#faf4eb', fontSize: '0.9rem', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {providers.map(p => (
              <button key={p.id} onClick={() => document.querySelector('input')?.focus()} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5d9ce', background: '#faf4eb', cursor: 'pointer', fontSize: '0.75rem', color: '#7b6a5d', fontWeight: 500 }}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          <button onClick={handleSave} disabled={saving} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#b07f56', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Georgia, serif', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving...' : '💾 Save Stream URL'}
          </button>
        </div>

        {/* Preview */}
        {previewMode !== 'none' && (
          <div style={{ padding: '20px', background: '#fffdf9', borderRadius: '14px', border: '1px solid #e5d9ce' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4a3f35', margin: '0 0 14px', fontFamily: 'Georgia, serif' }}>Preview</h3>
            {previewMode === 'youtube' && embedUrl ? (
              <div style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
                <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${embedUrl}`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen style={{ display: 'block' }} title="Live Stream Preview" />
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', background: '#faf4eb', borderRadius: '10px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📡</div>
                <p style={{ fontSize: '0.85rem', color: '#7b6a5d', margin: '0 0 8px' }}>Custom stream URL</p>
                <code style={{ fontSize: '0.78rem', color: '#b07f56', wordBreak: 'break-all' }}>{streamUrl}</code>
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 18px', background: '#faf8f5', borderRadius: '10px', border: '1px solid #e5d9ce' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: streamUrl ? '#4a7c59' : '#b07f56' }} />
          <span style={{ fontSize: '0.82rem', color: '#4a3f35', fontWeight: 600 }}>{streamUrl ? 'Stream configured' : 'No stream configured'}</span>
          <span style={{ fontSize: '0.75rem', color: '#7b6a5d' }}>Guests will see this when viewing your invitation</span>
        </div>

        {/* Feature Card */}
        <div style={{ padding: '18px', background: 'f5f0eb', borderRadius: '12px', border: '1px solid #e5d9ce' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#4a3f35', fontFamily: 'Georgia, serif', margin: '0 0 8px' }}>How it works</h3>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#7b6a5d', lineHeight: 1.8 }}>
            <li>Paste a YouTube Live or Facebook Live URL</li>
            <li>The embed will appear on your invitation for guests to watch</li>
            <li>Guests don't need to leave your invitation to watch the ceremony</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LiveStreamIntegration;

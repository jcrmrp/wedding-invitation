import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

// ── Filter definitions ────────────────────────────────────────────────────────
const FILTERS: { id: string; label: string; css: string; preview: string }[] = [
  { id: 'none',      label: 'Natural',   css: 'none',                                                      preview: '#f5e6d8' },
  { id: 'warm',      label: 'Golden',    css: 'sepia(0.35) brightness(1.1) saturate(1.2)',                  preview: '#e8c87a' },
  { id: 'vintage',   label: 'Vintage',   css: 'sepia(0.6) contrast(0.9) brightness(1.05) saturate(0.8)',    preview: '#c8a86e' },
  { id: 'bw',        label: 'B&W',       css: 'grayscale(1) contrast(1.1)',                                 preview: '#888' },
  { id: 'cool',      label: 'Moonlit',   css: 'hue-rotate(200deg) saturate(0.9) brightness(1.05)',          preview: '#7ab0d4' },
  { id: 'dramatic',  label: 'Dramatic',  css: 'contrast(1.4) saturate(1.3) brightness(0.9)',                preview: '#6b4c3b' },
  { id: 'rose',      label: 'Rose',      css: 'sepia(0.2) saturate(1.4) hue-rotate(330deg) brightness(1.05)', preview: '#e8a0a8' },
  { id: 'dreamy',    label: 'Dreamy',    css: 'blur(0.4px) brightness(1.15) saturate(0.85) sepia(0.15)',    preview: '#d4c8e8' },
];

// ── Frame / template definitions ──────────────────────────────────────────────
interface FrameTemplate {
  id: string;
  label: string;
  description: string;
  render: (coupleName: string, accent: string, secondary: string) => React.CSSProperties & { _overlayContent?: React.ReactNode };
}

const BUILT_IN_FRAMES: { id: string; label: string; icon: string; borderStyle: (a: string, s: string) => React.CSSProperties; overlayStyle: (a: string, s: string) => React.CSSProperties; textStyle: (a: string) => React.CSSProperties }[] = [
  {
    id: 'none',
    label: 'No Frame',
    icon: '□',
    borderStyle: () => ({ border: 'none' }),
    overlayStyle: () => ({}),
    textStyle: () => ({}),
  },
  {
    id: 'classic',
    label: 'Classic',
    icon: '❧',
    borderStyle: (a) => ({ border: `6px solid ${a}`, borderRadius: '4px' }),
    overlayStyle: (a) => ({ background: `linear-gradient(to bottom, transparent 65%, ${a}dd 100%)` }),
    textStyle: (a) => ({ color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.7)', fontStyle: 'italic' }),
  },
  {
    id: 'floral',
    label: 'Floral',
    icon: '✿',
    borderStyle: (a, s) => ({ border: `8px solid ${s}`, outline: `3px solid ${a}`, outlineOffset: '-12px', borderRadius: '2px' }),
    overlayStyle: (a) => ({ background: `linear-gradient(to bottom, ${a}22 0%, transparent 20%, transparent 70%, ${a}99 100%)` }),
    textStyle: () => ({ color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,0.8)', letterSpacing: '0.1em', fontStyle: 'italic' }),
  },
  {
    id: 'minimal',
    label: 'Minimal',
    icon: '—',
    borderStyle: (a) => ({ borderBottom: `4px solid ${a}`, borderTop: `4px solid ${a}`, borderLeft: 'none', borderRight: 'none' }),
    overlayStyle: (a) => ({ background: `linear-gradient(to bottom, transparent 70%, rgba(0,0,0,0.55) 100%)` }),
    textStyle: () => ({ color: '#fff', letterSpacing: '0.14em', textTransform: 'uppercase' as const, fontSize: '0.85em' }),
  },
  {
    id: 'polaroid',
    label: 'Polaroid',
    icon: '📷',
    borderStyle: () => ({ border: '14px solid #fff', borderBottom: '52px solid #fff', borderRadius: '2px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }),
    overlayStyle: () => ({}),
    textStyle: (a) => ({ color: a, fontFamily: 'cursive', fontSize: '1.1em', marginTop: '8px', position: 'absolute' as const, bottom: '-44px', left: 0, right: 0, textAlign: 'center' as const }),
  },
];

function Photobooth() {
  const { coupleName } = useParams<{ coupleName: string }>();
  const [wedding, setWedding] = useState<any>(null);
  const [primaryColor, setPrimaryColor] = useState('#b07f56');
  const [secondaryColor, setSecondaryColor] = useState('#e5d9ce');
  const [loading, setLoading] = useState(true);

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Options
  const [activeFilter, setActiveFilter] = useState('none');
  const [activeFrame, setActiveFrame] = useState('none');
  const [customFrameUrl, setCustomFrameUrl] = useState('');
  const [tab, setTab] = useState<'filters' | 'frames'>('filters');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!coupleName) return;
    supabase.from('weddings').select('*').eq('custom_url', coupleName).eq('is_published', true).maybeSingle()
      .then(async ({ data }) => {
        const record = data || (await supabase.from('weddings').select('*').ilike('couple_names', coupleName).eq('is_published', true).maybeSingle()).data;
        if (record) {
          setWedding(record);
          setPrimaryColor(record.dress_code_primary_color || '#b07f56');
          setSecondaryColor(record.dress_code_secondary_color || '#e5d9ce');
        }
        setLoading(false);
      });
  }, [coupleName]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 960 } });
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
    } catch { alert('Unable to access camera. Please allow permission and try again.'); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  const triggerCountdown = () => {
    setCountdown(3);
    let c = 3;
    const t = setInterval(() => {
      c--;
      if (c <= 0) { clearInterval(t); setCountdown(null); takePhoto(); }
      else setCountdown(c);
    }, 1000);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1280; canvas.height = 960;
    const ctx = canvas.getContext('2d')!;
    const filter = FILTERS.find(f => f.id === activeFilter);
    ctx.filter = filter?.css === 'none' ? '' : filter?.css || '';
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/png'));
    stopCamera();
  };

  const savePhoto = async () => {
    if (!capturedImage || !wedding?.id) return;
    setSaving(true);
    const blob = await (await fetch(capturedImage)).blob();
    const path = `${wedding.id}/photobooth/${Date.now()}.png`;
    const { error: upErr } = await supabase.storage.from('wedding-assets').upload(path, blob, { upsert: true, contentType: 'image/png' });
    if (upErr) { alert('Upload failed: ' + upErr.message); setSaving(false); return; }
    const { data: urlData } = supabase.storage.from('wedding-assets').getPublicUrl(path);
    const { error: dbErr } = await supabase.from('guest_photos').insert({ wedding_id: wedding.id, guest_name: 'Guest', image_url: urlData.publicUrl, caption: `Photobooth — ${wedding.couple_names || ''}`, is_approved: true });
    if (dbErr) alert('Save failed: ' + dbErr.message);
    else { setCapturedImage(null); alert('Photo saved to the guest photo wall! 🎉'); }
    setSaving(false);
  };

  const downloadPhoto = () => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `${wedding?.couple_names || 'wedding'}-photobooth-${Date.now()}.png`;
    a.click();
  };

  const selectedFilter = FILTERS.find(f => f.id === activeFilter);
  const selectedFrame = BUILT_IN_FRAMES.find(f => f.id === activeFrame);
  const coupleNames = (wedding?.couple_names || coupleName || 'The Couple').replace(/-/g, ' ').replace(/\band\b/g, '&');

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Playfair Display", Georgia, serif', color: '#7b6a5d', background: '#faf4eb' }}>
      Loading photobooth…
    </div>
  );

  if (!wedding) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Playfair Display", Georgia, serif', color: '#4a3f35', background: '#faf4eb' }}>
      Wedding not found
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#faf4eb', fontFamily: '"Playfair Display", Georgia, serif', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: primaryColor, fontWeight: 700, marginBottom: '8px' }}>Wedding Photobooth</div>
        <h1 style={{ fontSize: '2rem', color: '#4a3f35', margin: '0 0 6px', fontWeight: 400, fontStyle: 'italic' }}>{coupleNames}</h1>
        <p style={{ color: '#7b6a5d', fontSize: '0.88rem', margin: 0 }}>Strike a pose and take a memory home ✨</p>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '24px', alignItems: 'start' }}>

        {/* ── Camera / Preview ─────────────────────────────────────────── */}
        <div>
          {/* Viewfinder */}
          <div style={{
            position: 'relative', borderRadius: '20px', overflow: 'hidden',
            aspectRatio: '4/3',
            ...selectedFrame?.borderStyle(primaryColor, secondaryColor),
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            background: '#111',
            marginBottom: '16px',
          }}>
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: selectedFilter?.css === 'none' ? '' : selectedFilter?.css }} />
            ) : (
              <>
                <video ref={canvasRef as any} style={{ display: 'none' }} />
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: selectedFilter?.css === 'none' ? '' : selectedFilter?.css }} />
                {!cameraActive && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', color: '#fff', gap: '10px' }}>
                    <span style={{ fontSize: '2.5rem' }}>📸</span>
                    <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Tap Start Camera to begin</span>
                  </div>
                )}
              </>
            )}

            {/* Frame overlay */}
            {selectedFrame && selectedFrame.id !== 'none' && (
              <div style={{ position: 'absolute', inset: 0, ...selectedFrame.overlayStyle(primaryColor, secondaryColor), display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: selectedFrame.id === 'polaroid' ? 0 : '16px', pointerEvents: 'none' }}>
                {selectedFrame.id !== 'polaroid' && (
                  <span style={{ ...selectedFrame.textStyle(primaryColor), fontFamily: '"Playfair Display", Georgia, serif', fontSize: '1.1rem' }}>
                    {coupleNames}
                  </span>
                )}
              </div>
            )}

            {/* Custom frame image overlay */}
            {customFrameUrl && (
              <img src={customFrameUrl} alt="Custom frame" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
            )}

            {/* Countdown */}
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  key={countdown}
                  initial={{ scale: 1.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: '6rem', fontWeight: 700 }}
                >
                  {countdown}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {capturedImage ? (
              <>
                <button onClick={() => { setCapturedImage(null); startCamera(); }}
                  style={btnStyle('outline', primaryColor)}>↺ Retake</button>
                <button onClick={downloadPhoto}
                  style={btnStyle('outline', primaryColor)}>⬇ Download</button>
                <button onClick={savePhoto} disabled={saving}
                  style={btnStyle('filled', primaryColor)}>
                  {saving ? 'Saving…' : '💾 Save to Gallery'}
                </button>
              </>
            ) : (
              <>
                {!cameraActive ? (
                  <button onClick={startCamera} style={btnStyle('filled', primaryColor)}>▶ Start Camera</button>
                ) : (
                  <>
                    <button onClick={triggerCountdown} disabled={countdown !== null}
                      style={btnStyle('filled', primaryColor)}>
                      📸 {countdown !== null ? `${countdown}…` : 'Take Photo'}
                    </button>
                    <button onClick={stopCamera} style={btnStyle('outline', primaryColor)}>✕ Stop</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Options sidebar ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #e5d9ce' }}>
            {(['filters', 'frames'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                background: tab === t ? primaryColor : '#fffdf9',
                color: tab === t ? '#fff' : '#7b6a5d',
                fontWeight: tab === t ? 700 : 400,
                fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}>
                {t === 'filters' ? '✦ Filters' : '⬡ Frames'}
              </button>
            ))}
          </div>

          {/* Filters */}
          {tab === 'filters' && (
            <div style={{ background: '#fffdf9', borderRadius: '16px', border: '1.5px solid #e5d9ce', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {FILTERS.map(f => (
                  <button key={f.id} onClick={() => setActiveFilter(f.id)} style={{
                    padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: activeFilter === f.id ? primaryColor : '#faf4eb',
                    color: activeFilter === f.id ? '#fff' : '#4a3f35',
                    fontWeight: activeFilter === f.id ? 700 : 400,
                    fontSize: '0.78rem', fontFamily: 'inherit',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    transition: 'all 0.18s',
                  }}>
                    <div style={{ width: '32px', height: '20px', borderRadius: '4px', background: f.preview, filter: f.css === 'none' ? '' : f.css, border: '1px solid rgba(0,0,0,0.08)' }} />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Frames */}
          {tab === 'frames' && (
            <div style={{ background: '#fffdf9', borderRadius: '16px', border: '1.5px solid #e5d9ce', padding: '16px' }}>
              <p style={{ fontSize: '0.72rem', color: '#7b6a5d', margin: '0 0 12px', lineHeight: 1.5 }}>
                Choose a frame style, or upload your own PNG overlay.
              </p>

              {/* Built-in frames */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                {BUILT_IN_FRAMES.map(f => (
                  <button key={f.id} onClick={() => { setActiveFrame(f.id); setCustomFrameUrl(''); }} style={{
                    padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: activeFrame === f.id && !customFrameUrl ? primaryColor : '#faf4eb',
                    color: activeFrame === f.id && !customFrameUrl ? '#fff' : '#4a3f35',
                    fontWeight: activeFrame === f.id && !customFrameUrl ? 700 : 400,
                    fontSize: '0.78rem', fontFamily: 'inherit', transition: 'all 0.18s',
                  }}>
                    <span style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>{f.icon}</span>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Custom upload */}
              <div style={{ borderTop: '1px solid #e5d9ce', paddingTop: '12px' }}>
                <p style={{ fontSize: '0.7rem', color: '#b0a090', margin: '0 0 8px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Upload Custom Frame</p>
                <label style={{
                  display: 'block', padding: '10px', borderRadius: '10px',
                  border: `1.5px dashed ${customFrameUrl ? primaryColor : '#e5d9ce'}`,
                  background: customFrameUrl ? `${primaryColor}10` : 'transparent',
                  textAlign: 'center', cursor: 'pointer', fontSize: '0.78rem', color: '#7b6a5d',
                }}>
                  {customFrameUrl ? '✓ Custom frame loaded' : '+ Upload PNG overlay'}
                  <input type="file" accept="image/png" style={{ display: 'none' }} onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { setCustomFrameUrl(URL.createObjectURL(file)); setActiveFrame('none'); }
                    e.target.value = '';
                  }} />
                </label>
                {customFrameUrl && (
                  <button onClick={() => setCustomFrameUrl('')} style={{ marginTop: '6px', width: '100%', padding: '6px', borderRadius: '8px', border: '1px solid #e5d9ce', background: 'transparent', color: '#b07f56', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Remove custom frame
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Color pickers */}
          <div style={{ background: '#fffdf9', borderRadius: '16px', border: '1.5px solid #e5d9ce', padding: '16px' }}>
            <p style={{ fontSize: '0.7rem', color: '#b0a090', margin: '0 0 12px', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Frame Colors</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: '#7b6a5d', display: 'block', marginBottom: '4px' }}>Primary</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.72rem', color: '#7b6a5d', fontFamily: 'monospace' }}>{primaryColor}</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', color: '#7b6a5d', display: 'block', marginBottom: '4px' }}>Secondary</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} style={{ width: '36px', height: '36px', border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.72rem', color: '#7b6a5d', fontFamily: 'monospace' }}>{secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper
function btnStyle(variant: 'filled' | 'outline', color: string): React.CSSProperties {
  return {
    padding: '11px 22px', borderRadius: '10px', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.88rem', fontFamily: '"Playfair Display", Georgia, serif',
    border: variant === 'filled' ? 'none' : `1.5px solid ${color}`,
    background: variant === 'filled' ? color : 'transparent',
    color: variant === 'filled' ? '#fff' : color,
    transition: 'opacity 0.2s',
  };
}

export default Photobooth;

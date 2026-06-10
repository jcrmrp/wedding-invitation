import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_URL = 'https://www.youtube.com/watch?v=48kWZmO3yUQ';

function getEmbedUrl(rawUrl: string, autoplay = true) {
  const match = rawUrl.match(/[?&]v=([^&]+)/);
  const videoId = match ? match[1] : rawUrl.split('/').pop()?.split('?')[0];
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&enablejsapi=1&loop=1&playlist=${videoId}`;
}

export default function MusicPlayer({ url, isEditing = true }: { url?: string; isEditing?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [tempUrl, setTempUrl] = useState(url || '');
  const [label, setLabel] = useState('Wedding Song');
  const iframeKey = useRef(0);

  const togglePlay = () => {
    if (!playing) {
      iframeKey.current += 1;
      setEmbedUrl(getEmbedUrl(tempUrl || url || DEFAULT_URL, true));
      setPlaying(true);
    } else {
      setEmbedUrl('');
      setPlaying(false);
    }
  };

  const handleLoad = () => {
    iframeKey.current += 1;
    const newEmbed = getEmbedUrl(tempUrl, true);
    setEmbedUrl(newEmbed);
    setPlaying(true);
    setIsOpen(false);
    setLabel('Wedding Song');
  };

  return (
    <>
      {embedUrl && (
        <iframe
          key={iframeKey.current}
          width="0"
          height="0"
          style={{ position: 'absolute', pointerEvents: 'none', opacity: 0, top: '-9999px', left: '-9999px' }}
          src={embedUrl}
          frameBorder="0"
          allow="autoplay; encrypted-media"
          title="Wedding Music"
        />
      )}

      {!isEditing && !playing && url && (
        <button
          onClick={togglePlay}
          aria-label="Play wedding music"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b6914, #a67c00)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            boxShadow: '0 4px 16px rgba(139, 105, 20, 0.4)',
            zIndex: 1000,
          }}
        >
          ▶
        </button>
      )}

      {isEditing && (
        <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                style={{
                  background: 'rgba(26, 22, 18, 0.95)',
                  backdropFilter: 'blur(16px)',
                  padding: '20px',
                  borderRadius: '20px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  width: '300px',
                  border: '1.5px solid rgba(180, 140, 100, 0.3)',
                }}
              >
                <p style={{ margin: '0 0 12px', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(212, 175, 130, 0.8)', fontWeight: 600, fontFamily: 'Georgia, serif' }}>
                  Change Music
                </p>
                <input
                  type="text"
                  placeholder="Paste YouTube link…"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1.5px solid rgba(180, 140, 100, 0.3)',
                    background: 'rgba(0,0,0,0.3)',
                    color: '#f5e6d3',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                    fontFamily: 'Georgia, serif',
                  }}
                />
                <button
                  onClick={handleLoad}
                  style={{
                    width: '100%',
                    padding: '11px',
                    background: 'linear-gradient(135deg, #8b6914, #a67c00)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontFamily: 'Georgia, serif',
                    boxShadow: '0 4px 12px rgba(139, 105, 20, 0.4)',
                  }}
                >
                  Load & Play
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: playing
                ? 'linear-gradient(180deg, rgba(40, 35, 30, 0.95), rgba(20, 18, 15, 0.98))'
                : 'rgba(26, 22, 18, 0.9)',
              backdropFilter: 'blur(20px)',
              border: `1.5px solid ${playing ? 'rgba(180, 140, 100, 0.5)' : 'rgba(180, 140, 100, 0.2)'}`,
              borderRadius: '28px',
              padding: '10px 16px 10px 10px',
              boxShadow: playing
                ? '0 8px 32px rgba(139, 105, 20, 0.3), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                : '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
            }}
          >
            <motion.div
              animate={{ rotate: playing ? 360 : 0 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: playing
                  ? 'radial-gradient(circle at center, #1a1a1a 0%, #1a1a1a 8%, #2a2520 8%, #2a2520 10%, #1a1a1a 10%, #1a1a1a 12%, #252220 12%, #252220 14%, #1a1a1a 14%, #1a1a1a 16%, #222018 16%, #222018 18%, #1a1a1a 18%, #1a1a1a 20%, #252520 20%, #252520 22%, #1a1a1a 22%, #1a1a1a 24%, #201e18 24%, #201e18 26%, #1a1a1a 26%, #1a1a1a 28%, #2a2520 28%, #2a2520 30%, #1a1a1a 30%, #1a1a1a 100%)'
                  : 'radial-gradient(circle at center, #1a1a1a 0%, #1a1a1a 8%, #2a2520 8%, #2a2520 10%, #1a1a1a 10%, #1a1a1a 12%, #252220 12%, #252220 14%, #1a1a1a 14%, #1a1a1a 16%, #222018 16%, #222018 18%, #1a1a1a 18%, #1a1a1a 100%)',
                boxShadow: playing
                  ? '0 0 0 2px rgba(180, 140, 100, 0.3), 0 4px 16px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.5)'
                  : '0 0 0 2px rgba(180, 140, 100, 0.2), 0 2px 8px rgba(0,0,0,0.4)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: playing
                  ? 'linear-gradient(135deg, #8b6914, #a67c00, #6b4f0a)'
                  : 'linear-gradient(135deg, #6b5a3e, #8b7355)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#1a1a1a',
                  boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.8)',
                }} />
              </div>

              {playing && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.03) 60deg, transparent 120deg, rgba(255,255,255,0.03) 180deg, transparent 240deg, rgba(255,255,255,0.03) 300deg, transparent 360deg)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </motion.div>

            <motion.div
              animate={{
                rotate: playing ? -25 : -40,
                x: playing ? 4 : 8,
              }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                right: '-20px',
                top: '-8px',
                width: '40px',
                height: '60px',
                transformOrigin: 'top center',
              }}
            >
              <div style={{
                width: '3px',
                height: '45px',
                background: 'linear-gradient(180deg, #c49b6c, #8b7355)',
                margin: '6px auto 0',
                borderRadius: '2px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transform: 'rotate(-15deg)',
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#c49b6c',
                margin: '-2px auto 0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
              }} />
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, maxWidth: '140px' }}>
              <span style={{ fontSize: '0.75rem', color: playing ? '#d4af6a' : 'rgba(212, 175, 106, 0.7)', fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap', fontFamily: 'Georgia, serif' }}>
                {label}
              </span>
              <span style={{ fontSize: '0.65rem', color: playing ? 'rgba(212, 175, 106, 0.8)' : 'rgba(212, 175, 106, 0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Georgia, serif' }}>
                {playing ? '♪ Now Playing' : '○ Paused'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setIsOpen((o) => !o)}
                aria-label="Change music"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: `1px solid ${isOpen ? 'rgba(180, 140, 100, 0.5)' : 'rgba(180, 140, 100, 0.2)'}`,
                  background: isOpen ? 'rgba(180, 140, 100, 0.15)' : 'transparent',
                  color: isOpen ? '#d4af6a' : 'rgba(212, 175, 106, 0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                ⚙
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={togglePlay}
                aria-label={playing ? 'Pause music' : 'Play music'}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(180, 140, 100, 0.5)',
                  background: playing
                    ? 'linear-gradient(135deg, #8b6914, #a67c00)'
                    : 'rgba(180, 140, 100, 0.1)',
                  color: playing ? '#fff' : 'rgba(212, 175, 106, 0.7)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  flexShrink: 0,
                  boxShadow: playing ? '0 4px 12px rgba(139, 105, 20, 0.4)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {playing ? '⏸' : '▶'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
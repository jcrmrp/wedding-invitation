import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Home from '../Home';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

type WeddingRecord = {
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

function getYearsSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) years--;
  return years;
}

function isSameMonthDay(a: string, b: string): boolean {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function PublicInvitation() {
  const { coupleName } = useParams<{ coupleName: string }>();
  const [wedding, setWedding] = useState<WeddingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [showAnniversary, setShowAnniversary] = useState(false);

  useEffect(() => {
    const fetchWedding = async () => {
      if (!coupleName) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('weddings')
        .select('*')
        .eq('custom_url', coupleName)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching invitation:', error);
      } else if (data) {
        setWedding(data);
      }
      setLoading(false);
    };

    fetchWedding();

    // Set up real-time subscription for live updates
    const channel = supabase
      .channel(`wedding-${coupleName}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'weddings',
          filter: `custom_url=eq.${coupleName}`,
        },
        (payload) => {
          console.log('🔄 Real-time update received:', payload);
          if (payload.new) {
            setWedding(payload.new as WeddingRecord);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleName]);

  const isAnniversary = useMemo(() => {
    if (!wedding?.wedding_date) return false;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    return isSameMonthDay(wedding.wedding_date, todayStr);
  }, [wedding]);

  const years = useMemo(() => {
    if (!wedding?.wedding_date) return 0;
    return getYearsSince(wedding.wedding_date);
  }, [wedding]);

  const isWeddingPast = useMemo(() => {
    if (!wedding?.wedding_date) return false;
    const weddingDate = new Date(wedding.wedding_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return weddingDate < today;
  }, [wedding]);

  const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const skipEnvelope = isWeddingPast && !isAnniversary;

  useEffect(() => {
    if (skipEnvelope) {
      setOpened(true);
    }
  }, [skipEnvelope]);

  useEffect(() => {
    if (isAnniversary && years > 0) {
      setShowAnniversary(true);
    }
  }, [isAnniversary, years]);

  const handleOpen = useCallback(() => {
    setOpened(true);
  }, []);

  const handleAnniversaryDone = useCallback(() => {
    setShowAnniversary(false);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#7b6a5d', fontSize: '1.1rem' }}>
        Loading invitation…
      </div>
    );
  }

  const invitationData = wedding ? {
    names:         wedding.couple_names || '',
    date:          wedding.wedding_date || '',
    venue:         wedding.venue || '',
    message:       wedding.description || '',
    story:         wedding.story || '',
    musicUrl:      wedding.music_url || '',
    liveStreamUrl: (wedding.live_stream_url || '') as string,
    custom_url:    wedding.custom_url || '',
    isGuestPhotoWallEnabled: !!wedding.guest_photo_wall_enabled,
    isPhotoboothEnabled: !!wedding.photobooth_enabled,
    entourage:     (wedding.entourage || {}) as Record<string, string[]>,
  } : {
    names: 'Alex & Jordan', date: '2026-10-15', venue: 'Your Venue Here', message: '', story: '', musicUrl: '', liveStreamUrl: '', custom_url: '', isGuestPhotoWallEnabled: false, isPhotoboothEnabled: false, entourage: {},
  };

  // Dynamic Open Graph meta tags for social media preview
  const pageTitle = invitationData.names ? `${invitationData.names} Wedding` : 'Wedding Invitation';
  const pageDescription = invitationData.message || `Join us in celebrating ${invitationData.names}'s special day.`;
  const pageImage = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80';
  const pageUrl = `${window.location.origin}/invite/${coupleName}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={pageImage} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content="Luxora" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={pageImage} />
      </Helmet>
      <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#faf4eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        {showAnniversary && (
          <motion.div
            key="anniversary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            onClick={handleAnniversaryDone}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(180deg, #1a0f0a 0%, #2c1810 50%, #1a0f0a 100%)',
              zIndex: 60,
              cursor: 'pointer',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                fontSize: '6rem',
                marginBottom: 100,
                filter: 'drop-shadow(0 0 40px rgba(255, 215, 140, 0.4))',
              }}
            >
              🎉
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{
                textAlign: 'center',
                marginTop: -40,
              }}
            >
              <motion.h1
                style={{
                  fontFamily: 'Georgia, serif',
                  color: '#ffd699',
                  fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  margin: '0 0 16px',
                  textShadow: '0 0 30px rgba(255, 200, 120, 0.5)',
                }}
              >
                Happy Anniversary!
              </motion.h1>

              <motion.p
                style={{
                  fontFamily: 'Georgia, serif',
                  color: '#e8c496',
                  fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
                  margin: '0 0 8px',
                  letterSpacing: '0.06em',
                }}
              >
                {invitationData.names}
              </motion.p>

              <motion.p
                style={{
                  fontFamily: 'Georgia, serif',
                  color: '#ffd699',
                  fontSize: 'clamp(1.2rem, 3vw, 2rem)',
                  fontWeight: 700,
                  margin: '0 0 32px',
                  textShadow: '0 0 20px rgba(255, 215, 140, 0.6)',
                }}
              >
                {ordinal(years)} Year{years === 1 ? '' : 's'} of Love
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              style={{
                fontFamily: 'Georgia, serif',
                color: '#c49b6c',
                fontSize: '0.9rem',
                letterSpacing: '0.1em',
                marginTop: -20,
              }}
            >
              Tap anywhere to continue
            </motion.div>

            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: ['0vh', '-120vh'],
                  opacity: [0, 1, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 6 + Math.random() * 4,
                  repeat: Infinity,
                  delay: i * 1.2,
                  ease: 'linear',
                }}
                style={{
                  position: 'absolute',
                  bottom: '-60px',
                  left: `${15 + i * 18}%`,
                  fontSize: '1.8rem',
                  opacity: 0,
                }}
              >
                {['✨', '💛', '🥂', '💖', '🎊'][i]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!showAnniversary && !skipEnvelope && !opened && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #f5ecdc 0%, #e8dcc8 100%)',
            zIndex: 50,
          }}
          onClick={handleOpen}
        >
          <motion.div
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ marginBottom: 40, textAlign: 'center' }}
          >
            <div style={{ fontSize: '5rem', marginBottom: 24 }}>💌</div>
            <h1
              style={{
                fontFamily: 'Georgia, serif',
                color: '#4a3f35',
                fontSize: 'clamp(1.6rem, 3vw, 2.6rem)',
                fontWeight: 400,
                fontStyle: 'italic',
                lineHeight: 1.4,
                maxWidth: 600,
                margin: '0 auto',
                textShadow: '0 1px 2px rgba(0,0,0,0.06)',
              }}
            >
              {invitationData.names} is inviting you to their wedding
            </h1>
            {invitationData.message ? (
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  color: '#4a3f35',
                  fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                  marginTop: 18,
                  maxWidth: 520,
                  margin: '18px auto 0',
                  lineHeight: 1.6,
                  fontWeight: 500,
                  fontStyle: 'italic',
                }}
              >
                {invitationData.message}
              </p>
            ) : (
              <p
                style={{
                  fontFamily: 'Georgia, serif',
                  color: '#7b6a5d',
                  fontSize: '1rem',
                  marginTop: 18,
                  letterSpacing: '0.04em',
                }}
              >
                Tap anywhere to open
              </p>
            )}
          </motion.div>

          <motion.div
            animate={{
              y: [0, -12, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: 220,
              height: 260,
              position: 'relative',
            }}
          >
            <motion.div
              animate={{
                rotateZ: [0, 3, -3, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '6px',
                background: 'linear-gradient(180deg, #cfa67a 0%, #a67c52 100%)',
                boxShadow:
                  '0 20px 60px rgba(74, 63, 53, 0.25), 0 4px 12px rgba(74, 63, 53, 0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 10,
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '3px',
                  pointerEvents: 'none',
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: '28%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '88%',
                  height: '44%',
                  background: 'linear-gradient(180deg, #d9b48f 0%, #c19568 100%)',
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 70%, 0 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />

              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  fontSize: '3.5rem',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                  zIndex: 2,
                }}
              >
                💍
              </motion.div>
            </motion.div>
          </motion.div>

          <div
            style={{
              position: 'absolute',
              bottom: 60,
              display: 'flex',
              gap: 6,
            }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: 'easeInOut',
                }}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#b07f56',
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!showAnniversary && opened && (
          <motion.div
            key="invitation-content"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              width: '100%',
              minHeight: '100vh',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Home
              coupleName={coupleName}
              invitationData={invitationData}
              isEditing={false}
              plan={wedding?.plan || 'keepsake-200'}
              liveStreamUrl={wedding?.live_stream_url || ''}
              guestPhotoWallEnabled={wedding?.guest_photo_wall_enabled}
              gcashNumber={wedding?.gcash_number || ''}
              customQrImage={wedding?.gcash_qr_url || ''}
              onGcashNumberChange={() => {}}
              onQrImageChange={() => {}}
              onQrFileUpload={async () => {}}
              dressCodePrimaryColor={wedding?.dress_code_primary_color || '#b07f56'}
              dressCodeSecondaryColor={wedding?.dress_code_secondary_color || '#e5d9ce'}
              dressCodeMessage={wedding?.dress_code_message || "We'd love to see you in our wedding colors!"}
              onDressCodePrimaryColorChange={() => {}}
              onDressCodeSecondaryColorChange={() => {}}
              onDressCodeMessageChange={() => {}}
              entourage={wedding?.entourage || {}}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}

export default PublicInvitation;

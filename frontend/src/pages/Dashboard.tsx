import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import type { InvitationData } from '../components/Editor';
import Editor from '../components/Editor';
import Home from '../Home';
import { motion, AnimatePresence } from 'framer-motion';

// ── Dev accounts that bypass payment ─────────────────────────────────────────
// Add your email(s) here. These accounts skip onboarding and can set any plan.
const DEV_EMAILS: string[] = [
   'mr.johnlester.domingo@gmail.com'
];

const PLANS = [
  { id: 'essential',    label: 'Essential Plan' },
  { id: 'storyteller',  label: 'Storyteller Plan' },
  { id: 'keepsake-20',  label: 'Keepsake — 20 Images' },
  { id: 'keepsake-50',  label: 'Keepsake — 50 Images' },
  { id: 'keepsake-100', label: 'Keepsake — 100 Images' },
  { id: 'keepsake-200', label: 'Keepsake — 200 Images' },
];
// ─────────────────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function cropToSquare(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Crop failed')),
        'image/png',
        0.92
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

function Dashboard() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');
  const [invitationData, setInvitationData] = useState<InvitationData>({ names: '', date: '', venue: '', state: '', message: '', dressCode: '', story: '', musicUrl: '', liveStreamUrl: '', isGuestPhotoWallEnabled: false, isPhotoboothEnabled: false, entourage: {} });
  const [currentPlan, setCurrentPlan] = useState('essential');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [devPlan, setDevPlan] = useState('essential');
  const [devApplying, setDevApplying] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showEnvelopeAnim, setShowEnvelopeAnim] = useState(false);
  const [dbRecord, setDbRecord] = useState<any>(null);
  const [gcashNumber, setGcashNumber] = useState('09171234567');
  const [customQrImage, setCustomQrImage] = useState('');
  const userIdRef = useRef<string>('');
  const [dressCodePrimaryColor, setDressCodePrimaryColor] = useState('#b07f56');
  const [dressCodeSecondaryColor, setDressCodeSecondaryColor] = useState('#e5d9ce');
  const [dressCodeMessage, setDressCodeMessage] = useState("We'd love to see you in our wedding colors!");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [liveStreamUrl, setLiveStreamUrl] = useState('');
  const [guestPhotoWallEnabled, setGuestPhotoWallEnabled] = useState(false);
  const [photoboothEnabled, setPhotoboothEnabled] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);

  const isDev = DEV_EMAILS.includes(userEmail);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔐 Current user:', user);
      if (authError || !user) {
        console.error('❌ Authentication failed:', authError);
        navigate('/login');
        return;
      }

      setUserEmail(user.email || '');
      userIdRef.current = user.id;

// Step: Ensure user exists in users table (required for FK constraint)
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!userData) {
        console.log('🔧 Creating user record for dev account...');
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
        });
      }

console.log('📡 Fetching wedding data for user:', user.id);
      const { data: weddingData, error: weddingError } = await supabase
        .from('weddings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (weddingError) {
        console.error('⚠️ DB load error:', weddingError);
        setDbRecord(null);
      } else if (weddingData && weddingData.length > 0) {
        setDbRecord(weddingData[0]);
      } else {
        setDbRecord(null);
      }

      // Check if returning from a successful PayMongo payment
      const params = new URLSearchParams(window.location.search);
      const paymentSuccess = params.get('payment') === 'success';
      const savedForm = localStorage.getItem('onboarding_form');
      const savedPlan = localStorage.getItem('onboarding_plan');

      // Handle post-payment wedding update (for placeholder record or no record)
      if (paymentSuccess && savedForm && !weddingError) {
        console.log('✅ Payment successful, updating wedding record...');
        const parsedForm = JSON.parse(savedForm);
        const plan = savedPlan || 'essential';
        const coupleName = `${parsedForm.partnerA} & ${parsedForm.partnerB}`;
        const slug = toSlug(coupleName);

        // Update existing wedding record (placeholder from Register) or create new one
        if (weddingData && weddingData.length > 0) {
          await supabase.from('weddings').update({
            couple_names: coupleName,
            wedding_date: parsedForm.date,
            venue: parsedForm.venue,
            description: parsedForm.message,
            custom_url: slug,
            is_published: true,
            title: coupleName + ' Wedding',
            plan: plan,
          }).eq('user_id', user.id);
        } else {
          await supabase.from('weddings').insert({
            user_id: user.id,
            couple_names: coupleName,
            wedding_date: parsedForm.date,
            venue: parsedForm.venue,
            description: parsedForm.message,
            custom_url: slug,
            is_published: true,
            title: coupleName + ' Wedding',
            plan: plan,
          });
        }

        localStorage.removeItem('onboarding_form');
        localStorage.removeItem('onboarding_plan');

        // Clean up URL params to prevent reprocessing on refresh
        window.history.replaceState({}, '', '/dashboard');

        // Fetch the updated/created record
        const { data: newData } = await supabase
          .from('weddings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (newData && newData.length > 0) {
          setDbRecord(newData[0]);
          setInvitationData({
            names: newData[0].couple_names || '',
            date: newData[0].wedding_date || '',
            venue: newData[0].venue || '',
            state: newData[0].state || '',
            message: newData[0].description || '',
            dressCode: newData[0].dress_code || '',
            story: newData[0].story || '',
            musicUrl: newData[0].music_url || '',
            liveStreamUrl: newData[0].live_stream_url || '',
            isGuestPhotoWallEnabled: newData[0].guest_photo_wall_enabled || false,
            isPhotoboothEnabled: newData[0].photobooth_enabled || false,
            entourage: newData[0].entourage || {},
          });
          setCurrentPlan(plan);
        }
        setLoading(false);
        return;
      }

      // ONLY seed if there is absolutely NO data
      if ((!weddingData || weddingData.length === 0) && !weddingError) {
        console.log('⚠️ No data found, checking if dev...');
        if (DEV_EMAILS.includes(user.email || '')) {
          console.log('✅ Dev account, seeding minimal starter data');
          const slug = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

          const seedPayload = {
            user_id:         user.id,
            couple_names:    'Alex & Jordan',
            wedding_date:    '2026-10-15',
            description:     '',
            custom_url:      slug,
            is_published:    true,
            title:           'Alex & Jordan Wedding',
          };

          // Optimized seeding logic for Dev accounts:
          // Check existence first because .update().eq() doesn't error on 0 rows
          const { data: existingSeed } = await supabase
            .from('weddings')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingSeed) {
            console.log('🌱 Creating new seeded wedding for dev...');
            await supabase.from('weddings').insert(seedPayload);
          } else {
            console.log('🔄 Updating existing seeded wedding...');
            await supabase.from('weddings').update(seedPayload).eq('user_id', user.id);
          }

          // Now fetch the data fresh (after upsert)
          const { data: freshData } = await supabase
            .from('weddings')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          console.log('🌱 Fresh seeded data:', freshData);
          setInvitationData({ names: 'Alex & Jordan', date: '2026-10-15', venue: '', state: '', message: "We can't wait to celebrate with you!", dressCode: '', story: '', musicUrl: '', liveStreamUrl: '', isGuestPhotoWallEnabled: false, isPhotoboothEnabled: false, entourage: {} });
          setCurrentPlan('storyteller');
          setDevPlan('storyteller');
          setDbRecord(freshData as any);
          setLoading(false);
          return;
        }
        navigate('/onboarding');
        return;
      }

      const record = weddingData && weddingData.length > 0 ? weddingData[0] : null;
      if (!record) { setLoading(false); return; }

      setInvitationData({
        names:     record.couple_names || '',
        date:      record.wedding_date || '',
        venue:     record.venue        || '',
        state:     record.state        || '',
        message:   record.description  || '',
        dressCode: record.dress_code   || '',
        story:     record.story        || '',
        musicUrl:  record.music_url    || '',
        liveStreamUrl: record.live_stream_url || '',
        isGuestPhotoWallEnabled: record.guest_photo_wall_enabled || false,
        isPhotoboothEnabled: record.photobooth_enabled || false,
        entourage: record.entourage    || {},
      });

      if (record.gcash_number) setGcashNumber(record.gcash_number);
      if (record.gcash_qr_url) setCustomQrImage(record.gcash_qr_url);
      if (record.dress_code_primary_color)   setDressCodePrimaryColor(record.dress_code_primary_color);
      if (record.dress_code_secondary_color) setDressCodeSecondaryColor(record.dress_code_secondary_color);
      if (record.dress_code_message)         setDressCodeMessage(record.dress_code_message);
      if (record.live_stream_url)            setLiveStreamUrl(record.live_stream_url);
      if (record.guest_photo_wall_enabled)   setGuestPhotoWallEnabled(record.guest_photo_wall_enabled);
      if (record.photobooth_enabled)         setPhotoboothEnabled(record.photobooth_enabled);

      if (isDev) {
        const initialDevPlan = record.plan || 'storyteller';
        setCurrentPlan(initialDevPlan);
        setDevPlan(initialDevPlan);
      } else {
        setCurrentPlan(record.plan || 'essential');
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const saveToDatabase = async () => {
    setSaving(true);
    setSaveStatus('saving');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); setSaveStatus('error'); return; }

    const slug = toSlug(invitationData.names);

    const payload = {
      user_id:                     user.id,
      couple_names:                invitationData.names,
      wedding_date:                invitationData.date       || null,
      venue:                       invitationData.venue,
      state:                       invitationData.state,
      description:                 invitationData.message,
      dress_code:                  invitationData.dressCode,
      story:                       invitationData.story,
      music_url:                   invitationData.musicUrl   || null,
      entourage:                   invitationData.entourage,
      plan:                        currentPlan,
      custom_url:                  slug,
      is_published:                true,
      title:                       invitationData.names + ' Wedding',
      gcash_number:                gcashNumber,
      gcash_qr_url:                customQrImage             || null,
      dress_code_primary_color:    dressCodePrimaryColor,
      dress_code_secondary_color:  dressCodeSecondaryColor,
      dress_code_message:          dressCodeMessage,
      subscription_id:             dbRecord?.subscription_id || null,
      live_stream_url:             liveStreamUrl || null,
      guest_photo_wall_enabled:    guestPhotoWallEnabled,
      photobooth_enabled:          photoboothEnabled,
    };

    try {
      let saveError: any = null;
      let savedData: any = null;

      if (dbRecord?.id) {
        const result = await supabase
          .from('weddings')
          .update(payload)
          .eq('id', dbRecord.id)
          .select()
          .single();
        savedData = result.data;
        saveError = result.error;
      } else {
        const result = await supabase
          .from('weddings')
          .insert(payload)
          .select()
          .single();
        savedData = result.data;
        saveError = result.error;
      }

      if (saveError) {
        console.error('❌ Save failed:', saveError);
        setSaveStatus('error');
        setSaving(false);
        return;
      }

      if (savedData) {
        setDbRecord(savedData);
        setInvitationData({
          names:     savedData.couple_names || '',
          date:      savedData.wedding_date || '',
          venue:     savedData.venue        || '',
          state:     savedData.state        || '',
          message:   savedData.description  || '',
          dressCode: savedData.dress_code   || '',
          story:     savedData.story        || '',
          musicUrl:  savedData.music_url    || '',
          liveStreamUrl: savedData.live_stream_url || '',
          isGuestPhotoWallEnabled: !!savedData.guest_photo_wall_enabled,
          isPhotoboothEnabled: !!savedData.photobooth_enabled,
          entourage: savedData.entourage    || {},
        });
        if (savedData.gcash_number)                setGcashNumber(savedData.gcash_number);
        if (savedData.gcash_qr_url)                setCustomQrImage(savedData.gcash_qr_url);
        if (savedData.dress_code_primary_color)    setDressCodePrimaryColor(savedData.dress_code_primary_color);
        if (savedData.dress_code_secondary_color)  setDressCodeSecondaryColor(savedData.dress_code_secondary_color);
        if (savedData.dress_code_message)          setDressCodeMessage(savedData.dress_code_message);
        if (savedData.live_stream_url)             setLiveStreamUrl(savedData.live_stream_url);
        if (savedData.guest_photo_wall_enabled)    setGuestPhotoWallEnabled(savedData.guest_photo_wall_enabled);
        if (savedData.photobooth_enabled)          setPhotoboothEnabled(savedData.photobooth_enabled);
        if (savedData.plan) {
          setCurrentPlan(savedData.plan);
          if (isDev) setDevPlan(savedData.plan);
        }
      }

      setSaveStatus('saved');
      // Reset status indicator after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);

    } catch (e) {
      console.error('❌ Exception in save:', e);
      setSaveStatus('error');
    }

    setSaving(false);
  };

  const copyLink = async () => {
    const slug = toSlug(invitationData.names);
    const fullUrl = `${window.location.origin}/invite/${slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link');
    }
  };

  const handleQrUpload = async (file: File) => {
    const userId = userIdRef.current;
    if (!userId) return;

    setUploadingQr(true);

    try {
      const cropped = await cropToSquare(file);
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/gcash-qr.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('wedding-assets')
        .upload(path, cropped, { upsert: true, contentType: 'image/png' });

      if (uploadError) {
        console.error('QR upload failed:', uploadError);
        alert('Upload failed: ' + uploadError.message + '\n\nTip: Create the "wedding-assets" storage bucket in Supabase and enable public access.');
        return;
      }

      const { data: urlData } = supabase.storage.from('wedding-assets').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      setCustomQrImage(publicUrl);
      await supabase.from('weddings').update({ gcash_qr_url: publicUrl }).eq('user_id', userId);
    } finally {
      setUploadingQr(false);
    }
  };

  const handleLaunch = async () => {
    // Open window FIRST to avoid popup blockers
    const newWindow = window.open('', '_blank');
    // First save all changes to database
    await saveToDatabase();
    setShowEnvelopeAnim(true);
    // Wait for animation, then set the live view URL
    setTimeout(() => {
      if (newWindow) {
        newWindow.location.href = liveUrl;
      } else {
        // Fallback if window wasn't opened
        window.open(liveUrl, '_blank');
      }
      setShowEnvelopeAnim(false);
    }, 3000);
  };

  const applyDevPlan = async () => {
    setDevApplying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Try to update plan, if it fails, just update locally
      const { error } = await supabase.from('weddings').update({ plan: devPlan }).eq('user_id', user.id);
      if (error) {
        alert('Plan set locally! For full plan features, run the SQL in database/complete_fix.sql');
      } else {
        alert(`Plan set to: ${PLANS.find(p => p.id === devPlan)?.label}`);
      }
      setCurrentPlan(devPlan);
    }
    setDevApplying(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#7b6a5d' }}>
      Loading your dashboard…
    </div>
  );

  const liveSlug = toSlug(invitationData.names);
  const liveUrl  = `/invite/${liveSlug}`;

  return (
    <div style={{ padding: '20px', background: '#faf4eb', minHeight: '100vh', position: 'relative' }}>

      {/* Envelope Animation Overlay */}
      <AnimatePresence>
        {showEnvelopeAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(250, 244, 235, 0.98)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
            }}
          >
            {/* Folding paper animation */}
            <motion.div
              initial={{ width: 300, height: 400, background: '#fffdf9', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              animate={{
                width: [300, 200, 150, 100],
                height: [400, 300, 200, 150],
                rotate: [0, 2, 0, -2, 0],
              }}
              transition={{ duration: 1.5, times: [0, 0.3, 0.6, 1] }}
              style={{ marginBottom: 40 }}
            >
              <span style={{ fontSize: '1.2rem', color: '#b07f56', fontFamily: 'Georgia, serif' }}>✦</span>
            </motion.div>

            {/* Envelope */}
            <motion.div
              initial={{ scale: 0, opacity: 0, y: 0 }}
              animate={{
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1],
                y: [0, 0, -800],
              }}
              transition={{ duration: 2, delay: 1.5, times: [0, 0.3, 1] }}
              style={{
                width: 160,
                height: 100,
                background: '#b07f56',
                borderRadius: '8px 8px 0 0',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Envelope flap */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 50,
                background: '#d4a574',
                clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '2rem',
              }}>✉️</div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                fontFamily: 'Georgia, serif',
                color: '#7b6a5d',
                fontSize: '1.2rem',
                marginTop: 20,
              }}
            >
              Launching your invitation...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Modal */}
      <AnimatePresence>
        {showLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#fffdf9',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
              }}
            >
              <h2 style={{ fontFamily: 'Georgia, serif', color: '#4a3f35', margin: '0 0 20px', fontSize: '1.5rem' }}>
                Share Your Invitation
              </h2>
              <div style={{
                padding: '16px',
                background: '#faf4eb',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #e5d9ce',
                wordBreak: 'break-all',
                fontSize: '0.9rem',
                color: '#4a3f35',
                fontFamily: 'monospace',
              }}>
                {window.location.origin}{liveUrl}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={copyLink}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#b07f56',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowLinkModal(false)}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1.5px solid #e5d9ce',
                    background: 'transparent',
                    color: '#7b6a5d',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    fontFamily: 'Georgia, serif',
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dev plan panel — only visible for DEV_EMAILS */}
      {isDev && (
        <div style={{
          maxWidth: '1400px', margin: '0 auto 16px',
          background: '#1e1a2e', borderRadius: '14px', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a78bfa', fontWeight: 700 }}>
            🛠 Dev Mode
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
            Active plan: <strong style={{ color: '#e9d5ff' }}>{PLANS.find(p => p.id === currentPlan)?.label || currentPlan}</strong>
          </span>
          <select
            value={devPlan}
            onChange={e => setDevPlan(e.target.value)}
            style={{
              padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(167,139,250,0.4)',
              background: 'rgba(255,255,255,0.08)', color: '#e9d5ff',
              fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
            }}
          >
            {PLANS.map(p => <option key={p.id} value={p.id} style={{ background: '#1e1a2e' }}>{p.label}</option>)}
          </select>
          <button
            onClick={applyDevPlan}
            disabled={devApplying}
            style={{
              padding: '7px 18px', borderRadius: '8px', border: 'none',
              background: '#7c3aed', color: '#fff', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit',
              opacity: devApplying ? 0.6 : 1,
            }}
          >
            {devApplying ? 'Applying…' : 'Apply Plan'}
          </button>
        </div>
      )}

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto 16px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fffdf9', border: '1px solid #e5d9ce', borderRadius: '12px', padding: '8px 16px' }}>
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7b6a5d', fontWeight: 600 }}>Your URL</span>
          <code style={{ fontSize: '0.82rem', color: '#b07f56', fontFamily: 'monospace' }}>
            {window.location.origin}{liveUrl}
          </code>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleLaunch}
            style={{
              padding: '11px 28px', borderRadius: '12px', border: 'none',
              background: '#4a3f35', color: '#fff', cursor: 'pointer',
              fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em',
              fontFamily: 'Georgia, serif',
              boxShadow: '0 4px 14px rgba(74,63,53,0.3)',
            }}>
            🚀 Launch
          </button>
          <button onClick={saveToDatabase} disabled={saving}
            style={{
              padding: '11px 28px', borderRadius: '12px', border: 'none',
              background: saveStatus === 'saved' ? '#4a7c59' : saveStatus === 'error' ? '#b04a4a' : '#b07f56',
              color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em',
              fontFamily: 'Georgia, serif', opacity: saving ? 0.7 : 1,
              boxShadow: '0 4px 14px rgba(176,127,86,0.3)',
              transition: 'background 0.3s',
            }}>
            {saving         ? '⏳ Saving…'     :
             saveStatus === 'saved' ? '✓ Saved!'      :
             saveStatus === 'error' ? '✕ Error — retry' :
             '✓ Save Changes'}
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Feature Quick Access */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <a href={`/dashboard/${liveSlug}/stream`} style={{ padding: '8px 14px', borderRadius: '8px', background: '#fffdf9', border: '1.5px solid #e5d9ce', color: '#4a3f35', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Georgia, serif' }}>📡 Live Stream</a>
          <a href={`/dashboard/${liveSlug}/seating`} style={{ padding: '8px 14px', borderRadius: '8px', background: '#fffdf9', border: '1.5px solid #e5d9ce', color: '#4a3f35', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Georgia, serif' }}>🍽️ Seating</a>
          <a href={`/dashboard/${liveSlug}/editor`} style={{ padding: '8px 14px', borderRadius: '8px', background: '#fffdf9', border: '1.5px solid #e5d9ce', color: '#4a3f35', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Georgia, serif' }}>✏️ Image Editor</a>
          <a href={`/dashboard/${liveSlug}/collab`} style={{ padding: '8px 14px', borderRadius: '8px', background: '#fffdf9', border: '1.5px solid #e5d9ce', color: '#4a3f35', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Georgia, serif' }}>👥 Collaboration</a>
          <a href="/smart-templates" style={{ padding: '8px 14px', borderRadius: '8px', background: '#fffdf9', border: '1.5px solid #e5d9ce', color: '#4a3f35', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'Georgia, serif' }}>✨ Templates</a>
        </div>
        <Editor
          invitationData={invitationData}
          setInvitationData={setInvitationData}
          dressCodePrimaryColor={dressCodePrimaryColor}
          dressCodeSecondaryColor={dressCodeSecondaryColor}
          dressCodeMessage={dressCodeMessage}
          onDressCodePrimaryColorChange={setDressCodePrimaryColor}
          onDressCodeSecondaryColorChange={setDressCodeSecondaryColor}
          onDressCodeMessageChange={setDressCodeMessage}
          liveStreamUrl={liveStreamUrl}
          onLiveStreamUrlChange={setLiveStreamUrl}
          entourage={invitationData.entourage || {}}
          onEntourageChange={(newEntourage) =>
            setInvitationData(prev => ({ ...prev, entourage: newEntourage }))
          }
        />
        <Home 
          coupleName={dbRecord?.custom_url}
          invitationData={invitationData} 
          isEditing={true} 
          plan={currentPlan} 
          onPlanChange={(newPlan) => {
            setCurrentPlan(newPlan);
            if (isDev) {
              setDevPlan(newPlan);
            }
          }}
          gcashNumber={gcashNumber}
          customQrImage={customQrImage}
          onGcashNumberChange={setGcashNumber}
          onQrImageChange={setCustomQrImage}
          onQrFileUpload={handleQrUpload}
          dressCodePrimaryColor={dressCodePrimaryColor}
          dressCodeSecondaryColor={dressCodeSecondaryColor}
          dressCodeMessage={dressCodeMessage}
          onDressCodePrimaryColorChange={setDressCodePrimaryColor}
          onDressCodeSecondaryColorChange={setDressCodeSecondaryColor}
          onDressCodeMessageChange={setDressCodeMessage}
          entourage={invitationData.entourage || {}}
          onEntourageChange={(newEntourage) =>
            setInvitationData(prev => ({ ...prev, entourage: newEntourage }))
          }
        />
      </div>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowLinkModal(true)}
        style={{
          position: 'fixed',
          bottom: '120px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#b07f56',
          color: '#fff',
          border: 'none',
          fontSize: '1.8rem',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(176,127,86,0.4)',
          zIndex: 1000,
        }}
      >
        📨
      </motion.button>
    </div>
  );
}

export default Dashboard;

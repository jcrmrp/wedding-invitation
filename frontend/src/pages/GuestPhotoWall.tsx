import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface GuestPhotoWallProps {
  coupleName?: string;
  isEditing?: boolean;
}
function GuestPhotoWall({ coupleName: propCoupleName, isEditing: propIsEditing }: GuestPhotoWallProps) {
  const { coupleName: paramCoupleName } = useParams<{ coupleName: string }>();
  const coupleName = propCoupleName || paramCoupleName;
  const [wedding, setWedding] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [myName, setMyName] = useState('');
  const [myCaption, setMyCaption] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [filter, setFilter] = useState('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const isEditing = propIsEditing ?? false;

  const deletePhoto = async (id: string, imageUrl: string) => {
    try {
      const path = imageUrl.split('/wedding-assets/').pop();
      if (path) {
        await supabase.storage.from('wedding-assets').remove([path]);
      }
      const { error } = await supabase.from('guest_photos').delete().eq('id', id);
      if (error) {
        alert('Delete failed: ' + error.message);
      } else if (wedding?.id) {
        loadPhotos(wedding.id);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failed');
    }
  };

  useEffect(() => {
    if (!coupleName) return;
    setLoading(true);
    supabase.from('weddings').select('*').eq('custom_url', coupleName).eq('is_published', true).maybeSingle().then(async ({ data }) => {
      if (!data) {
        const { data: byName } = await supabase.from('weddings').select('*').ilike('couple_names', coupleName).eq('is_published', true).maybeSingle();
        if (byName) {
          setWedding(byName);
          setEnabled(byName.guest_photo_wall_enabled || false);
          if (byName.id) loadPhotos(byName.id);
        }
      } else {
        setWedding(data);
        setEnabled(data.guest_photo_wall_enabled || false);
        if (data.id) loadPhotos(data.id);
      }
      setLoading(false);
    });
  }, [coupleName]);

  const loadPhotos = async (wid: string) => {
    const { data } = await supabase.from('guest_photos').select('*').eq('wedding_id', wid).eq('is_approved', true).order('display_order');
    if (data) setPhotos(data);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wedding?.id || !myName.trim()) {
      if (!myName.trim()) alert('Please enter your name first');
      setUploading(false);
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${wedding.id}/guest-wall/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('wedding-assets').upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) { alert('Upload failed: ' + uploadError.message); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('wedding-assets').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      const { error: dbError } = await supabase.from('guest_photos').insert({
        wedding_id: wedding.id,
        guest_name: myName.trim(),
        image_url: publicUrl,
        caption: myCaption.trim() || 'A moment from the wedding!',
        is_approved: true,
      });
      if (dbError) { 
        console.error('DB insert error:', dbError);
        alert(`Save failed: ${dbError.message || dbError.details || JSON.stringify(dbError)}`); 
      }
      setMyCaption('');
      setUploading(false);
      setSubmitted(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadPhotos(wedding.id);
    } catch (err) {
      console.error('Upload error:', err);
      setUploading(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#7b6a5d', background: '#faf4eb' }}>Loading photo wall…</div>;

  if (!enabled) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontFamily: 'Georgia, serif', background: '#faf4eb', color: '#4a3f35', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📸</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 400, margin: '0 0 8px' }}>Photo Wall Not Enabled</h1>
      <p style={{ color: '#7b6a5d', maxWidth: '400px', lineHeight: 1.6 }}>The couple hasn't enabled the guest photo wall for this wedding yet.</p>
    </div>
  );

  const captions = Array.from(new Set(photos.map(p => (p.caption || '').split(' ').slice(0, 2).join(' ')))).filter((f, i, arr) => f.length > 0 && f.length < 20 && arr.indexOf(f) === i).slice(0, 6);
  const filterOptions = ['all', ...captions];

  return (
    <div style={{ minHeight: '100vh', background: '#faf4eb', fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg, #4a3f35 0%, #6b5744 100%)', padding: '48px 20px', textAlign: 'center', color: '#fff' }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '3rem' }}>📸</span>
        </motion.div>
        <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontWeight: 400, margin: '0 0 8px', fontStyle: 'italic' }}>
          {wedding?.couple_names || 'The Wedding'} Photo Wall
        </h1>
        <p style={{ fontSize: '0.95rem', opacity: 0.85, margin: '0 0 20px' }}>Share your favorite moments from this special day</p>
        <button onClick={() => setSubmitted(true)} style={{ padding: '10px 24px', borderRadius: '10px', border: '1.5px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'Georgia, serif', backdropFilter: 'blur(10px)' }}>
          📤 Upload a Photo
        </button>
      </div>

      {/* Upload Panel */}
      <AnimatePresence>
        {submitted && (
          <motion.div initial={{ opacity: 0, maxHeight: 0 }} animate={{ opacity: 1, maxHeight: 500 }} exit={{ opacity: 0, maxHeight: 0 }} style={{ overflow: 'hidden', maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
            <div style={{ padding: '24px', background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce', margin: '-20px 0 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#4a3f35', margin: '0 0 16px', fontFamily: 'Georgia, serif' }}>Share Your Photo</h3>
              <input type="text" value={myName} onChange={e => setMyName(e.target.value)} placeholder="Your name *" required style={{ width: '100%', padding: '10px 14px', marginBottom: '10px', borderRadius: '10px', border: '1.5px solid #e5d9ce', background: '#fffdf9', color: '#4a3f35', fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '2px dashed #e5d9ce', background: '#fffdf9', color: '#4a3f35', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginBottom: '12px' }}>
                {uploading ? 'Uploading...' : '📸 Choose Photo'}
              </button>
              <textarea value={myCaption} onChange={e => setMyCaption(e.target.value)} placeholder="Add a caption..." rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5d9ce', background: '#fffdf9', color: '#4a3f35', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
              {uploading && <p style={{ fontSize: '0.75rem', color: '#b07f56', marginTop: '8px' }}>Uploading... please wait</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Grid */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
        {filterOptions.length > 2 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
            {filterOptions.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: '20px', border: filter === f ? 'none' : '1.5px solid #e5d9ce', background: filter === f ? '#b07f56' : '#fffdf9', color: filter === f ? '#fff' : '#7b6a5d', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{f === 'all' ? 'All' : f}</button>
            ))}
          </div>
        )}
{photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📸</div>
              <p style={{ color: '#7b6a5d', fontSize: '1rem' }}>No photos yet — be the first to share!</p>
            </div>
          ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {photos.filter(p => filter === 'all' || (p.caption || '').toLowerCase().includes(filter.toLowerCase())).map((photo, i) => (
              <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '1', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', position: 'relative' }}
                onMouseEnter={(e) => {
                  if (isEditing) {
                    const btn = e.currentTarget.querySelector('.guest-photo-delete-btn') as HTMLElement;
                    if (btn) { btn.style.opacity = '1'; btn.style.transform = 'scale(1)'; }
                    const overlay = e.currentTarget.querySelector('.guest-photo-name-overlay') as HTMLElement;
                    if (overlay) overlay.style.opacity = '0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isEditing) {
                    const btn = e.currentTarget.querySelector('.guest-photo-delete-btn') as HTMLElement;
                    if (btn) { btn.style.opacity = '0'; btn.style.transform = 'scale(0.8)'; }
                    const overlay = e.currentTarget.querySelector('.guest-photo-name-overlay') as HTMLElement;
                    if (overlay && photo.guest_name) overlay.style.opacity = '1';
                  }
                }}
              >
                <img src={photo.image_url} alt={photo.caption || ''} onClick={() => !isEditing && setLightbox(photo.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                {isEditing && (
                  <button
                    className="guest-photo-delete-btn"
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this photo?')) deletePhoto(photo.id, photo.image_url); }}
                    style={{
                      position: 'absolute', top: '8px', right: '8px', zIndex: 10,
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'rgba(220, 38, 38, 0.9)', color: '#fff', border: 'none',
                      cursor: 'pointer', fontSize: '1rem', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      opacity: 0, transform: 'scale(0.8)',
                      transition: 'all 0.2s',
                    }}
                    title="Delete photo"
                  >
                    ✕
                  </button>
                )}
                <div className="guest-photo-name-overlay" style={{ position: 'absolute', bottom: 0, insetInline: 0, padding: '8px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', color: '#fff', fontSize: '0.78rem', fontWeight: 500, transition: 'opacity 0.2s' }}>
                  {photo.guest_name && <span style={{ marginRight: '6px' }}>👤 {photo.guest_name}</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {photos.length > 0 && <p style={{ textAlign: 'center', color: '#7b6a5d', fontSize: '0.78rem', marginTop: '16px' }}>{photos.length} photo{photos.length !== 1 ? 's' : ''} shared by guests</p>}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '20px' }}>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
            <div style={{ position: 'absolute', bottom: '24px', color: '#fff', fontSize: '0.85rem', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: '20px' }}>Click to close</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GuestPhotoWall;

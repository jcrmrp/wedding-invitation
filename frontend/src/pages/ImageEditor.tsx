import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface Photo {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
}

interface SavedImage {
  id: string;
  image_url: string;
  filter: string;
  rotation: number;
}

function ImageEditorTool() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [weddingId, setWeddingId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('none');
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters: { id: string; label: string; css: string; canvas?: string }[] = [
    { id: 'none', label: 'Original', css: 'none', canvas: '' },
    { id: 'vintage', label: 'Vintage', css: 'sepia(0.35) brightness(0.95) contrast(1.1)', canvas: 'sepia(0.35) brightness(0.95) contrast(1.1)' },
    { id: 'warm', label: 'Warm Glow', css: 'sepia(0.2) brightness(1.05) saturate(1.2)', canvas: 'sepia(0.2) brightness(1.05) saturate(1.2)' },
    { id: 'cool', label: 'Cool Breeze', css: 'saturate(0.9) brightness(1.05) hue-rotate(10deg)', canvas: 'saturate(0.9) brightness(1.05) hue-rotate(10deg)' },
    { id: 'bw', label: 'B&W', css: 'grayscale(1)', canvas: 'grayscale(1)' },
    { id: 'fade', label: 'Faded', css: 'opacity(0.85) contrast(0.85) brightness(1.1)', canvas: 'opacity(0.85) contrast(0.85) brightness(1.1)' },
    { id: 'dramatic', label: 'Dramatic', css: 'contrast(1.3) brightness(0.9) saturate(1.2)', canvas: 'contrast(1.3) brightness(0.9) saturate(1.2)' },
  ];

  const effectFilters: { id: string; label: string; value: (b: number, c: number, s: number) => string }[] = [
    { id: 'bw', label: 'B&W', value: () => `grayscale(100%)` },
    { id: 'sepia', label: 'Sepia', value: () => `sepia(80%)` },
    { id: 'invert', label: 'Invert', value: () => `invert(100%)` },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: wedding } = await supabase.from('weddings').select('*').eq('user_id', user.id).maybeSingle();
    if (!wedding) return;
    setWeddingId(wedding.id);
    const { data: photosData } = await supabase.from('photos').select('*').eq('wedding_id', wedding.id).order('display_order');
    if (photosData) setPhotos(photosData as Photo[]);
    const { data: saved } = await supabase.from('photos').select('*').eq('wedding_id', wedding.id).not('saved_filter_url', 'is', null);
    if (saved) setSavedImages(saved as any);
  };

  const getFilterCSS = (photo: Photo | null) => {
    const baseFilter = activeFilter !== 'none' ? filters.find(f => f.id === activeFilter)?.css || 'none' : 'none';
    return `${baseFilter} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  };

  const getCanvasFilter = () => {
    const base = activeFilter !== 'none' ? filters.find(f => f.id === activeFilter)?.canvas : undefined;
    const parts: string[] = [];
    if (base) parts.push(base);
    parts.push(`brightness(${brightness}%)`);
    parts.push(`contrast(${contrast}%)`);
    parts.push(`saturate(${saturation}%)`);
    return parts.join(' ');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !weddingId) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = `${weddingId}/edits/${Date.now()}.${ext}`;
    await supabase.storage.from('wedding-assets').remove([path]);
    const { error: uploadError } = await supabase.storage.from('wedding-assets').upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { alert('Upload failed: ' + uploadError.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('wedding-assets').getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    const { error: dbError } = await supabase.from('photos').insert({ wedding_id: weddingId, image_url: publicUrl, caption: 'Edited photo', display_order: photos.length });
    if (dbError) { alert('Save failed: ' + dbError.message); }
    else { loadData(); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyEdits = async () => {
    if (!canvasRef.current || !selectedPhoto) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.filter = getCanvasFilter();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.drawImage(img, 0, 0);
        const editedDataUrl = canvas.toDataURL('image/png', 0.92);
        const { error: saveError } = await supabase.from('photos').update({ image_url: editedDataUrl }).eq('id', selectedPhoto.id);
        if (saveError) { alert('Save failed: ' + saveError.message); }
        else { loadData(); setSelectedPhoto(null); }
        setSaving(false);
      };
      img.onerror = () => { alert('Failed to load image for editing'); setSaving(false); };
      img.src = selectedPhoto.image_url;
    } catch (err) { console.error('Edit error:', err); setSaving(false); }
  };

  const deletePhoto = async (id: string) => {
    if (!confirm('Delete this photo?')) return;
    const { error } = await supabase.from('photos').delete().eq('id', id);
    if (error) { alert('Delete failed: ' + error.message); return; }
    loadData();
    if (selectedPhoto?.id === id) setSelectedPhoto(null);
  };

  const resetEdits = () => {
    setActiveFilter('none');
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 400, color: '#4a3f35', margin: '0 0 20px', fontFamily: 'Georgia, serif' }}>✏️ Image Editing Tools</h1>

      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Upload */}
          <div style={{ marginBottom: '24px', padding: '20px', background: '#fffdf9', borderRadius: '14px', border: '1.5px dashed #e5d9ce' }}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ padding: '12px 24px', borderRadius: '10px', border: '1.5px solid #b07f56', background: '#b07f56', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Georgia, serif', opacity: uploading ? 0.6 : 1 }}>
              {uploading ? 'Uploading…' : '📤 Upload New Photo'}
            </button>
            {savedImages.length > 0 && <p style={{ fontSize: '0.75rem', color: '#7b6a5d', marginTop: '8px' }}>{savedImages.length} saved edit(s) from previous sessions</p>}
          </div>

          {/* Photo grid */}
          {photos.length === 0 ? (
            <p style={{ color: '#7b6a5d', fontSize: '0.9rem', textAlign: 'center', padding: '40px' }}>No photos yet. Upload some to start editing!</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', padding: '10px', borderRadius: '14px', border: '1.5px solid #e5d9ce', background: '#fffdf9' }}>
              {photos.map(photo => (
                <div key={photo.id} onClick={() => setSelectedPhoto(photo)} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', border: selectedPhoto?.id === photo.id ? '2px solid #b07f56' : '2px solid transparent', transition: 'all 0.2s' }}>
                  {selectedPhoto?.id === photo.id ? (
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                      <img src={photo.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${rotation}deg)`, filter: getFilterCSS(photo) }} />
                    </div>
                  ) : (
                    <img src={photo.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                  <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' }}>Edit</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedPhoto && (
          <div style={{ width: '320px', flexShrink: 0, padding: '20px', background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce', position: 'sticky', top: '80px', maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1rem', color: '#4a3f35', margin: '0 0 12px', fontFamily: 'Georgia, serif' }}>Edit Photo</h3>

            {/* Preview */}
            <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '16px', background: '#f5f0eb', aspectRatio: '1' }}>
              <img src={selectedPhoto.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `rotate(${rotation}deg)`, filter: getFilterCSS(selectedPhoto) }} />
            </div>

            {/* Preset Filters */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7b6a5d', display: 'block', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>One-Tap Filters</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {filters.map(f => (
                  <div key={f.id} onClick={() => setActiveFilter(f.id === activeFilter ? 'none' : f.id)} style={{ padding: '8px 4px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: activeFilter === f.id ? '#b07f56' : '#faf4eb', border: `1.5px solid ${activeFilter === f.id ? '#b07f56' : '#e5d9ce'}`, color: activeFilter === f.id ? '#fff' : '#7b6a5d', fontSize: '0.68rem', fontWeight: 600, transition: 'all 0.2s' }}>
                    {f.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7b6a5d', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>Brightness <span style={{ color: '#b07f56' }}>{brightness}%</span></label>
              <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(Number(e.target.value))} style={{ width: '100%', accentColor: '#b07f56' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7b6a5d', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>Contrast <span style={{ color: '#b07f56' }}>{contrast}%</span></label>
              <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(Number(e.target.value))} style={{ width: '100%', accentColor: '#b07f56' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7b6a5d', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>Saturation <span style={{ color: '#b07f56' }}>{saturation}%</span></label>
              <input type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} style={{ width: '100%', accentColor: '#b07f56' }} />
            </div>

            {/* Rotation */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7b6a5d', display: 'block', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rotation</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[0, 90, 180, 270].map(r => (
                  <button key={r} onClick={() => setRotation(r)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1.5px solid ${rotation === r ? '#b07f56' : '#e5d9ce'}`, background: rotation === r ? '#b07f56' : '#faf4eb', color: rotation === r ? '#fff' : '#7b6a5d', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>{r}°</button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <button onClick={applyEdits} disabled={saving} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#4a3f35', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Georgia, serif', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving...' : '💾 Save Edits'}
              </button>
              <button onClick={resetEdits} style={{ padding: '10px', borderRadius: '8px', border: '1.5px solid #e5d9ce', background: 'transparent', color: '#7b6a5d', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                Reset All
              </button>
              <button onClick={() => deletePhoto(selectedPhoto.id)} style={{ padding: '10px', borderRadius: '8px', border: '1.5px solid #e5d9ce', background: '#fef2f2', color: '#b04a4a', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                🗑 Delete Photo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for processing */}
      {selectedPhoto && <canvas ref={canvasRef} style={{ display: 'none' }} />}
    </div>
  );
}

export default ImageEditorTool;

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

interface Collaborator {
  id: string;
  email: string;
  role: 'editor' | 'viewer' | 'admin';
  name?: string;
}

function Collaboration() {
  const [weddingId, setWeddingId] = useState('');
  const [weddingSlug, setWeddingSlug] = useState('');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareType, setShareType] = useState('link');
  const [activeTab, setActiveTab] = useState<'collaborators' | 'sharing' | 'permissions'>('sharing');

  const roles = [
    { id: 'editor', label: 'Editor', desc: 'Can edit invitation details, photos, and settings', icon: '✏️' },
    { id: 'viewer', label: 'Viewer', desc: 'Can only view the invitation', icon: '👁️' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: wedding } = await supabase.from('weddings').select('*').eq('user_id', user.id).maybeSingle();
    if (wedding) {
      setWeddingId(wedding.id);
      setWeddingSlug(wedding.custom_url || '');
      const collabs = wedding.collaborators ? JSON.parse(JSON.stringify(wedding.collaborators)) : [];
      setCollaborators(collabs);
    }
    setLoading(false);
  };

  const addCollaborator = async () => {
    if (!inviteEmail.trim()) return;
    setSaving(true);
    try {
      await navigator.clipboard.writeText(publicLink);
      alert(`Invitation link copied to clipboard!\n\nSend this to ${inviteEmail}`);
    } catch (err) {
      alert('Failed to copy link');
    }
    setSaving(false);
  };

  const removeCollaborator = async (id: string) => {
    const updated = collaborators.filter(c => c.id !== id);
    await supabase.from('weddings').update({ collaborators: updated }).eq('id', weddingId);
    setCollaborators(updated);
  };

  const updateRole = async (id: string, role: 'editor' | 'viewer') => {
    const updated = collaborators.map(c => c.id === id ? { ...c, role } : c);
    await supabase.from('weddings').update({ collaborators: updated }).eq('id', weddingId);
    setCollaborators(updated);
  };

  const publicLink = typeof window !== 'undefined' ? `${window.location.origin}/invite/${weddingSlug}` : '';
  const editorLink = shareType === 'link' ? `${publicLink}?mode=edit&token=${weddingId.slice(0, 8)}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(editorLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy');
    }
  };

  const manageGuests = () => {
    alert('Guest management opens here — bulk import, categories, and individual guest tracking.');
  };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', color: '#7b6a5d' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 400, color: '#4a3f35', margin: '0 0 20px', fontFamily: 'Georgia, serif' }}>👥 Collaboration & Sharing</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1.5px solid #e5d9ce', background: '#faf8f5', borderRadius: '12px 12px 0 0', padding: '0 4px' }}>
        {([{ id: 'sharing', label: 'Link Sharing', icon: '🔗' }, { id: 'collaborators', label: 'Co-Editors', icon: '👥' }, { id: 'permissions', label: 'Guest Management', icon: '📋' }] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '10px 6px 8px', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #b07f56' : '2px solid transparent', background: activeTab === tab.id ? '#fffdf9' : 'transparent', color: activeTab === tab.id ? '#b07f56' : '#9e8e82', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '8px 8px 0 0', minWidth: 0, transition: 'all 0.18s' }}>
            <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
            <span style={{ fontSize: '0.62rem', fontWeight: activeTab === tab.id ? 700 : 500, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Sharing Tab */}
      {activeTab === 'sharing' && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ padding: '20px', background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4a3f35', margin: '0 0 12px', fontFamily: 'Georgia, serif' }}>Share Options</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { id: 'link', label: 'Link', icon: '🔗' },
                { id: 'email', label: 'Invite by Email', icon: '📧' },
                { id: 'qr', label: 'QR Code', icon: '📱' },
              ].map(opt => (
                <button key={opt.id} onClick={() => setShareType(opt.id)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: shareType === opt.id ? 'none' : '1.5px solid #e5d9ce', background: shareType === opt.id ? '#b07f56' : '#faf4eb', color: shareType === opt.id ? '#fff' : '#7b6a5d', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
            {shareType === 'qr' ? (
              <div style={{ textAlign: 'center', padding: '20px', background: '#faf4eb', borderRadius: '10px' }}>
                <div style={{ width: '160px', height: '160px', margin: '0 auto 12px', background: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5d9ce', padding: '8px' }}>
                  <QRCodeSVG value={publicLink} size={144} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#7b6a5d', margin: 0 }}>QR code for your invitation</p>
              </div>
            ) : shareType === 'link' ? (
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input readOnly value={editorLink} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e5d9ce', background: '#f5f0eb', fontSize: '0.82rem', color: '#4a3f35', fontFamily: 'monospace' }} />
                  <button onClick={copyLink} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#b07f56', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{copied ? 'Copied!' : 'Copy'}</button>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#7b6a5d', marginTop: '6px' }}>Share this link with co-editors to allow editing</p>
              </div>
            ) : null}
          </div>
          <div style={{ padding: '16px', background: '#faf8f5', borderRadius: '12px', border: '1px solid #e5d9ce', fontSize: '0.8rem', color: '#7b6a5d', lineHeight: 1.6 }}>
            <strong style={{ color: '#4a3f35' }}>Public invitation link:</strong><br />
            <code style={{ fontSize: '0.78rem', color: '#b07f56', wordBreak: 'break-all' }}>{publicLink}</code>
          </div>
        </motion.div>
      )}

      {/* Collaborators Tab */}
      {activeTab === 'collaborators' && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'grid', gap: '16px' }}>
          <div style={{ padding: '20px', background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4a3f35', margin: '0 0 14px', fontFamily: 'Georgia, serif' }}>Invite Co-Editors</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@email.com" style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5d9ce', background: '#faf4eb', fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'editor' | 'viewer')} style={{ padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #e5d9ce', background: '#faf4eb', fontSize: '0.85rem', fontFamily: 'inherit' }}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
            <button onClick={addCollaborator} disabled={saving} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: '#b07f56', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Georgia, serif', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Sending…' : '📧 Send Invitation'}
            </button>
            <p style={{ fontSize: '0.72rem', color: '#7b6a5d', marginTop: '8px', textAlign: 'center' }}>They'll receive a link to edit the invitation</p>
          </div>

          {collaborators.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#7b6a5d', fontSize: '0.9rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
              No co-editors yet. Invite someone to collaborate!
            </div>
          ) : (
            collaborators.map(collab => (
              <motion.div key={collab.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#fffdf9', borderRadius: '12px', border: '1.5px solid #e5d9ce', gap: '12px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#4a3f35', fontSize: '0.9rem' }}>{collab.email}</div>
                  <div style={{ fontSize: '0.72rem', color: '#7b6a5d' }}>{roles.find(r => r.id === collab.role)?.label}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select value={collab.role} onChange={e => updateRole(collab.id, e.target.value as 'editor' | 'viewer')} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5d9ce', background: '#faf4eb', fontSize: '0.72rem', fontFamily: 'inherit' }}>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <button onClick={() => removeCollaborator(collab.id)} style={{ background: 'none', border: 'none', color: '#b04a4a', cursor: 'pointer', fontSize: '0.85rem', padding: '4px 8px' }}>✕</button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      {/* Guest Management Tab */}
      {activeTab === 'permissions' && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <GuestManagementPanel weddingId={weddingId} />
        </motion.div>
      )}
    </div>
  );
}

function GuestManagementPanel({ weddingId }: { weddingId: string }) {
  const [guests, setGuests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, confirmed: 0, declined: 0, maybe: 0, pending: 0 });

  useEffect(() => {
    if (weddingId) loadGuests();
  }, [weddingId]);

  const loadGuests = async () => {
    const { data } = await supabase.from('guests').select('*, guest_categories(*)').eq('wedding_id', weddingId).order('name');
    if (data) {
      setGuests(data);
      const newStats = { total: data.length, confirmed: 0, declined: 0, maybe: 0, pending: 0 };
      data.forEach((g: any) => {
        if (g.rsvp_status === 'confirmed') newStats.confirmed++;
        else if (g.rsvp_status === 'declined') newStats.declined++;
        else if (g.rsvp_status === 'maybe') newStats.maybe++;
        else newStats.pending++;
      });
      setStats(newStats);
    }
    const { data: cats } = await supabase.from('guest_categories').select('*').eq('wedding_id', weddingId);
    if (cats) setCategories(cats);
    setLoading(false);
  };

  const bulkImport = async () => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    const newGuests = lines.map(line => {
      const parts = line.split(',').map((p: string) => p.trim());
      const name = parts[0];
      const email = parts[1] || null;
      const phone = parts[2] || null;
      return { wedding_id: weddingId, name, email, phone, rsvp_status: 'pending', number_of_guests: 1 };
    });
    const { error } = await supabase.from('guests').insert(newGuests);
    if (error) { alert('Bulk import failed: ' + error.message); return; }
    setBulkText('');
    setShowBulkImport(false);
    loadGuests();
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const { error } = await supabase.from('guest_categories').insert({ wedding_id: weddingId, name: newCategory.trim() });
    if (error) return;
    setNewCategory('');
    loadGuests();
  };

  const assignCategory = async (guestId: string, categoryId: string | null) => {
    await supabase.from('guests').update({ category_id: categoryId }).eq('id', guestId);
    loadGuests();
  };

  const deleteGuest = async (id: string) => {
    if (!confirm('Remove this guest?')) return;
    await supabase.from('guests').delete().eq('id', id);
    loadGuests();
  };

  const deleteCategory = async (id: string) => {
    await supabase.from('guest_categories').delete().eq('id', id);
    loadGuests();
  };

  const filteredGuests = guests.filter(g => {
    if (filter && !g.name.toLowerCase().includes(filter.toLowerCase()) && !(g.email || '').toLowerCase().includes(filter.toLowerCase())) return false;
    if (statusFilter !== 'all' && g.rsvp_status !== statusFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedGuests);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedGuests(newSet);
  };

  const selectAll = () => {
    if (selectedGuests.size === filteredGuests.length) setSelectedGuests(new Set());
    else setSelectedGuests(new Set(filteredGuests.map(g => g.id)));
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selectedGuests.size} selected guests?`)) return;
    await supabase.from('guests').delete().in('id', Array.from(selectedGuests));
    setSelectedGuests(new Set());
    loadGuests();
  };

  if (loading) return <div style={{ fontFamily: 'Georgia, serif', color: '#7b6a5d', padding: '20px' }}>Loading guests...</div>;

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {[
          { label: 'Total', value: stats.total, color: '#4a3f35', bg: '#faf4eb' },
          { label: 'Confirmed', value: stats.confirmed, color: '#4a7c59', bg: '#f0f7f2' },
          { label: 'Declined', value: stats.declined, color: '#b04a4a', bg: '#fef2f2' },
          { label: 'Maybe', value: stats.maybe, color: '#b07f56', bg: '#f5f0eb' },
          { label: 'Pending', value: stats.pending, color: '#7b6a5d', bg: '#faf8f5' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 8px', borderRadius: '10px', background: s.bg, textAlign: 'center', border: `1px solid ${s.color}20` }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#7b6a5d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search guests..." style={{ flex: 1, minWidth: '150px', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e5d9ce', background: '#faf4eb', fontSize: '0.82rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e5d9ce', background: '#faf4eb', fontSize: '0.82rem', fontFamily: 'inherit' }}>
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="declined">Declined</option>
          <option value="maybe">Maybe</option>
          <option value="pending">Pending</option>
        </select>
        <button onClick={() => setShowBulkImport(!showBulkImport)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #b07f56', background: '#b07f56', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>📥 Bulk Import</button>
        {selectedGuests.size > 0 && (
          <button onClick={bulkDelete} style={{ padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #e5d9ce', background: '#fef2f2', color: '#b04a4a', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem' }}>Delete ({selectedGuests.size})</button>
        )}
      </div>

      {/* Bulk Import */}
      <AnimatePresence>
        {showBulkImport && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px', background: '#f5f0eb', borderRadius: '10px', border: '1.5px solid #b07f5630' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a3f35', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paste guest list (Name, Email, Phone per line)</label>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder="Juan Dela Cruz, juan@email.com, 09171234567&#10;Maria Santos, maria@email.com" rows={5} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5d9ce', background: '#fffdf9', fontSize: '0.82rem', fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }} />
              <button onClick={bulkImport} style={{ marginTop: '10px', padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#4a3f35', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}>Import Guests</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div style={{ padding: '14px', background: '#fffdf9', borderRadius: '12px', border: '1.5px solid #e5d9ce' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7b6a5d', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Categories</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="New category..." style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #e5d9ce', background: '#faf4eb', fontSize: '0.75rem', fontFamily: 'inherit', width: '120px' }} />
          <button onClick={addCategory} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: '#b07f56', color: '#fff', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600 }}>+</button>
          {categories.map(cat => (
            <div key={cat.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: `${cat.color}15`, border: `1px solid ${cat.color}40`, fontSize: '0.72rem', color: cat.color, fontWeight: 500 }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
              {cat.name}
              <button onClick={() => deleteCategory(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: cat.color, fontSize: '0.85rem', marginLeft: '2px' }}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Guest List */}
      <div style={{ background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5d9ce', background: '#faf8f5' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a3f35' }}>{filteredGuests.length} guests</span>
          <button onClick={selectAll} style={{ fontSize: '0.72rem', color: '#b07f56', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {selectedGuests.size === filteredGuests.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        {filteredGuests.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '32px', color: '#7b6a5d', fontSize: '0.85rem' }}>No guests match your filter.</p>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredGuests.map(guest => (
              <div key={guest.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: '1px solid #f5f0eb', transition: 'background 0.15s' }}
                onMouseOver={e => e.currentTarget.style.background = '#faf8f5'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <input type="checkbox" checked={selectedGuests.has(guest.id)} onChange={() => toggleSelect(guest.id)} style={{ accentColor: '#b07f56', cursor: 'pointer' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#4a3f35', fontSize: '0.85rem' }}>{guest.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#7b6a5d' }}>{guest.email || guest.phone || '—'} · {guest.number_of_guests} guest{guest.number_of_guests !== 1 ? 's' : ''}</div>
                </div>
                <select value={guest.category_id || ''} onChange={e => assignCategory(guest.id, e.target.value || null)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5d9ce', background: '#faf4eb', fontSize: '0.7rem', fontFamily: 'inherit' }}>
                  <option value="">No category</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <span style={{
                  padding: '3px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 600,
                  background: guest.rsvp_status === 'confirmed' ? '#4a7c5920' : guest.rsvp_status === 'declined' ? '#b04a4a20' : guest.rsvp_status === 'maybe' ? '#b07f5620' : '#7b6a5d20',
                  color: guest.rsvp_status === 'confirmed' ? '#4a7c59' : guest.rsvp_status === 'declined' ? '#b04a4a' : guest.rsvp_status === 'maybe' ? '#b07f56' : '#7b6a5d',
                }}>{guest.rsvp_status || 'pending'}</span>
                <button onClick={() => deleteGuest(guest.id)} style={{ background: 'none', border: 'none', color: '#b07f5680', cursor: 'pointer', fontSize: '0.85rem' }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Collaboration;

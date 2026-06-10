import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface Guest { id: string; name: string; category_id?: string; }
interface Table {
  id: string;
  table_number: number;
  table_name: string | null;
  shape: 'round' | 'rectangle' | 'oval';
  capacity: number;
  position_x: number;
  position_y: number;
  color: string;
  guests: Guest[];
}

const TABLE_COLORS = ['#b07f56','#7a5b7d','#4c7a52','#5f7f95','#c5855e','#a56f43','#6373b2','#7f6b9e'];

function SeatingChartBuilder() {
  const [tables, setTables]                 = useState<Table[]>([]);
  const [unassigned, setUnassigned]         = useState<any[]>([]);
  const [weddingId, setWeddingId]           = useState('');
  const [weddingName, setWeddingName]       = useState('');
  const [weddingDate, setWeddingDate]       = useState('');
  const [saving, setSaving]                 = useState(false);
  const [selectedTable, setSelectedTable]   = useState<Table | null>(null);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [newName, setNewName]               = useState('');
  const [newCapacity, setNewCapacity]       = useState(8);
  const [newShape, setNewShape]             = useState<Table['shape']>('round');
  const [newColor, setNewColor]             = useState(TABLE_COLORS[0]);
  const [dragging, setDragging]             = useState<string | null>(null);
  const [dragOffset, setDragOffset]         = useState({ x: 0, y: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: w } = await supabase.from('weddings').select('*').eq('user_id', user.id).maybeSingle();
    if (!w) return;
    setWeddingId(w.id);
    setWeddingName(w.couple_names || 'Wedding');
    setWeddingDate(w.wedding_date || '');

    const { data: tablesData } = await supabase.from('seating_charts').select('*').eq('wedding_id', w.id);
    const rows: Table[] = (tablesData || []).map((t: any) => ({ ...t, guests: t.guests || [] }));
    setTables(rows);

    const assignedIds = new Set(rows.flatMap(t => t.guests.map((g: any) => g.id)));
    const { data: guestsData } = await supabase.from('guests').select('*').eq('wedding_id', w.id);
    setUnassigned((guestsData || []).filter((g: any) => !assignedIds.has(g.id)));
  };

  // ── Table CRUD ────────────────────────────────────────────────────────────
  const addTable = async () => {
    if (!weddingId) return;
    const n = tables.length;
    const cols = 4;
    const t: Table = {
      id: crypto.randomUUID(),
      table_number: n + 1,
      table_name: newName || `Table ${n + 1}`,
      shape: newShape,
      capacity: newCapacity,
      position_x: (n % cols) * 220 + 40,
      position_y: Math.floor(n / cols) * 200 + 40,
      color: newColor,
      guests: [],
    };
    await supabase.from('seating_charts').insert({ wedding_id: weddingId, ...t });
    setTables(prev => [...prev, t]);
    setNewName(''); setShowAddModal(false);
  };

  const deleteTable = async (id: string) => {
    if (!confirm('Delete this table and unassign all its guests?')) return;
    const t = tables.find(x => x.id === id);
    if (t) setUnassigned(prev => [...prev, ...t.guests]);
    await supabase.from('seating_charts').delete().eq('id', id);
    setTables(prev => prev.filter(x => x.id !== id));
    if (selectedTable?.id === id) setSelectedTable(null);
  };

  const updateTable = async (id: string, updates: Partial<Table>) => {
    const updated = tables.map(t => t.id === id ? { ...t, ...updates } : t);
    setTables(updated);
    const t = updated.find(x => x.id === id);
    if (t && selectedTable?.id === id) setSelectedTable(t);
    await supabase.from('seating_charts').update(updates).eq('id', id);
  };

  // ── Guest assignment ──────────────────────────────────────────────────────
  const assignGuest = async (guestId: string, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.guests.length >= table.capacity) { alert('Table is full!'); return; }
    const guest = unassigned.find(g => g.id === guestId);
    if (!guest) return;
    const newGuests = [...table.guests, { id: guest.id, name: guest.name }];
    await updateTable(tableId, { guests: newGuests });
    setUnassigned(prev => prev.filter(g => g.id !== guestId));
  };

  const unassignGuest = async (tableId: string, guestId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const guest = table.guests.find(g => g.id === guestId);
    const newGuests = table.guests.filter(g => g.id !== guestId);
    await updateTable(tableId, { guests: newGuests });
    if (guest) setUnassigned(prev => [...prev, { id: guest.id, name: guest.name }]);
  };

  // ── Drag to move tables ───────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent, tableId: string) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragging(tableId);
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !chartRef.current) return;
    const chartRect = chartRef.current.getBoundingClientRect();
    const x = Math.max(0, e.clientX - chartRect.left - dragOffset.x);
    const y = Math.max(0, e.clientY - chartRect.top - dragOffset.y);
    setTables(prev => prev.map(t => t.id === dragging ? { ...t, position_x: x, position_y: y } : t));
  };

  const onMouseUp = async () => {
    if (!dragging) return;
    const t = tables.find(x => x.id === dragging);
    if (t) await supabase.from('seating_charts').update({ position_x: t.position_x, position_y: t.position_y }).eq('id', t.id);
    setDragging(null);
  };

  // ── Save all ──────────────────────────────────────────────────────────────
  const saveAll = async () => {
    setSaving(true);
    for (const t of tables) {
      await supabase.from('seating_charts').update({ guests: t.guests, position_x: t.position_x, position_y: t.position_y, table_name: t.table_name, capacity: t.capacity, color: t.color, shape: t.shape }).eq('id', t.id);
    }
    setSaving(false);
    alert('Seating chart saved!');
  };

  const totalSeated   = tables.reduce((s, t) => s + t.guests.length, 0);
  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);

  // ── Table shape renderer ──────────────────────────────────────────────────
  const TableShape = ({ table }: { table: Table }) => {
    const w = table.shape === 'rectangle' ? 180 : 140;
    const h = table.shape === 'rectangle' ? 90  : 140;
    const rx = table.shape === 'round' ? '50%' : table.shape === 'oval' ? '50%' : '12px';
    const fill = table.guests.length >= table.capacity ? '#e8c8c8' : `${table.color}22`;
    const stroke = selectedTable?.id === table.id ? table.color : `${table.color}88`;

    return (
      <div style={{
        width: w, height: h,
        borderRadius: rx,
        background: fill,
        border: `2px solid ${stroke}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        boxShadow: selectedTable?.id === table.id ? `0 0 0 3px ${table.color}44, 0 4px 16px rgba(0,0,0,0.12)` : '0 2px 8px rgba(0,0,0,0.07)',
        transition: 'all 0.2s', cursor: 'grab', userSelect: 'none',
        gap: '3px', padding: '8px',
      }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#4a3f35', fontFamily: '"Playfair Display", Georgia, serif', textAlign: 'center', lineHeight: 1.2, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {table.table_name}
        </span>
        <span style={{ fontSize: '0.62rem', color: table.color, fontWeight: 600 }}>
          {table.guests.length}/{table.capacity}
        </span>
        {table.guests.slice(0, 3).map(g => (
          <span key={g.id} style={{ fontSize: '0.58rem', color: '#7b6a5d', maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {g.name}
          </span>
        ))}
        {table.guests.length > 3 && (
          <span style={{ fontSize: '0.55rem', color: '#b0a090' }}>+{table.guests.length - 3} more</span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* ── Print-only header ─────────────────────────────────────── */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #sc-printable, #sc-printable * { visibility: visible; }
          #sc-printable { position: fixed; inset: 0; background: #fff; padding: 32px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '20px', fontFamily: '"Playfair Display", Georgia, serif' }}>

        {/* ── Top bar ───────────────────────────────────────────────── */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 400, color: '#4a3f35', margin: '0 0 4px' }}>🍽️ Seating Chart</h1>
            <p style={{ color: '#7b6a5d', fontSize: '0.85rem', margin: 0 }}>
              Drag tables to position them · Click a table to manage guests
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Stats */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: 'Tables', value: tables.length, color: '#b07f56' },
                { label: 'Seated', value: totalSeated, color: '#4a7c59' },
                { label: 'Capacity', value: totalCapacity, color: '#7b6a5d' },
                { label: 'Unassigned', value: unassigned.length, color: unassigned.length > 0 ? '#b04a4a' : '#4a7c59' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '8px 14px', background: '#fffdf9', border: '1px solid #e5d9ce', borderRadius: '10px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.62rem', color: '#b0a090', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#b07f56', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit' }}>
              + Add Table
            </button>
            <button onClick={() => window.print()} style={{ padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #e5d9ce', background: '#fffdf9', color: '#7b6a5d', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'inherit' }}>
              🖨️ Print
            </button>
            <button onClick={saveAll} disabled={saving} style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: '#4a3f35', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : '💾 Save'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>

          {/* ── Chart canvas ──────────────────────────────────────────── */}
          <div id="sc-printable" style={{ background: '#fffdf9', border: '1.5px solid #e5d9ce', borderRadius: '16px', overflow: 'hidden' }}>

            {/* Print header */}
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e5d9ce', background: 'linear-gradient(135deg, #faf4eb, #fff8f2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', color: '#4a3f35', margin: '0 0 2px', fontStyle: 'italic', fontWeight: 700 }}>
                  {weddingName} — Seating Chart
                </h2>
                {weddingDate && (
                  <p style={{ fontSize: '0.78rem', color: '#7b6a5d', margin: 0, letterSpacing: '0.06em' }}>
                    {new Date(weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4a7c59' }} />
                  <span style={{ fontSize: '0.72rem', color: '#7b6a5d' }}>{totalSeated} guests seated</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#e5d9ce' }} />
                  <span style={{ fontSize: '0.72rem', color: '#7b6a5d' }}>{totalCapacity - totalSeated} seats available</span>
                </div>
              </div>
            </div>

            {/* Drag canvas */}
            <div
              ref={chartRef}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              style={{ position: 'relative', minHeight: '560px', minWidth: 'auto', overflow: 'auto', background: `radial-gradient(circle at 50% 50%, #faf4eb 0%, #f5ede0 100%)` }}
            >
              {/* Grid dots */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.3 }}>
                <defs>
                  <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#b07f56" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" />
              </svg>

              {/* Floor legend */}
              <div style={{ position: 'absolute', top: '12px', right: '16px', display: 'flex', gap: '8px', zIndex: 10 }}>
                <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.8)', border: '1px solid #e5d9ce', fontSize: '0.65rem', color: '#7b6a5d', fontWeight: 600, letterSpacing: '0.08em' }}>
                  🎤 Stage / Altar ↑
                </div>
              </div>

              {/* Tables */}
              {tables.map(table => (
                <div
                  key={table.id}
                  onMouseDown={e => onMouseDown(e, table.id)}
                  onClick={() => setSelectedTable(table)}
                  style={{ position: 'absolute', left: table.position_x, top: table.position_y, zIndex: dragging === table.id ? 20 : 5, cursor: dragging === table.id ? 'grabbing' : 'grab' }}
                >
                  <TableShape table={table} />
                </div>
              ))}

              {tables.length === 0 && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#b0a090' }}>
                  <span style={{ fontSize: '3rem' }}>🍽️</span>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>No tables yet — add one to start planning</p>
                </div>
              )}
            </div>

            {/* Print: full alphabetical guest list */}
            <div style={{ display: 'none' }} className="print-only">
              <div style={{ padding: '24px 28px', borderTop: '1px solid #e5d9ce' }}>
                <h3 style={{ fontSize: '1rem', color: '#4a3f35', margin: '0 0 16px', fontStyle: 'italic' }}>Guest Assignments</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {tables.map(t => (
                    <div key={t.id} style={{ breakInside: 'avoid' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4a3f35', borderBottom: `2px solid ${t.color}`, paddingBottom: '4px', marginBottom: '8px' }}>{t.table_name}</div>
                      {t.guests.map(g => (
                        <div key={g.id} style={{ fontSize: '0.72rem', color: '#7b6a5d', paddingLeft: '8px', marginBottom: '2px' }}>• {g.name}</div>
                      ))}
                      {t.guests.length === 0 && <div style={{ fontSize: '0.68rem', color: '#c0b0a0', fontStyle: 'italic', paddingLeft: '8px' }}>No guests assigned</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Unassigned guests */}
            <div style={{ background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: unassigned.length > 0 ? '#fff5f0' : '#f0f8f0', borderBottom: '1px solid #e5d9ce', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4a3f35' }}>👤 Unassigned</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: unassigned.length > 0 ? '#b04a4a' : '#4a7c59', background: unassigned.length > 0 ? '#fde8e8' : '#e8f5e8', padding: '2px 8px', borderRadius: '10px' }}>
                  {unassigned.length}
                </span>
              </div>
              <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '8px' }}>
                {unassigned.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: '#4a7c59', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>✓ All guests assigned!</p>
                ) : (
                  unassigned.map(g => (
                    <div key={g.id} onClick={() => selectedTable && assignGuest(g.id, selectedTable.id)}
                      style={{ padding: '7px 10px', borderRadius: '8px', background: selectedTable ? '#faf4eb' : '#f8f6f4', border: '1px solid #e5d9ce', marginBottom: '5px', cursor: selectedTable ? 'pointer' : 'default', fontSize: '0.78rem', color: '#4a3f35', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.15s' }}>
                      <span>{g.name}</span>
                      {selectedTable ? <span style={{ fontSize: '0.65rem', color: '#b07f56', fontWeight: 600 }}>→ seat</span> : <span style={{ fontSize: '0.6rem', color: '#b0a090' }}>select table first</span>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected table inspector */}
            <AnimatePresence>
              {selectedTable && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  style={{ background: '#fffdf9', borderRadius: '14px', border: `2px solid ${selectedTable.color}`, overflow: 'hidden' }}
                >
                  <div style={{ padding: '12px 16px', background: `${selectedTable.color}18`, borderBottom: `1px solid ${selectedTable.color}44`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4a3f35' }}>✏️ {selectedTable.table_name}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => deleteTable(selectedTable.id)} style={{ background: 'none', border: 'none', color: '#b04a4a', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Delete</button>
                      <button onClick={() => setSelectedTable(null)} style={{ background: 'none', border: 'none', color: '#7b6a5d', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input value={selectedTable.table_name || ''} placeholder="Table name" onChange={e => updateTable(selectedTable.id, { table_name: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #e5d9ce', background: '#faf4eb', fontSize: '0.82rem', fontFamily: 'inherit', boxSizing: 'border-box' }} />

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <select value={selectedTable.capacity} onChange={e => updateTable(selectedTable.id, { capacity: parseInt(e.target.value) })}
                        style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1.5px solid #e5d9ce', background: '#faf4eb', fontSize: '0.8rem', fontFamily: 'inherit' }}>
                        {[4,6,8,10,12,16].map(c => <option key={c} value={c}>{c} seats</option>)}
                      </select>
                      <input type="color" value={selectedTable.color} onChange={e => updateTable(selectedTable.id, { color: e.target.value })}
                        style={{ width: '36px', height: '36px', border: '1.5px solid #e5d9ce', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(['round','rectangle','oval'] as const).map(s => (
                        <button key={s} onClick={() => updateTable(selectedTable.id, { shape: s })}
                          style={{ flex: 1, padding: '6px 4px', borderRadius: '7px', border: `1.5px solid ${selectedTable.shape === s ? selectedTable.color : '#e5d9ce'}`, background: selectedTable.shape === s ? `${selectedTable.color}18` : '#faf4eb', cursor: 'pointer', fontSize: '0.68rem', fontWeight: selectedTable.shape === s ? 700 : 400, color: selectedTable.shape === s ? '#4a3f35' : '#7b6a5d', fontFamily: 'inherit' }}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Seated guests */}
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#b0a090', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontWeight: 600 }}>
                        Seated ({selectedTable.guests.length}/{selectedTable.capacity})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                        {selectedTable.guests.length === 0 ? (
                          <p style={{ fontSize: '0.72rem', color: '#b0a090', fontStyle: 'italic', margin: '4px 0 0' }}>
                            Click an unassigned guest above to seat them here.
                          </p>
                        ) : (
                          selectedTable.guests.map(g => (
                            <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 9px', borderRadius: '7px', background: '#faf4eb', fontSize: '0.78rem', color: '#4a3f35' }}>
                              <span>{g.name}</span>
                              <button onClick={() => unassignGuest(selectedTable.id, g.id)} style={{ background: 'none', border: 'none', color: '#b07f56', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1 }}>✕</button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Legend */}
            <div style={{ background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce', padding: '14px 16px' }}>
              <p style={{ fontSize: '0.68rem', color: '#b0a090', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, margin: '0 0 10px' }}>Legend</p>
              {[
                { color: '#4c7a52', label: 'Available seats' },
                { color: '#e8c8c8', label: 'Table full' },
                { color: '#b07f56', label: 'Selected table' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: l.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: '#7b6a5d' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Table Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fffdf9', borderRadius: '20px', padding: '28px', maxWidth: '440px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', fontFamily: '"Playfair Display", Georgia, serif' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#4a3f35', margin: '0 0 20px', fontStyle: 'italic' }}>Add New Table</h2>

              <label style={lbl}>Table Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Family Table, Bridal Party…"
                style={inp} />

              <label style={lbl}>Capacity</label>
              <select value={newCapacity} onChange={e => setNewCapacity(Number(e.target.value))} style={{ ...inp, marginBottom: '14px' }}>
                {[4,6,8,10,12,16,20].map(c => <option key={c} value={c}>{c} seats</option>)}
              </select>

              <label style={lbl}>Shape</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {(['round','rectangle','oval'] as const).map(s => (
                  <button key={s} onClick={() => setNewShape(s)} style={{ flex: 1, padding: '8px', borderRadius: '9px', border: `1.5px solid ${newShape === s ? '#b07f56' : '#e5d9ce'}`, background: newShape === s ? '#faf0e8' : '#faf4eb', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit', fontWeight: newShape === s ? 700 : 400, color: newShape === s ? '#4a3f35' : '#7b6a5d' }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <label style={lbl}>Colour</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {TABLE_COLORS.map(c => (
                  <button key={c} onClick={() => setNewColor(c)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, border: `3px solid ${newColor === c ? '#4a3f35' : 'transparent'}`, cursor: 'pointer', transition: 'border 0.15s' }} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: '1.5px solid #e5d9ce', background: 'transparent', color: '#7b6a5d', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={addTable} style={{ flex: 1, padding: '11px', borderRadius: '11px', border: 'none', background: '#b07f56', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Create Table</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.7rem', color: '#7b6a5d', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' };
const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5d9ce', background: '#faf4eb', color: '#4a3f35', fontSize: '0.88rem', fontFamily: '"Playfair Display", Georgia, serif', boxSizing: 'border-box', marginBottom: '14px', outline: 'none' };

export default SeatingChartBuilder;

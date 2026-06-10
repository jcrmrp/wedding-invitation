import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Default roles ─────────────────────────────────────────────────────────────
const DEFAULT_ROLES = [
  'Best Man',
  'Maid of Honor',
  'Bridesmaids',
  'Groomsmen',
  'Flower Girl',
  'Ring Bearer',
  'Bible Bearer',
  'Coin Bearer',
  'Veil Sponsors',
  'Cord Sponsors',
  'Principal Sponsors',
  'Secondary Sponsors',
];

interface EntourageDashboardEditorProps {
  entourage: Record<string, string[]>;
  onChange: (entourage: Record<string, string[]>) => void;
}

export default function EntourageDashboardEditor({
  entourage,
  onChange,
}: EntourageDashboardEditorProps) {
  // Collect all roles: default list + any custom roles already in entourage data
  const customRoles = Object.keys(entourage).filter(r => !DEFAULT_ROLES.includes(r));
  const allRoles = [...DEFAULT_ROLES, ...customRoles];

  const [newRoleName, setNewRoleName] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const updateRole = (role: string, members: string[]) => {
    onChange({ ...entourage, [role]: members });
  };

  const addMember = (role: string) => {
    const current = entourage[role] || [];
    updateRole(role, [...current, '']);
  };

  const removeMember = (role: string, index: number) => {
    const current = entourage[role] || [];
    updateRole(role, current.filter((_, i) => i !== index));
  };

  const updateMember = (role: string, index: number, value: string) => {
    const current = [...(entourage[role] || [])];
    current[index] = value;
    updateRole(role, current);
  };

  const addCustomRole = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed || allRoles.includes(trimmed)) return;
    updateRole(trimmed, ['']);
    setNewRoleName('');
    setShowAddRole(false);
  };

  const removeRole = (role: string) => {
    const next = { ...entourage };
    delete next[role];
    onChange(next);
  };

  const toggleCollapse = (role: string) => {
    setCollapsed(prev => ({ ...prev, [role]: !prev[role] }));
  };

  const memberCount = (role: string) =>
    (entourage[role] || []).filter(m => m.trim() !== '').length;

  const isCustomRole = (role: string) => !DEFAULT_ROLES.includes(role);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        maxWidth: '1400px',
        margin: '32px auto 0',
        fontFamily: '"Playfair Display", Georgia, serif',
      }}
    >
      {/* ── Section header ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>💍</span>
            <h2
              style={{
                fontSize: '1.4rem',
                fontStyle: 'italic',
                color: '#4a3f35',
                margin: 0,
                fontWeight: 700,
              }}
            >
              Wedding Entourage
            </h2>
          </div>
          <p
            style={{
              color: '#7b6a5d',
              fontSize: '0.82rem',
              margin: '4px 0 0 34px',
              letterSpacing: '0.02em',
            }}
          >
            Add members to each role — empty roles won't appear on the invitation.
          </p>
        </div>

        {/* Add custom role button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddRole(v => !v)}
          style={{
            padding: '9px 20px',
            borderRadius: '12px',
            border: '1.5px solid #e5d9ce',
            background: showAddRole ? '#b07f56' : 'transparent',
            color: showAddRole ? '#fff' : '#b07f56',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            letterSpacing: '0.04em',
            transition: 'all 0.2s',
          }}
        >
          {showAddRole ? '✕ Cancel' : '+ Add Custom Role'}
        </motion.button>
      </div>

      {/* ── Add custom role input ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddRole && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', marginBottom: '20px' }}
          >
            <div
              style={{
                background: '#fffdf9',
                border: '1.5px solid #e5d9ce',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                autoFocus
                placeholder="e.g. Candle Bearers, Ushers, Readers…"
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomRole()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #e5d9ce',
                  background: '#faf4eb',
                  color: '#4a3f35',
                  fontSize: '0.92rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#b07f56')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5d9ce')}
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={addCustomRole}
                disabled={!newRoleName.trim()}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  background: newRoleName.trim() ? '#b07f56' : '#e5d9ce',
                  color: newRoleName.trim() ? '#fff' : '#b0a090',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: newRoleName.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                Add Role
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Role cards grid ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        {allRoles.map(role => {
          const members = entourage[role] || [];
          const count = memberCount(role);
          const isOpen = !collapsed[role];
          const custom = isCustomRole(role);

          return (
            <motion.div
              key={role}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                background: '#fffdf9',
                border: `1.5px solid ${count > 0 ? '#d4b896' : '#e5d9ce'}`,
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: count > 0
                  ? '0 4px 20px rgba(176,127,86,0.1)'
                  : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
            >
              {/* Card header */}
              <div
                onClick={() => toggleCollapse(role)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: count > 0 ? 'rgba(176,127,86,0.06)' : 'transparent',
                  borderBottom: isOpen ? '1px solid #f0e8df' : 'none',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  {/* Accent dot */}
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: count > 0 ? '#b07f56' : '#d5c8be',
                      flexShrink: 0,
                      transition: 'background 0.2s',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: count > 0 ? '#4a3f35' : '#7b6a5d',
                      letterSpacing: '0.02em',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {role}
                  </span>
                  {count > 0 && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#b07f56',
                        background: 'rgba(176,127,86,0.12)',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                  {/* Remove custom role */}
                  {custom && (
                    <button
                      onClick={e => { e.stopPropagation(); removeRole(role); }}
                      title="Remove this role"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: '1px solid #f0d4c8',
                        background: 'transparent',
                        color: '#c0896a',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fdeee8')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      ✕
                    </button>
                  )}
                  {/* Collapse chevron */}
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: '#b0a090', fontSize: '0.7rem', lineHeight: 1 }}
                  >
                    ▼
                  </motion.span>
                </div>
              </div>

              {/* Card body */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ padding: '14px 18px 18px' }}>
                      {/* Member list */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                        {members.length === 0 && (
                          <p
                            style={{
                              fontSize: '0.78rem',
                              color: '#b0a090',
                              margin: '4px 0 8px',
                              fontStyle: 'italic',
                              textAlign: 'center',
                            }}
                          >
                            No members yet — click Add below.
                          </p>
                        )}
                        {members.map((member, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.18 }}
                            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                          >
                            {/* Rank badge */}
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: '#faf4eb',
                                border: '1.5px solid #e5d9ce',
                                color: '#b07f56',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={member}
                              onChange={e => updateMember(role, idx, e.target.value)}
                              placeholder={`${role} ${idx + 1}`}
                              style={{
                                flex: 1,
                                padding: '9px 12px',
                                borderRadius: '9px',
                                border: '1.5px solid #e5d9ce',
                                background: '#faf4eb',
                                color: '#4a3f35',
                                fontSize: '0.88rem',
                                outline: 'none',
                                fontFamily: 'inherit',
                                transition: 'border-color 0.2s',
                              }}
                              onFocus={e => (e.currentTarget.style.borderColor = '#b07f56')}
                              onBlur={e => (e.currentTarget.style.borderColor = '#e5d9ce')}
                            />
                            <button
                              onClick={() => removeMember(role, idx)}
                              title="Remove member"
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                border: '1px solid #f0d4c8',
                                background: 'transparent',
                                color: '#c0896a',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#fdeee8')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              ✕
                            </button>
                          </motion.div>
                        ))}
                      </div>

                      {/* Add member button */}
                      <button
                        onClick={() => addMember(role)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '9px',
                          border: '1.5px dashed #d4b896',
                          background: 'transparent',
                          color: '#b07f56',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          letterSpacing: '0.06em',
                          fontFamily: 'inherit',
                          transition: 'background 0.2s, border-color 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(176,127,86,0.06)';
                          e.currentTarget.style.borderColor = '#b07f56';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = '#d4b896';
                        }}
                      >
                        + Add Member
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ── Live preview summary ─────────────────────────────────────────────── */}
      {Object.values(entourage).some(m => m.some(n => n.trim() !== '')) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            marginTop: '28px',
            background: '#fffdf9',
            border: '1px solid #e5d9ce',
            borderRadius: '20px',
            padding: '28px 32px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '1rem', color: '#b07f56', marginBottom: '6px' }}>💍</div>
            <h3
              style={{
                fontSize: '1.15rem',
                fontStyle: 'italic',
                color: '#4a3f35',
                margin: '0 0 4px',
                fontWeight: 700,
              }}
            >
              Preview — Our Special People
            </h3>
            <p style={{ fontSize: '0.72rem', color: '#b0a090', margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              This is how it will look on your invitation
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '20px',
            }}
          >
            {allRoles.map(role => {
              const filled = (entourage[role] || []).filter(m => m.trim() !== '');
              if (filled.length === 0) return null;
              return (
                <div key={role}>
                  <h4
                    style={{
                      color: '#4a3f35',
                      fontSize: '0.88rem',
                      margin: '0 0 10px',
                      fontWeight: 700,
                      paddingBottom: '6px',
                      borderBottom: '2px solid #b07f56',
                      fontFamily: 'inherit',
                    }}
                  >
                    {role}
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {filled.map((name, i) => (
                      <li
                        key={i}
                        style={{
                          color: '#7b6a5d',
                          fontSize: '0.85rem',
                          padding: '4px 0',
                          borderBottom: i < filled.length - 1 ? '1px solid #f0e8df' : 'none',
                        }}
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

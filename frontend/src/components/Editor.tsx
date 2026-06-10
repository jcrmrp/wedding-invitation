import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface InvitationData {
  names: string;
  date: string;
  venue: string;
  state: string;
  message: string;
  dressCode: string;
  story: string;
  musicUrl: string;
  liveStreamUrl: string;
  custom_url?: string;
  isGuestPhotoWallEnabled: boolean;
  isPhotoboothEnabled: boolean;
  entourage?: Record<string, string[]>;
  rsvpDeadline?: string;
}

interface EditorProps {
  invitationData: InvitationData;
  setInvitationData: React.Dispatch<React.SetStateAction<InvitationData>>;
  currentPlan?: string;
  onPlanChange?: (plan: string) => void;
  dressCodePrimaryColor?: string;
  dressCodeSecondaryColor?: string;
  dressCodeMessage?: string;
  onDressCodePrimaryColorChange?: (color: string) => void;
  onDressCodeSecondaryColorChange?: (color: string) => void;
  onDressCodeMessageChange?: (message: string) => void;
  onQrFileUpload?: (file: File) => void;
  gcashNumber?: string;
  customQrImage?: string;
  onGcashNumberChange?: (val: string) => void;
  onQrImageChange?: (val: string) => void;
  liveStreamUrl?: string;
  onLiveStreamUrlChange?: (val: string) => void;
  entourage?: Record<string, string[]>;
  onEntourageChange?: (entourage: Record<string, string[]>) => void;
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '6px', fontSize: '0.72rem',
  letterSpacing: '0.13em', textTransform: 'uppercase',
  color: '#7b6a5d', fontWeight: 600, fontFamily: 'inherit',
};

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', marginBottom: '20px',
  padding: '11px 14px', borderRadius: '10px',
  border: '1.5px solid #e5d9ce', background: '#fffdf9',
  color: '#4a3f35', fontSize: '0.92rem', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s',
};

const ENTOURAGE_ROLES = [
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

interface EntourageEditorProps {
  entourage: Record<string, string[]>;
  onEntourageChange: (entourage: Record<string, string[]>) => void;
  labelStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  focus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  blur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

function EntourageEditor({ entourage, onEntourageChange, labelStyle, inputStyle, focus, blur }: EntourageEditorProps) {
  const updateRole = (role: string, members: string[]) => {
    const updated = { ...entourage, [role]: members };
    onEntourageChange(updated);
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

  return (
    <div>
      {ENTOURAGE_ROLES.map((role) => (
        <div key={role} style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5d9ce' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={labelStyle}>{role}</label>
            <button
              onClick={() => addMember(role)}
              style={{
                padding: '4px 12px',
                fontSize: '0.7rem',
                background: '#b07f56',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              + Add
            </button>
          </div>

          {(entourage[role] || []).map((member, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={member}
                onChange={(e) => updateMember(role, index, e.target.value)}
                onFocus={focus}
                onBlur={blur}
                placeholder={`${role} name…`}
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
              />
              <button
                onClick={() => removeMember(role, index)}
                style={{
                  padding: '8px 12px',
                  background: '#f5d6c6',
                  color: '#b07f56',
                  border: '1px solid #e5d9ce',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const SECTIONS = [
  { label: 'Invitation', icon: '✦' },
  { label: 'Entourage', icon: '💍' },
  { label: 'Colors',    icon: '🎨' },
  { label: 'Journey',   icon: '❧' },
  { label: 'Music',     icon: '♪' },
  { label: 'Live',      icon: '📡' },
];

function Editor({ invitationData, setInvitationData, currentPlan, onPlanChange, dressCodePrimaryColor = '#b07f56', dressCodeSecondaryColor = '#e5d9ce', dressCodeMessage = "We'd love to see you in our wedding colors!", onDressCodePrimaryColorChange, onDressCodeSecondaryColorChange, onDressCodeMessageChange, onQrFileUpload, gcashNumber, customQrImage, onGcashNumberChange, onQrImageChange, entourage, onEntourageChange }: EditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvitationData(prev => ({ ...prev, [name]: value }));
  };

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = '#b07f56');
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    (e.currentTarget.style.borderColor = '#e5d9ce');

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        position: 'fixed', left: '20px', top: '80px',
        zIndex: 1100, width: collapsed ? 'auto' : '360px',
        fontFamily: '"Playfair Display", Georgia, serif',
      }}
    >
      {/* Header bar — always visible */}
      <div style={{
        background: '#4a3f35', borderRadius: collapsed ? '14px' : '14px 14px 0 0',
        padding: '12px 18px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
      }}
        onClick={() => setCollapsed(c => !c)}
      >
        <span style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
          ✦ Customize Invitation
        </span>
        <motion.span
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.25 }}
          style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginLeft: '10px' }}
        >
          ▼
        </motion.span>
      </div>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              background: '#fffdf9', border: '1px solid #e5d9ce',
              borderTop: 'none', borderRadius: '0 0 14px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
            }}>
              {/* Section tabs — icon + short label, no wrapping */}
              <div style={{
                display: 'flex',
                borderBottom: '1px solid #e5d9ce',
                background: '#faf8f5',
                padding: '0 4px',
                gap: '2px',
              }}>
                {SECTIONS.map((s, i) => {
                  const isActive = activeSection === i;
                  return (
                    <button
                      key={s.label}
                      onClick={() => setActiveSection(i)}
                      title={s.label}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '10px 6px 8px',
                        border: 'none',
                        borderBottom: isActive ? '2px solid #b07f56' : '2px solid transparent',
                        background: isActive ? '#fffdf9' : 'transparent',
                        color: isActive ? '#b07f56' : '#9e8e82',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.18s',
                        borderRadius: '8px 8px 0 0',
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontSize: '1rem', lineHeight: 1 }}>{s.icon}</span>
                      <span style={{
                        fontSize: '0.6rem',
                        fontWeight: isActive ? 700 : 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}>
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div style={{ padding: '22px 20px' }}>

                {/* ── Tab 0: Invitation details ── */}
                {activeSection === 0 && (
                  <>
                    <label style={labelStyle}>Couple's Names</label>
                    <input name="names" value={invitationData.names} onChange={handleChange}
                      onFocus={focus} onBlur={blur} placeholder="e.g. Alexandra & Jordan" style={inputStyle} />

                    <label style={labelStyle}>Wedding Date</label>
                    <input type="date" name="date" value={invitationData.date}
                      onChange={handleChange} onFocus={focus} onBlur={blur} style={inputStyle} />

                    <label style={labelStyle}>Venue</label>
                    <input name="venue" value={invitationData.venue} onChange={handleChange}
                      onFocus={focus} onBlur={blur} placeholder="e.g. The Grand Ballroom, Manila" style={inputStyle} />

                    <label style={labelStyle}>State/Province</label>
                    <input name="state" value={invitationData.state} onChange={handleChange}
                      onFocus={focus} onBlur={blur} placeholder="e.g. Metro Manila" style={inputStyle} />

                    <label style={labelStyle}>Dress Code</label>
                    <input name="dressCode" value={invitationData.dressCode} onChange={handleChange}
                      onFocus={focus} onBlur={blur} placeholder="e.g. Formal Attire" style={inputStyle} />

                    <label style={labelStyle}>Message to Guests</label>
                    <p style={{ fontSize: '0.7rem', color: '#b07f56', margin: '0 0 6px', lineHeight: 1.5, fontStyle: 'italic' }}>
                      This will appear first on the invitation envelope when guests tap the link.
                    </p>
                    <p style={{ fontSize: '0.68rem', color: '#9e8e82', margin: '0 0 6px', lineHeight: 1.5 }}>
                      Need inspiration? Try: "We can't wait to celebrate with you", "Please join us for a day of love and laughter", or "Your presence is the greatest gift".
                    </p>
                    <textarea name="message" value={invitationData.message} onChange={handleChange}
                      onFocus={focus} onBlur={blur} rows={3}
                      placeholder="A short note or quote for your guests…"
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: 0 }} />
                  </>
                )}

                {/* ── Tab 1: Entourage ── */}
                {activeSection === 1 && (
                  <>
                    <p style={{ fontSize: '0.75rem', color: '#7b6a5d', margin: '0 0 14px', lineHeight: 1.6 }}>
                      Add members to each entourage role. Leave empty to skip a role.
                    </p>
                    
                    <EntourageEditor 
                      entourage={invitationData.entourage || {}}
                      onEntourageChange={(entourage) => setInvitationData(prev => ({ ...prev, entourage }))}
                      labelStyle={labelStyle}
                      inputStyle={inputStyle}
                      focus={focus}
                      blur={blur}
                    />
                  </>
                )}

                {/* ── Tab 2: Colors & Dress Code ── */}
                {activeSection === 2 && (
                  <>
                    <label style={labelStyle}>Primary Color</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={dressCodePrimaryColor}
                        onChange={(e) => onDressCodePrimaryColorChange?.(e.target.value)}
                        style={{ width: '50px', height: '50px', border: '1.5px solid #e5d9ce', borderRadius: '10px', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        value={dressCodePrimaryColor}
                        onChange={(e) => onDressCodePrimaryColorChange?.(e.target.value)}
                        onFocus={focus} onBlur={blur}
                        placeholder="#b07f56"
                        style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                      />
                    </div>

                    <label style={labelStyle}>Secondary Color</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={dressCodeSecondaryColor}
                        onChange={(e) => onDressCodeSecondaryColorChange?.(e.target.value)}
                        style={{ width: '50px', height: '50px', border: '1.5px solid #e5d9ce', borderRadius: '10px', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        value={dressCodeSecondaryColor}
                        onChange={(e) => onDressCodeSecondaryColorChange?.(e.target.value)}
                        onFocus={focus} onBlur={blur}
                        placeholder="#e5d9ce"
                        style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                      />
                    </div>

                    <label style={labelStyle}>Dress Code Message</label>
                    <textarea 
                      value={dressCodeMessage}
                      onChange={(e) => onDressCodeMessageChange?.(e.target.value)}
                      onFocus={focus} onBlur={blur}
                      rows={3}
                      placeholder="We'd love to see you in our wedding colors!"
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: 0 }}
                    />
                  </>
                )}

                {/* ── Tab 3: Our Journey story ── */}
                {activeSection === 3 && (
                  <>
                    <p style={{ fontSize: '0.75rem', color: '#7b6a5d', margin: '0 0 14px', lineHeight: 1.6 }}>
                      Write your love story. Use blank lines to separate paragraphs — images will be woven in automatically.
                    </p>
                    <textarea
                      name="story"
                      value={invitationData.story}
                      onChange={handleChange}
                      onFocus={focus} onBlur={blur}
                      rows={18}
                      placeholder={`Tell your story here...\n\nHow did you meet?\n\nWhat made you fall in love?\n\nShare the moments that led to this day.`}
                      style={{ ...inputStyle, resize: 'vertical', marginBottom: 0, fontSize: '0.85rem', lineHeight: 1.7 }}
                    />
                  </>
                )}

                {/* ── Tab 4: Music ── */}
                {activeSection === 4 && (
                  <>
                    <p style={{ fontSize: '0.75rem', color: '#7b6a5d', margin: '0 0 14px', lineHeight: 1.6 }}>
                      Paste a YouTube link. This will play automatically when guests open your invitation.
                    </p>
                    <label style={labelStyle}>YouTube Music Link</label>
                    <input
                      name="musicUrl"
                      value={invitationData.musicUrl}
                      onChange={handleChange}
                      onFocus={focus} onBlur={blur}
                      placeholder="https://www.youtube.com/watch?v=..."
                      style={inputStyle}
                    />
                    {invitationData.musicUrl && (
                      <div style={{
                        padding: '10px 14px', borderRadius: '10px',
                        background: '#faf4eb', border: '1px solid #e5d9ce',
                        fontSize: '0.75rem', color: '#7b6a5d', wordBreak: 'break-all',
                      }}>
                        ♪ {invitationData.musicUrl}
                      </div>
                    )}
                  </>
                )}

                {/* ── Tab 5: Live Stream & Features ── */}
                {activeSection === 5 && (
                  <>
                    <p style={{ fontSize: '0.75rem', color: '#7b6a5d', margin: '0 0 14px', lineHeight: 1.6 }}>
                      Connect live streaming and guest features to enhance your wedding experience.
                    </p>

                    <label style={labelStyle}>Live Stream URL (YouTube, Zoom, etc.)</label>
                    <input
                      name="liveStreamUrl"
                      value={invitationData.liveStreamUrl || ''}
                      onChange={handleChange}
                      onFocus={focus} onBlur={blur}
                      placeholder="https://www.youtube.com/watch?v=..."
                      style={inputStyle}
                    />
                    {invitationData.liveStreamUrl && (
                      <div style={{
                        padding: '10px 14px', borderRadius: '10px',
                        background: '#faf4eb', border: '1px solid #e5d9ce',
                        fontSize: '0.75rem', color: '#7b6a5d', wordBreak: 'break-all',
                      }}>
                        📡 {invitationData.liveStreamUrl}
                      </div>
                    )}

                    <label style={{ ...labelStyle, marginTop: '12px' }}>Guest Photo Wall</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <input
                        type="checkbox"
                        checked={invitationData.isGuestPhotoWallEnabled}
                        onChange={(e) => setInvitationData(prev => ({ ...prev, isGuestPhotoWallEnabled: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: '#b07f56', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.82rem', color: '#4a3f35' }}>Enable guest photo upload wall</span>
                    </div>

                    <label style={{ ...labelStyle, marginTop: '0px' }}>Photobooth</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <input
                        type="checkbox"
                        checked={invitationData.isPhotoboothEnabled}
                        onChange={(e) => setInvitationData(prev => ({ ...prev, isPhotoboothEnabled: e.target.checked }))}
                        style={{ width: '18px', height: '18px', accentColor: '#b07f56', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.82rem', color: '#4a3f35' }}>Enable photobooth filter mode</span>
                    </div>

                    <label style={{ ...labelStyle, marginTop: '12px' }}>RSVP Deadline</label>
                    <input
                      name="rsvpDeadline"
                      value={invitationData.rsvpDeadline || ''}
                      onChange={handleChange}
                      onFocus={focus} onBlur={blur}
                      placeholder="2026-10-08"
                      type="date"
                      style={{ ...inputStyle, marginBottom: 0 }}
                    />
                    <p style={{ fontSize: '0.68rem', color: '#7b6a5d', margin: '6px 0 0', lineHeight: 1.5 }}>
                      Guests can RSVP until this date. Leave empty for auto-deadline (1 week before wedding).
                    </p>
                  </>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Editor;

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CSSProperties } from 'react';

interface Table {
  id: string;
  table_number: number;
  table_name: string | null;
  shape: string;
  capacity: number;
  position_x: number;
  position_y: number;
  color: string;
  guests: { id: string; name: string }[];
}

interface PrintExportToolProps {
  invitationData: {
    names: string;
    date: string;
    venue: string;
    state: string;
    message: string;
    dressCode: string;
    story: string;
    musicUrl: string;
    liveStreamUrl: string;
    isGuestPhotoWallEnabled: boolean;
    isPhotoboothEnabled: boolean;
    entourage?: Record<string, string[]>;
  };
  plan: string;
  theme: { background: string; surface: string; text: string; heading: string; accent: string; border: string; buttonBg: string; buttonText: string; muted: string };
  dressCodePrimaryColor: string;
  dressCodeSecondaryColor: string;
}

function PrintExportTool({ invitationData, plan, theme, dressCodePrimaryColor, dressCodeSecondaryColor }: PrintExportToolProps) {
  const [printBtnText, setPrintBtnText] = useState('🖨️ Print Invitation');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handlePrint = () => {
    setPrintBtnText('Preparing...');
    setTimeout(() => {
      window.print();
      setPrintBtnText('🖨️ Print Invitation');
    }, 300);
  };

  const handleExportJSON = () => {
    const data = { invitationData, plan, exportedAt: new Date().toISOString(), theme: { colors: { primary: dressCodePrimaryColor, secondary: dressCodeSecondaryColor } } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitation-${invitationData.names.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const handleExportText = () => {
    const lines = [
      `Wedding Invitation — ${invitationData.names}`,
      `═'.repeat(50)`,
      ``,
      `We request the pleasure of your company`,
      `as we celebrate our wedding.`,
      ``,
      `Couple: ${invitationData.names}`,
      `Date: ${invitationData.date}`,
      `Venue: ${invitationData.venue}`,
      `Location: ${invitationData.state}`,
      ``,
      `Dress Code: ${invitationData.dressCode}`,
      ``,
      `Message:`,
      invitationData.message,
      ``,
    ];
    if (invitationData.story) {
      lines.push('Our Story:', invitationData.story, '');
    }
    const ent = invitationData.entourage || {};
    const hasEntourage = Object.values(ent).some((v: any) => Array.isArray(v) && v.length > 0);
    if (hasEntourage) {
      lines.push('Entourage:');
      Object.entries(ent).forEach(([role, members]) => {
        if (Array.isArray(members) && members.length > 0) {
          lines.push(`  ${role}: ${members.join(', ')}`);
        }
      });
      lines.push('');
    }
    lines.push(`Plan: ${plan}`, `Exported: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, ``);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invitation-${invitationData.names.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMenuOpen(false);
  };

  const buttonStyle: CSSProperties = {
    padding: '10px 18px', borderRadius: '10px', border: 'none',
    background: '#4a3f35', color: '#fff', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.85rem', fontFamily: 'Georgia, serif',
    boxShadow: '0 4px 14px rgba(74,63,53,0.3)',
    transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: '8px',
  };

  const outlineButtonStyle: CSSProperties = {
    ...buttonStyle, background: 'transparent', color: '#4a3f35',
    border: '1.5px solid #e5d9ce', boxShadow: 'none',
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 400, color: '#4a3f35', margin: '0 0 20px', fontFamily: 'Georgia, serif' }}>🖨️ Print & Export</h1>

      <div style={{ display: 'grid', gap: '16px' }}>
        {/* Print Section */}
        <div style={{ padding: '24px', background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#4a3f35', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>Print Your Invitation</h2>
              <p style={{ fontSize: '0.82rem', color: '#7b6a5d', margin: 0, lineHeight: 1.6, maxWidth: '400px' }}>Print a beautiful hard copy using your browser's print dialog. Choose paper size and orientation.</p>
            </div>
            <button onClick={handlePrint} style={buttonStyle}>{printBtnText}</button>
          </div>
          <div style={{ marginTop: '14px', padding: '14px', background: '#faf4eb', borderRadius: '10px', border: '1px solid #e5d9ce', fontSize: '0.78rem', color: '#7b6a5d' }}>
            💡 <strong style={{ color: '#4a3f35' }}>Tips:</strong> Use A4 or Letter paper · Portrait for formal invitations · Landscape for RSVP cards
          </div>
        </div>

        {/* Export Section */}
        <div style={{ padding: '24px', background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#4a3f35', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>Export Data</h2>
              <p style={{ fontSize: '0.82rem', color: '#7b6a5d', margin: 0, lineHeight: 1.6 }}>Download your invitation data in JSON or plain text for backup or sharing.</p>
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setExportMenuOpen(!exportMenuOpen)} style={outlineButtonStyle}>📦 Export ▾</button>
              <AnimatePresence>
                {exportMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }} style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, minWidth: '180px', background: '#fffdf9', borderRadius: '10px', border: '1.5px solid #e5d9ce', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 50 }}>
                    <button onClick={handleExportJSON} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '0.82rem', color: '#4a3f35', fontFamily: 'Georgia, serif', borderBottom: '1px solid #f5f0eb' }}>📄 Export as JSON</button>
                    <button onClick={handleExportText} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '0.82rem', color: '#4a3f35', fontFamily: 'Georgia, serif' }}>📝 Export as Text</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Print Preview Card */}
        <div style={{ padding: '24px', background: '#fffdf9', borderRadius: '14px', border: '1.5px solid #e5d9ce' }}>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#4a3f35', margin: '0 0 16px', fontFamily: 'Georgia, serif' }}>Preview (Print Layout)</h2>
          <div style={{
            padding: '32px', background: theme.background, borderRadius: '8px',
            border: `1px solid ${theme.border}`, fontFamily: 'Georgia, serif',
            maxWidth: '500px', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: dressCodePrimaryColor, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>♡</div>
              <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: theme.heading, margin: '0 0 4px', fontWeight: 400, fontStyle: 'italic' }}>{invitationData.names}</h3>
              <p style={{ fontSize: '0.75rem', color: theme.muted, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Wedding Invitation</p>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', borderTop: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}` }}>
              <p style={{ fontSize: '0.82rem', color: theme.text, margin: '0 0 4px', lineHeight: 1.6 }}>We joyfully invite you to celebrate</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: theme.heading, margin: '4px 0' }}>{invitationData.date}</p>
              <p style={{ fontSize: '0.82rem', color: theme.text, margin: 0 }}>{invitationData.venue}, {invitationData.state}</p>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.72rem', color: theme.muted, margin: '0 0 4px' }}>Dress Code: {invitationData.dressCode || 'Formal Attire'}</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: dressCodePrimaryColor }} />
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: dressCodeSecondaryColor }} />
              </div>
            </div>
            {invitationData.liveStreamUrl && (
              <div style={{ marginTop: '16px', padding: '10px', background: theme.surface, borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: theme.muted, margin: 0 }}>📡 Live Stream Available</p>
                <p style={{ fontSize: '0.72rem', color: theme.accent, margin: '4px 0 0' }}>Scan QR or visit link to watch</p>
              </div>
            )}
          </div>
          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.72rem', color: '#7b6a5d' }}>This is how your invitation will look when printed</p>
        </div>

        {/* Registry Export */}
        <div style={{ padding: '20px', background: '#faf8f5', borderRadius: '12px', border: '1px solid #e5d9ce', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '2rem' }}>🎁</span>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#4a3f35', margin: '0 0 4px', fontFamily: 'Georgia, serif' }}>Registry & Guest List</h3>
            <p style={{ fontSize: '0.78rem', color: '#7b6a5d', margin: 0, lineHeight: 1.5 }}>Export guest RSVP responses as CSV (spreadsheet) for easy management.</p>
          </div>
          <button onClick={() => alert('CSV export for RSVP guest list will open here.')} style={outlineButtonStyle}>📊 Export RSVP (CSV)</button>
        </div>
      </div>
    </div>
  );
}

export default PrintExportTool;

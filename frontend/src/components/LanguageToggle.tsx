import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../components/Toast';
import { t, setLanguage, getLanguage } from '../i18n';

export default function LanguageToggle() {
  const [lang, setLang] = useState<'tl' | 'en'>(getLanguage());

  const handleChange = useCallback((l: 'tl' | 'en') => {
    setLang(l);
    setLanguage(l);
  }, []);

  return (
    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '3px', gap: '2px' }} role="radiogroup" aria-label="Language">
      <button role="radio" aria-checked={lang === 'en'} onClick={() => handleChange('en')}
        style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', background: lang === 'en' ? '#fff' : 'transparent', color: lang === 'en' ? '#4a3f35' : '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s' }}>EN</button>
      <button role="radio" aria-checked={lang === 'tl'} onClick={() => handleChange('tl')}
        style={{ padding: '6px 14px', borderRadius: '7px', border: 'none', background: lang === 'tl' ? '#fff' : 'transparent', color: lang === 'tl' ? '#4a3f35' : '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s' }}>TL</button>
    </div>
  );
}

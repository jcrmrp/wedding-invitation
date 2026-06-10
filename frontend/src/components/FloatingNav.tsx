import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, type CSSProperties } from 'react';

type FloatingNavProps = {
  buttonStyle?: CSSProperties;
  photowallId?: string;
  rsvpId?: string;
  isPhotoWallEnabled?: boolean;
};

const sections: { name: string; id: string; icon: string; showWhen?: (props: FloatingNavProps) => boolean }[] = [
  { name: "Couple", id: "top", icon: "♡" },
  { name: "Details", id: "celebration", icon: "✦" },
  { name: "Our Story", id: "journey", icon: "❧" },
  { name: "Gallery", id: "gallery", icon: "◈" },
  { name: "Registry", id: "gift", icon: "◇" },
  { name: "RSVP", id: "rsvp", icon: "💌" },
  { name: "Photo Wall", id: "photowall", icon: "📸", showWhen: (p) => p.isPhotoWallEnabled !== false },
];

export default function FloatingNav({ buttonStyle, photowallId, rsvpId, isPhotoWallEnabled }: FloatingNavProps) {
  const [activeId, setActiveId] = useState<string>('top');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const navBg = (buttonStyle?.background as string) ?? 'rgba(255,255,255,0.92)';
  const navText = (buttonStyle?.color as string) ?? '#4a3f35';
  const navBorder = (buttonStyle?.borderColor as string) ?? '#d7c8b9';

  const visibleSections = sections.filter(sec => sec.showWhen ? sec.showWhen({ isPhotoWallEnabled }) : true);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    visibleSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setActiveId(id);
      }, { threshold: 0.1, rootMargin: '-60px 0px -50% 0px' });
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [visibleSections]);

  const scrollTo = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      initial={{ x: -60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
      aria-label="Page navigation"
      style={{
        position: 'fixed',
        left: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '6px',
      }}
    >
      <div style={{
        position: 'absolute',
        left: '13px',
        top: '18px',
        bottom: '18px',
        width: '1px',
        background: `linear-gradient(to bottom, transparent, ${navBorder}, transparent)`,
        pointerEvents: 'none',
      }} />

      {visibleSections.map((sec) => {
        const isActive = activeId === sec.id;
        const isHovered = hoveredId === sec.id;

        return (
          <div
            key={sec.id}
            style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
            onMouseEnter={() => setHoveredId(sec.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <button
              onClick={() => scrollTo(sec.id)}
              aria-label={`Navigate to ${sec.name}`}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: `1.5px solid ${isActive ? navText : navBorder}`,
                background: isActive ? navText : navBg,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isActive ? '0.65rem' : '0.55rem',
                color: isActive ? navBg : navText,
                transition: 'all 0.25s ease',
                boxShadow: isActive
                  ? `0 0 0 3px ${navBorder}, 0 4px 12px rgba(0,0,0,0.12)`
                  : '0 2px 6px rgba(0,0,0,0.08)',
                transform: isActive || isHovered ? 'scale(1.15)' : 'scale(1)',
                flexShrink: 0,
                padding: 0,
                outline: 'none',
              }}
            >
              {sec.icon}
            </button>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -6, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: '36px',
                    whiteSpace: 'nowrap',
                    background: navBg,
                    color: navText,
                    border: `1px solid ${navBorder}`,
                    borderRadius: '20px',
                    padding: '5px 12px',
                    fontSize: '0.72rem',
                    fontWeight: isActive ? 600 : 400,
                    letterSpacing: '0.03em',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(8px)',
                    pointerEvents: 'none',
                  }}
                >
                  {sec.name}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.nav>
  );
}

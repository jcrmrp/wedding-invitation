import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastKind = 'success' | 'error' | 'info';
export type ToastMsg = { id: number; text: string; kind: ToastKind };

export function toastReducer(state: ToastMsg[], action: { type: 'add'; payload: ToastMsg } | { type: 'remove'; id: number }) {
  switch (action.type) {
    case 'add':
      return [...state, action.payload];
    case 'remove':
      return state.filter(t => t.id !== action.id);
    default:
      return state;
  }
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);

  const show = useCallback((text: string, kind: ToastKind = 'success') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, text, kind }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, [setToasts]);

  return { show };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts] = useState<ToastMsg[]>([]);
  return (
    <>
      {children}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none' }}>
        <AnimatePresence>
          {toasts.map(toast => {
            const bg = toast.kind === 'success' ? '#22c55e' : toast.kind === 'error' ? '#ef4444' : '#3b82f6';
            return (
              <motion.div key={toast.id} initial={{ opacity: 0, y: 12, x: -20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}
                style={{ pointerEvents: 'auto', background: bg, color: '#fff', padding: '12px 18px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', fontSize: '0.88rem', fontWeight: 600, maxWidth: '340px' }}>
                {toast.text}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}

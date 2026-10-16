import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const EASE = [0.76, 0, 0.24, 1];
const DURATION_MS = 1900;

// Opening title card: the monogram draws itself, a counter runs to 100,
// then the plate splits like theatre curtains.
export default function Preloader({ onReveal, onDone }) {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const doneRef = useRef(onDone);
  const revealRef = useRef(onReveal);
  doneRef.current = onDone;
  revealRef.current = onReveal;

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const u = Math.min((now - start) / DURATION_MS, 1);
      setCount(Math.round((1 - Math.pow(1 - u, 3)) * 100));
      if (u < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setLeaving(true), 180);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!leaving) return undefined;
    revealRef.current?.();
    const id = setTimeout(() => doneRef.current?.(), 1050);
    return () => clearTimeout(id);
  }, [leaving]);

  const half = (side) => ({
    position: 'absolute', left: 0, right: 0, height: '50.5%', background: '#050506',
    [side]: 0,
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9800, pointerEvents: leaving ? 'none' : 'auto' }} aria-hidden="true">
      <motion.div style={half('top')} animate={{ y: leaving ? '-100%' : '0%' }} transition={{ duration: 1, ease: EASE }} />
      <motion.div style={half('bottom')} animate={{ y: leaving ? '100%' : '0%' }} transition={{ duration: 1, ease: EASE }} />

      <motion.div
        animate={{ opacity: leaving ? 0 : 1, scale: leaving ? 1.06 : 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, color: '#f2ece1' }}
      >
        <svg width="74" height="74" viewBox="0 0 64 64" fill="none">
          <motion.circle
            cx="30" cy="30" r="17" stroke="#d6b67a" strokeWidth="1.2"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1] }}
          />
          <motion.path
            d="M40 40l11 11" stroke="#d6b67a" strokeWidth="1.4" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 1.2, ease: [0.65, 0, 0.35, 1] }}
          />
        </svg>
        <div style={{ overflow: 'hidden' }}>
          <motion.div
            initial={{ y: '105%' }} animate={{ y: '0%' }} transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 300, letterSpacing: '0.5em', paddingLeft: '0.5em' }}
          >
            QPG
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'absolute', left: 'clamp(16px, 4vw, 56px)', right: 'clamp(16px, 4vw, 56px)', bottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', color: '#f2ece1' }}
      >
        <span className="eyebrow-dim" style={{ color: 'rgba(242,236,225,0.4)' }}>The Question Paper Atelier</span>
        <span className="tabular" style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'clamp(40px, 6vw, 72px)', lineHeight: 0.8, color: '#d6b67a' }}>
          {String(count).padStart(3, '0')}
        </span>
      </motion.div>
      <motion.div
        animate={{ scaleX: count / 100, opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.1 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: '#d6b67a', transformOrigin: 'left' }}
      />
    </div>
  );
}

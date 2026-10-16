import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEngine, engineLabel } from '../hooks/useEngine.js';
import { lockScroll } from '../lib/smoothScroll.js';

const MESSAGES = [
  'Consulting the engine…',
  'Drafting the questions…',
  'Balancing every option…',
  'Calibrating the difficulty…',
  'Writing the explanations…',
  'Setting the final paper…',
];

const EASE = [0.16, 1, 0.3, 1];

export default function LoadingScreen({ topic, count, difficulty }) {
  const engine = useEngine();
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: EASE }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, padding: 24,
      }}
    >
      <div style={{ position: 'relative', width: 220, height: 220 }}>
        <svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="100" cy="100" r="92" fill="none" stroke="var(--line)" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="78" fill="none" stroke="var(--line)" strokeWidth="0.6" strokeDasharray="1 4" />
        </svg>
        <motion.svg
          viewBox="0 0 200 200"
          style={{ position: 'absolute', inset: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="100" cy="100" r="92" fill="none" stroke="var(--gold)" strokeWidth="1" strokeLinecap="round" strokeDasharray="90 488" />
        </motion.svg>
        <motion.svg
          viewBox="0 0 200 200"
          style={{ position: 'absolute', inset: 0 }}
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="100" cy="100" r="78" fill="none" stroke="var(--gold)" strokeOpacity="0.5" strokeWidth="0.8" strokeDasharray="30 460" />
        </motion.svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
          <span className="serif" style={{ fontSize: 26, fontStyle: 'italic', lineHeight: 1.1, color: 'var(--ink)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {topic}
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p className="eyebrow" style={{ margin: '0 0 18px' }}>Composing your paper</p>
        <div style={{ position: 'relative', height: 44, minWidth: 320 }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
              transition={{ duration: 0.7, ease: EASE }}
              className="serif"
              style={{ margin: 0, fontSize: 34, fontWeight: 300, color: 'var(--ink)' }}
            >
              {MESSAGES[i]}
            </motion.p>
          </AnimatePresence>
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 13, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
          {count} questions · {difficulty} calibre · this takes a few seconds
        </p>
      </div>

      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <span className="eyebrow-dim" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="dot-live" /> Engine · {engineLabel(engine)}
        </span>
      </div>
      <motion.div
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'var(--gold)', transformOrigin: 'left' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: [0, 0.7, 0.92] }}
        transition={{ duration: 14, times: [0, 0.4, 1], ease: 'easeOut' }}
      />
    </motion.div>
  );
}

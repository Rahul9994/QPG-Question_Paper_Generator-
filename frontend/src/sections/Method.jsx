import { useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

const STEPS = [
  {
    title: 'Compose',
    body: 'Name a subject and choose a calibre. The engine composes a complete paper — questions, four balanced options and an explanation for every answer — in seconds.',
  },
  {
    title: 'Attempt',
    body: 'Sit the paper in a quiet, distraction-free hall. A silent timer keeps time and every answer is tracked as you go.',
  },
  {
    title: 'Master',
    body: 'Receive a score, a grade and a line-by-line review. Retake until it is flawless — your best is always remembered.',
  },
];

// A pinned chapter: the section is 300vh tall and the panel stays put while
// scroll progress steps through the three movements.
export default function Method() {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActive(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length * 0.999)));
  });

  const arc = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const ringRotate = useTransform(scrollYProgress, [0, 1], [-90, 30]);
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section id="method" ref={ref} style={{ position: 'relative', height: `${STEPS.length * 100}vh` }}>
      <div style={{ position: 'sticky', top: 0, height: '100svh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 'clamp(30px, 6vw, 100px)', alignItems: 'center', paddingTop: 'var(--nav-h)' }}>
          {/* Ring + numeral */}
          <div style={{ position: 'relative', width: 'min(100%, 480px)', aspectRatio: '1', margin: '0 auto' }} className="hide-sm">
            <motion.svg viewBox="0 0 200 200" style={{ position: 'absolute', inset: 0, rotate: ringRotate }}>
              <circle cx="100" cy="100" r="92" fill="none" stroke="var(--line)" strokeWidth="0.5" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="1 3" />
              <motion.circle cx="100" cy="100" r="92" fill="none" stroke="var(--gold)" strokeWidth="0.8" strokeLinecap="round" style={{ pathLength: arc }} />
            </motion.svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={active}
                  initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -40, filter: 'blur(12px)' }}
                  transition={{ duration: 0.8, ease: EASE }}
                  className="serif tabular metal-text"
                  style={{ fontSize: 'clamp(120px, 14vw, 220px)', fontWeight: 300, lineHeight: 1 }}
                >
                  {String(active + 1).padStart(2, '0')}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="eyebrow" style={{ margin: '0 0 40px' }}>Nº 03 — The Method</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STEPS.map((s, i) => (
                <div key={s.title} style={{ borderTop: '1px solid var(--line)', padding: '22px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}>
                    <span className="serif tabular" style={{ fontSize: 16, fontStyle: 'italic', color: i === active ? 'var(--gold)' : 'var(--ink-3)', transition: 'color 0.6s' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3
                      className="serif"
                      style={{
                        fontSize: 'clamp(40px, 5vw, 76px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em',
                        color: i === active ? 'var(--ink)' : 'var(--ink-3)', opacity: i === active ? 1 : 0.45,
                        transition: 'color 0.8s var(--ease-lux), opacity 0.8s var(--ease-lux)',
                      }}
                    >
                      {s.title}
                    </h3>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ height: i === active ? 'auto' : 0, opacity: i === active ? 1 : 0 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ margin: '18px 0 0 40px', maxWidth: 460, color: 'var(--ink-2)', fontSize: 15.5, lineHeight: 1.8, fontWeight: 300 }}>{s.body}</p>
                  </motion.div>
                </div>
              ))}
            </div>
            <div style={{ position: 'relative', height: 1, background: 'var(--line)', marginTop: 10 }}>
              <motion.div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: bar, background: 'var(--gold)' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

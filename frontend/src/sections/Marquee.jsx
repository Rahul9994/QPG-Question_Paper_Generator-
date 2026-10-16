import { useRef } from 'react';
import { motion, useScroll, useVelocity, useSpring, useTransform, useMotionValue, useAnimationFrame } from 'framer-motion';

const wrap = (min, max, v) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

// One row of oversized italic words. Drifts on its own and speeds up with scroll velocity.
function Row({ words, baseVelocity, onPick }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(velocity, [-1500, 0, 1500], [-4, 0, 4], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    let move = dir.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += dir.current * baseVelocity * Math.abs(f) * (delta / 1000);
    baseX.set(baseX.get() + move);
  });

  const items = [...words, ...words];
  return (
    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'flex' }}>
      <motion.div style={{ x, display: 'flex', flexWrap: 'nowrap', gap: '0.5em', paddingRight: '0.5em' }}>
        {items.map((w, i) => (
          <button
            key={i}
            onClick={() => onPick(w)}
            className="outline-word"
            style={{ background: 'none', border: 0, padding: 0, fontSize: 'clamp(64px, 10vw, 170px)', lineHeight: 1.1, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.5em' }}
          >
            {w}
            <span aria-hidden="true" style={{ fontSize: '0.25em', WebkitTextStroke: 0, color: 'var(--gold)', fontStyle: 'normal' }}>✦</span>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

export default function Marquee({ topics, onPick }) {
  const half = Math.ceil(topics.length / 2);
  return (
    <section aria-label="Popular subjects" style={{ padding: 'clamp(60px, 9vw, 130px) 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', overflow: 'hidden' }}>
      <div className="wrap" style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', gap: 20 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Popular subjects</p>
        <p className="eyebrow-dim hide-sm" style={{ margin: 0 }}>Select one to begin</p>
      </div>
      <Row words={topics.slice(0, half)} baseVelocity={-2.2} onPick={onPick} />
      <Row words={topics.slice(half)} baseVelocity={2.2} onPick={onPick} />
    </section>
  );
}

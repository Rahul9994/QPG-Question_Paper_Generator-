import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion';

const EASE = [0.16, 1, 0.3, 1];

/** Fade, rise and un-blur once the element scrolls into view. */
export function Reveal({ children, delay = 0, y = 40, as = 'div', style, className, amount = 0.25 }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: 'blur(10px)' }}
      // Drop the filter afterwards: a lingering filter breaks fixed children and backdrop blur.
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      viewport={{ once: true, amount }}
      transition={{ duration: 1.3, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

/** Words rise out of masks, staggered, when the heading enters the viewport. */
export function LineReveal({ text, as = 'h2', style, className, delay = 0, stagger = 0.06, italic = [] }) {
  const Tag = motion[as];
  const words = text.split(' ');
  return (
    <Tag
      className={className}
      style={style}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginBottom: '-0.08em' }}>
          <motion.span
            style={{ display: 'inline-block', fontStyle: italic.includes(i) ? 'italic' : undefined }}
            className={italic.includes(i) ? 'metal-text' : undefined}
            variants={{ hidden: { y: '110%', rotate: 4 }, show: { y: '0%', rotate: 0, transition: { duration: 1.2, ease: EASE } } }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  );
}

function ScrubWord({ word, progress, range, accent }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const y = useTransform(progress, range, [10, 0]);
  return (
    <motion.span style={{ opacity, y, display: 'inline-block', color: accent ? 'var(--gold)' : undefined, fontStyle: accent ? 'italic' : undefined }}>
      {word}&nbsp;
    </motion.span>
  );
}

/** Each word lights up as the paragraph is scrolled through. */
export function ScrubWords({ text, accents = [], style, className }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
  const words = text.split(' ');
  return (
    <p ref={ref} className={className} style={style}>
      {words.map((w, i) => {
        const start = i / words.length;
        return (
          <ScrubWord
            key={i}
            word={w}
            progress={scrollYProgress}
            range={[start, start + 1 / words.length]}
            accent={accents.includes(i)}
          />
        );
      })}
    </p>
  );
}

/** Drifts children vertically relative to scroll for depth. */
export function Parallax({ children, speed = 0.2, style, className }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * 100}%`, `${-speed * 100}%`]);
  return (
    <div ref={ref} className={className} style={style}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/** Counts up to `value` the first time it becomes visible. */
export function Counter({ value, duration = 1.8, pad = 0, style, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView || typeof value !== 'number') return undefined;
    const controls = animate(0, value, { duration, ease: EASE, onUpdate: (v) => setShown(Math.round(v)) });
    return () => controls.stop();
  }, [inView, value, duration]);

  const text = typeof value === 'number' ? String(shown).padStart(pad, '0') : value;
  return <span ref={ref} className={className} style={style}>{text}</span>;
}

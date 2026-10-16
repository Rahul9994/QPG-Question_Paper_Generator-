import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { createFilm } from '../film/engine.js';
import { CHAPTERS, DURATION, chapterAt, timecode } from '../film/reel.js';
import Icon from './Icon.jsx';

const EASE = [0.16, 1, 0.3, 1];

const lineIn = (delay) => ({
  hidden: { y: '110%' },
  show: { y: '0%', transition: { duration: 1.4, ease: EASE, delay } },
});

const fadeIn = (delay) => ({
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: EASE, delay } },
});

export default function HeroFilm({ ready, onCompose, onArchive }) {
  const sectionRef = useRef(null);
  const hostRef = useRef(null);
  const tcRef = useRef(null);
  const barRef = useRef(null);
  const [chapter, setChapter] = useState(2);
  const [fallback, setFallback] = useState(false);

  // ── Mount the WebGL reel ──────────────────────────────────────
  useEffect(() => {
    // A fresh canvas per mount: StrictMode remounts, and a lost context can't be reused.
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
    hostRef.current.appendChild(canvas);

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lastChapter = -1;
    const film = createFilm(canvas, {
      still: reduce,
      onFrame: (t) => {
        if (tcRef.current) tcRef.current.textContent = timecode(t);
        if (barRef.current) barRef.current.style.transform = `scaleX(${t / DURATION})`;
        const c = chapterAt(t);
        if (c !== lastChapter) { lastChapter = c; setChapter(c); }
      },
    });

    if (!film) {
      canvas.remove();
      setFallback(true);
      return undefined;
    }

    let inView = true;
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !document.hidden) film.play(); else film.pause();
    }, { threshold: 0.01 });
    io.observe(sectionRef.current);

    const onVisibility = () => (document.hidden || !inView ? film.pause() : film.play());
    const onMove = (e) => film.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.__qpgFilm = film; // handy for frame-exact capture from devtools

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onMove);
      film.destroy();
      canvas.remove();
      if (window.__qpgFilm === film) delete window.__qpgFilm;
    };
  }, []);

  // ── Scroll: camera pushes in, letterbox closes, titles drift away ──
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const filmScale = useTransform(p, [0, 1], [1, 1.14]);
  const filmDim = useTransform(p, [0, 0.9], [0, 0.75]);
  const barH = useTransform(p, [0, 0.85], ['5.5vh', '22vh']);
  const copyY = useTransform(p, [0, 1], [0, -160]);
  const copyFade = useTransform(p, [0, 0.55], [1, 0]);
  const metaFade = useTransform(p, [0, 0.3], [1, 0]);

  const ch = CHAPTERS[chapter];

  return (
    <section
      ref={sectionRef}
      aria-label="QPG — the AI question paper atelier"
      style={{ position: 'relative', height: '100svh', minHeight: 640, overflow: 'hidden', background: '#050506', color: '#f2ece1' }}
    >
      {/* Film plate */}
      <motion.div style={{ position: 'absolute', inset: 0, scale: filmScale, transformOrigin: '62% 45%' }}>
        <div ref={hostRef} style={{ position: 'absolute', inset: 0 }} />
        {fallback && (
          <div
            style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(60% 55% at 66% 45%, rgba(214,182,122,0.22), transparent 70%), #050506',
            }}
          />
        )}
      </motion.div>
      <motion.div style={{ position: 'absolute', inset: 0, background: '#050506', opacity: filmDim, pointerEvents: 'none' }} />

      {/* Legibility wash behind the title block */}
      <div className="hero-wash" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Letterbox */}
      <motion.div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: barH, background: '#000', zIndex: 3 }} />
      <motion.div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: barH, background: '#000', zIndex: 3 }} />

      {/* Reel meta: top row */}
      <motion.div
        className="wrap hide-sm"
        initial="hidden"
        animate={ready ? 'show' : 'hidden'}
        variants={fadeIn(0.9)}
        style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(var(--nav-h) + 5.5vh + 10px)', zIndex: 4,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20,
        }}
      >
        <motion.div style={{ opacity: metaFade, display: 'flex', gap: 18, alignItems: 'baseline' }}>
          <span className="eyebrow-dim" style={{ color: 'rgba(242,236,225,0.5)' }}>Reel Nº 01</span>
          <span className="eyebrow-dim hide-sm" style={{ color: 'rgba(242,236,225,0.32)' }}>A film in five chapters</span>
        </motion.div>
        <motion.div style={{ opacity: metaFade, position: 'relative', height: 18, minWidth: 210, textAlign: 'right' }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={ch.n}
              initial={{ opacity: 0, y: 8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              transition={{ duration: 0.7, ease: EASE }}
              className="eyebrow"
              style={{ position: 'absolute', right: 0, whiteSpace: 'nowrap', color: '#d6b67a' }}
            >
              Ch. {ch.n} — {ch.title}
            </motion.span>
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Title block */}
      <motion.div
        className="wrap"
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 'calc(5.5vh + clamp(56px, 9vh, 96px))', zIndex: 4,
          y: copyY, opacity: copyFade,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40,
        }}
      >
        <motion.div initial="hidden" animate={ready ? 'show' : 'hidden'} style={{ maxWidth: 'min(1000px, 100%)' }}>
          <motion.p variants={fadeIn(0.2)} className="eyebrow" style={{ margin: '0 0 26px', color: '#d6b67a' }}>
            The AI Question Paper Atelier
          </motion.p>

          <h1
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 300,
              fontSize: 'clamp(46px, 7.2vw, 122px)', lineHeight: 0.92, letterSpacing: '-0.025em',
              margin: '0 0 30px', color: '#f2ece1',
            }}
          >
            <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>
              <motion.span variants={lineIn(0.3)} style={{ display: 'block' }}>The art of</motion.span>
            </span>
            <span style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.1em' }}>
              <motion.span variants={lineIn(0.45)} style={{ display: 'block' }}>
                the <em className="metal-text" style={{ fontWeight: 400, paddingRight: '0.06em' }}>perfect</em> question.
              </motion.span>
            </span>
          </h1>

          <motion.p
            variants={fadeIn(0.75)}
            style={{ maxWidth: 470, margin: '0 0 38px', fontSize: 'clamp(15px, 1.15vw, 17px)', lineHeight: 1.75, color: 'rgba(242,236,225,0.66)', fontWeight: 300 }}
          >
            Exam-grade multiple-choice papers on any subject, composed in seconds by the
            finest open models on Groq — then scored, explained and remembered.
          </motion.p>

          <motion.div variants={fadeIn(0.95)} style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn-gold" onClick={onCompose} data-cursor="hover">
              Compose a paper <Icon name="arrow" size={16} className="arrow" />
            </button>
            <button
              className="btn-line"
              onClick={onArchive}
              style={{ color: '#f2ece1', borderColor: 'rgba(236,222,196,0.22)' }}
            >
              The archive
            </button>
          </motion.div>
        </motion.div>

        {/* Subtitle for the current chapter */}
        <motion.div
          className="hide-sm"
          initial="hidden"
          animate={ready ? 'show' : 'hidden'}
          variants={fadeIn(1.2)}
          style={{ textAlign: 'right', minWidth: 260, paddingBottom: 8 }}
        >
          <div style={{ position: 'relative', height: 34 }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={ch.line}
                initial={{ opacity: 0, filter: 'blur(8px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, filter: 'blur(8px)' }}
                transition={{ duration: 0.9, ease: EASE }}
                style={{
                  position: 'absolute', right: 0, bottom: 0, margin: 0, whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 300, fontSize: 24,
                  color: 'rgba(242,236,225,0.78)',
                }}
              >
                {ch.line}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Scrubber in the lower letterbox */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 1.2, delay: 1.4 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '5.5vh', minHeight: 38, zIndex: 5, display: 'flex', alignItems: 'center' }}
      >
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <span className="eyebrow-dim tabular hide-sm" style={{ color: 'rgba(242,236,225,0.45)', letterSpacing: '0.2em' }}>
            15s · 60 fps
          </span>
          <div style={{ position: 'relative', flex: 1, height: 14, display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: 'rgba(236,222,196,0.14)' }} />
            <div
              ref={barRef}
              style={{ position: 'absolute', left: 0, right: 0, height: 1, background: '#d6b67a', transformOrigin: 'left', transform: 'scaleX(0)', boxShadow: '0 0 10px rgba(214,182,122,0.7)' }}
            />
            {CHAPTERS.map((c, i) => (
              <span
                key={c.n}
                title={c.title}
                style={{
                  position: 'absolute', left: `${(c.at / DURATION) * 100}%`, top: '50%',
                  width: 5, height: 5, marginTop: -2.5, marginLeft: i === 0 ? 0 : -2.5, borderRadius: '50%',
                  background: i <= chapter ? '#d6b67a' : 'rgba(236,222,196,0.25)',
                  transition: 'background 0.6s',
                }}
              />
            ))}
          </div>
          <span ref={tcRef} className="tabular" style={{ fontSize: 11, letterSpacing: '0.16em', color: 'rgba(242,236,225,0.6)', minWidth: 92, textAlign: 'right' }}>
            00:00:00:00
          </span>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div
        className="hide-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ delay: 1.8, duration: 1 }}
        style={{ position: 'absolute', left: '50%', bottom: 'calc(5.5vh + 18px)', zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transform: 'translateX(-50%)' }}
      >
        <motion.div style={{ opacity: metaFade, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <span className="eyebrow-dim" style={{ color: 'rgba(242,236,225,0.4)', fontSize: 9.5 }}>Scroll</span>
          <span style={{ width: 1, height: 42, background: 'rgba(214,182,122,0.8)', animation: 'scroll-cue 2.4s var(--ease-lux) infinite' }} />
        </motion.div>
      </motion.div>
    </section>
  );
}

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Icon from '../components/Icon.jsx';
import { LineReveal, Reveal } from '../components/Reveal.jsx';
import { useEngine, engineLabel } from '../hooks/useEngine.js';
import { scrollToTarget } from '../lib/smoothScroll.js';

export default function Footer({ onCompose }) {
  const ref = useRef(null);
  const engine = useEngine();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const wordY = useTransform(scrollYProgress, [0, 1], ['40%', '0%']);
  const wordOpacity = useTransform(scrollYProgress, [0.2, 1], [0, 1]);

  return (
    <footer ref={ref} style={{ position: 'relative', paddingTop: 'clamp(110px, 14vw, 200px)', overflow: 'hidden' }}>
      <div className="wrap" style={{ textAlign: 'center' }}>
        <Reveal><p className="eyebrow" style={{ margin: '0 0 30px' }}>Your next sitting</p></Reveal>
        <LineReveal
          text="Begin a new paper."
          italic={[2]}
          style={{ fontSize: 'clamp(50px, 7.5vw, 120px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.025em', margin: '0 auto 44px' }}
        />
        <Reveal delay={0.2}>
          <button className="btn-gold" onClick={onCompose}>
            Compose a paper <Icon name="arrow" size={16} className="arrow" />
          </button>
        </Reveal>
      </div>

      <motion.div
        aria-hidden="true"
        className="serif metal-text"
        style={{
          y: wordY, opacity: wordOpacity, textAlign: 'center', fontWeight: 300,
          fontSize: 'clamp(140px, 31vw, 520px)', lineHeight: 0.8, letterSpacing: '0.04em',
          marginTop: 'clamp(70px, 9vw, 130px)', userSelect: 'none', paddingLeft: '0.04em',
        }}
      >
        QPG
      </motion.div>

      <div style={{ borderTop: '1px solid var(--line)' }}>
        <div className="wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', padding: '26px clamp(16px, 4vw, 56px)' }}>
          <span className="eyebrow-dim">© {new Date().getFullYear()} QPG Atelier</span>
          <span className="eyebrow-dim" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`dot-live ${engine?.configured ? '' : 'off'}`} />
            Engine · {engineLabel(engine)} · auto-selected on Groq
          </span>
          <button className="link-u eyebrow-dim" onClick={() => scrollToTarget(0)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Back to top <Icon name="arrow-down" size={13} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      </div>
    </footer>
  );
}

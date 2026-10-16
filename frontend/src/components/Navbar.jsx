import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useEngine, engineLabel } from '../hooks/useEngine.js';
import { scrollToTarget } from '../lib/smoothScroll.js';

const LINKS = [
  { id: 'atelier', label: 'Atelier' },
  { id: 'archive', label: 'Archive' },
  { id: 'method', label: 'Method' },
];

export function Monogram({ size = 30, color = 'var(--gold)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="30" cy="30" r="17" stroke={color} strokeWidth="1.6" />
      <path d="M40 40l11 11" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar({ darkMode, onToggleDark }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const engine = useEngine();
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [overHero, setOverHero] = useState(isHome);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      setOverHero(isHome && y < window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  function go(id) {
    if (isHome) scrollToTarget(`#${id}`, { offset: -40 });
    else navigate(`/#${id}`);
  }

  // Over the (always dark) film the bar uses film colours, elsewhere the theme's.
  const ink = overHero ? '#f2ece1' : 'var(--ink)';
  const ink2 = overHero ? 'rgba(242,236,225,0.62)' : 'var(--ink-2)';
  const line = overHero ? 'rgba(236,222,196,0.18)' : 'var(--line-2)';
  const glass = scrolled && !overHero;

  const live = engine?.configured && engine?.model;

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: 'var(--nav-h)',
        background: glass ? 'color-mix(in srgb, var(--bg) 72%, transparent)' : 'transparent',
        backdropFilter: glass ? 'blur(20px) saturate(1.2)' : 'none',
        WebkitBackdropFilter: glass ? 'blur(20px) saturate(1.2)' : 'none',
        borderBottom: `1px solid ${glass ? 'var(--line)' : 'transparent'}`,
        transition: 'background 0.6s var(--ease-lux), border-color 0.6s',
      }}
    >
      <div className="wrap" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
        <Link to="/" onClick={() => isHome && scrollToTarget(0)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Monogram size={30} color={overHero ? '#d6b67a' : 'var(--gold)'} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 23, fontWeight: 400, letterSpacing: '0.24em', color: ink }}>
            QPG
          </span>
        </Link>

        <div className="hide-sm" style={{ display: 'flex', gap: 40 }}>
          {LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              className="link-u"
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.26em', textTransform: 'uppercase', color: ink2 }}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            title={live ? `Auto-selected on Groq: ${engine.model}` : 'Add GROQ_API_KEY to backend/.env'}
            className="hide-sm"
            style={{
              display: 'flex', alignItems: 'center', gap: 9, padding: '9px 15px', borderRadius: 999,
              border: `1px solid ${line}`, color: ink2, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
            }}
          >
            <span className={`dot-live ${live ? '' : 'off'}`} />
            <span style={{ color: overHero ? 'rgba(242,236,225,0.45)' : 'var(--ink-3)' }}>Engine</span>
            <span style={{ color: ink }}>{engineLabel(engine)}</span>
          </div>

          {!isHome && (
            <Link to="/" className="btn-line" style={{ padding: '11px 18px', fontSize: 10.5, textDecoration: 'none' }}>
              Home
            </Link>
          )}

          <button
            onClick={onToggleDark}
            aria-label={darkMode ? 'Switch to ivory theme' : 'Switch to noir theme'}
            className="btn-icon"
            style={{ color: ink2, borderColor: line, width: 40, height: 40 }}
          >
            <Icon name={darkMode ? 'sun' : 'moon'} size={16} />
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

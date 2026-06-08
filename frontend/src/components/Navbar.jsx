import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ darkMode, onToggleDark }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(var(--bg-nav, 8,8,22), 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-muted)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 20px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'linear-gradient(135deg, var(--primary), #a78bfa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                boxShadow: '0 4px 14px var(--primary-glow)',
                flexShrink: 0,
              }}
            >
              🧠
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 17,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              QPG
              <span style={{ color: 'var(--primary)', marginLeft: 2 }}>.</span>
            </span>
          </motion.div>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!isHome && (
            <Link to="/" style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="btn-ghost"
                style={{ fontSize: 13, padding: '7px 14px' }}
              >
                ← Home
              </motion.button>
            </Link>
          )}

          {/* Dark mode toggle */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleDark}
            aria-label="Toggle dark mode"
            style={{
              width: 38,
              height: 38,
              borderRadius: 9,
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 17,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            {darkMode ? '☀️' : '🌙'}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

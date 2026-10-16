import { useState, useEffect, useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import Preloader from './components/Preloader.jsx';
import Cursor from './components/Cursor.jsx';
import Home from './pages/Home.jsx';
import Quiz from './pages/Quiz.jsx';
import Score from './pages/Score.jsx';
import { getDarkMode, setDarkMode } from './utils/storage.js';
import { initSmoothScroll, destroySmoothScroll, scrollToTarget, lockScroll } from './lib/smoothScroll.js';

const INTRO_KEY = 'qpg_intro_seen';

function introSeen() {
  try { return sessionStorage.getItem(INTRO_KEY) === '1'; } catch { return true; }
}

// Opacity only: a transform or filter here would re-parent the pages' fixed elements.
// Pages fade in on mount rather than animating out: an exit-gated AnimatePresence
// can stall under React 19 and leave the old page mounted at opacity 0.
function Page({ children }) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.main>
  );
}

function AnimatedRoutes({ ready }) {
  const location = useLocation();

  useLayoutEffect(() => {
    if (!location.hash) scrollToTarget(0, { immediate: true });
  }, [location.pathname]); // eslint-disable-line

  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<Page><Home ready={ready} /></Page>} />
      <Route path="/quiz/:id" element={<Page><Quiz /></Page>} />
      <Route path="/score" element={<Page><Score /></Page>} />
      <Route path="*" element={<Page><NotFound /></Page>} />
    </Routes>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => getDarkMode());
  const [intro, setIntro] = useState(() => !introSeen());
  const [ready, setReady] = useState(() => introSeen());

  // Apply dark/light class to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', dark);
    html.classList.toggle('light', !dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#050506' : '#f4efe6');
    setDarkMode(dark);
  }, [dark]);

  useEffect(() => {
    initSmoothScroll();
    return destroySmoothScroll;
  }, []);

  useEffect(() => {
    if (!intro) return undefined;
    lockScroll(true);
    return () => lockScroll(false);
  }, [intro]);

  function finishIntro() {
    try { sessionStorage.setItem(INTRO_KEY, '1'); } catch { /* ignore */ }
    setIntro(false);
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar darkMode={dark} onToggleDark={() => setDark((d) => !d)} />
        <AnimatedRoutes ready={ready} />
      </div>

      {intro && <Preloader onReveal={() => setReady(true)} onDone={finishIntro} />}
      <div className="grain" aria-hidden="true" />
      <Cursor />

      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-solid)',
            color: 'var(--ink)',
            border: '1px solid var(--line-2)',
            borderRadius: '999px',
            padding: '12px 20px',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            letterSpacing: '0.02em',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
            maxWidth: 560,
          },
          success: { iconTheme: { primary: '#d6b67a', secondary: '#140f08' } },
          error: { iconTheme: { primary: '#e8907f', secondary: '#140f08' } },
        }}
      />
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 20px 60px' }}>
      <p className="eyebrow" style={{ margin: '0 0 24px' }}>Error 404</p>
      <h1 className="serif metal-text" style={{ fontSize: 'clamp(110px, 20vw, 260px)', fontWeight: 300, lineHeight: 0.85, margin: '0 0 20px' }}>404</h1>
      <p className="serif" style={{ fontSize: 28, fontStyle: 'italic', color: 'var(--ink-2)', margin: '0 0 40px' }}>
        This page is not in the archive.
      </p>
      <Link to="/" className="btn-line" style={{ textDecoration: 'none' }}>Return home</Link>
    </div>
  );
}

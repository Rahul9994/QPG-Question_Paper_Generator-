import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Quiz from './pages/Quiz.jsx';
import Score from './pages/Score.jsx';
import { getDarkMode, setDarkMode } from './utils/storage.js';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/quiz/:id" element={<Quiz />} />
        <Route path="/score" element={<Score />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => getDarkMode());

  // Apply dark/light class to <html>
  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
      html.classList.remove('light');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
    }
    setDarkMode(dark);
  }, [dark]);

  function toggleDark() {
    setDark((prev) => !prev);
  }

  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: 'var(--bg)', transition: 'background 0.3s' }}>
        <Navbar darkMode={dark} onToggleDark={toggleDark} />
        <AnimatedRoutes />
      </div>

      {/* Global Toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: 'white' },
          },
        }}
      />
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: 20,
      }}
    >
      <div style={{ fontSize: 52, marginBottom: 16 }}>🤔</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text)', margin: '0 0 8px' }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--text-muted)', margin: '0 0 24px' }}>
        The page you're looking for doesn't exist.
      </p>
      <a
        href="/"
        style={{
          padding: '10px 24px',
          borderRadius: 9,
          background: 'var(--primary-soft)',
          border: '1px solid var(--primary)',
          color: 'var(--primary)',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: 14,
        }}
      >
        Go Home
      </a>
    </div>
  );
}

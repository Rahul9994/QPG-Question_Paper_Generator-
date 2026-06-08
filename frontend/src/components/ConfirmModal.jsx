import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ isOpen, onConfirm, onCancel, answered, total }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 500,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 501,
              width: '90%',
              maxWidth: 420,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: 32,
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                margin: '0 auto 20px',
              }}
            >
              📋
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text)',
                textAlign: 'center',
                margin: '0 0 10px',
              }}
            >
              Submit Test?
            </h3>

            <p style={{ color: 'var(--text-dim)', fontSize: 14, textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 }}>
              You've answered <strong style={{ color: 'var(--text)' }}>{answered}/{total}</strong> questions.
              {answered < total && (
                <> You have <strong style={{ color: 'var(--warning)' }}>{total - answered} unanswered</strong>.</>
              )}
              <br />This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onCancel}
                className="btn-ghost"
                style={{ flex: 1 }}
              >
                Review First
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Submit ✓
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

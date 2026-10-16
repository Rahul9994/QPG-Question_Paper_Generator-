import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { lockScroll } from '../lib/smoothScroll.js';

const EASE = [0.16, 1, 0.3, 1];

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
    if (!isOpen) return undefined;
    lockScroll(true);
    return () => lockScroll(false);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          onClick={onCancel}
          style={{
            position: 'fixed', inset: 0, zIndex: 500, padding: 20,
            background: 'rgba(3,3,4,0.72)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.7, ease: EASE }}
            style={{
              width: '100%', maxWidth: 480, background: 'var(--bg-solid)', border: '1px solid var(--line-2)',
              borderRadius: 'var(--radius-lg)', padding: 'clamp(28px, 5vw, 48px)', textAlign: 'center',
              boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
            }}
          >
            <p className="eyebrow" style={{ margin: '0 0 22px' }}>Final submission</p>
            <h3 id="confirm-title" className="serif" style={{ fontSize: 44, fontWeight: 300, color: 'var(--ink)', margin: '0 0 18px' }}>
              Submit your <em className="metal-text">paper?</em>
            </h3>
            <p style={{ color: 'var(--ink-2)', fontSize: 14.5, margin: '0 0 34px', lineHeight: 1.7 }}>
              You have answered <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{answered} of {total}</strong> questions.
              {answered < total && (
                <> <strong style={{ color: 'var(--amber)', fontWeight: 600 }}>{total - answered} remain unanswered.</strong></>
              )}
              <br />Once submitted, the paper is marked and cannot be changed.
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={onCancel} className="btn-line" style={{ flex: '1 1 160px' }}>
                Review first
              </button>
              <button onClick={onConfirm} className="btn-gold" style={{ flex: '1 1 160px' }}>
                Submit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

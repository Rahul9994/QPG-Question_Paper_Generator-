import { motion, AnimatePresence } from 'framer-motion';

export default function Timer({ formatted, label = 'Time' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 13px',
        borderRadius: 8,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: 14 }}>⏱</span>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text)',
          letterSpacing: '0.04em',
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={formatted}
            initial={{ opacity: 0.5, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {formatted}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

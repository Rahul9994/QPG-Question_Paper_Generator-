import { motion } from 'framer-motion';

export default function ProgressBar({ answered, total, label }) {
  const pct = total > 0 ? (answered / total) * 100 : 0;

  return (
    <div style={{ width: '100%' }}>
      {label !== false && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {label ?? 'Progress'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>
            {answered} / {total}
          </span>
        </div>
      )}
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: 'var(--border)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: '100%',
            borderRadius: 99,
            background: 'linear-gradient(90deg, var(--primary), #a78bfa)',
            boxShadow: '0 0 8px var(--primary-glow)',
          }}
        />
      </div>
    </div>
  );
}

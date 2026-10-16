import { motion } from 'framer-motion';

export default function ProgressBar({ answered, total, label }) {
  const pct = total > 0 ? (answered / total) * 100 : 0;

  return (
    <div style={{ width: '100%' }}>
      {label !== false && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="eyebrow-dim">{label ?? 'Progress'}</span>
          <span className="tabular" style={{ fontSize: 12, color: 'var(--ink-2)' }}>{answered} / {total}</span>
        </div>
      )}
      <div style={{ position: 'relative', height: 1, background: 'var(--line-2)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', left: 0, top: -0.5, height: 2, background: 'var(--gold)', boxShadow: '0 0 12px var(--gold-glow)' }}
        />
      </div>
    </div>
  );
}

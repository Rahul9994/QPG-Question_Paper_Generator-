import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const OPTIONS = ['A', 'B', 'C', 'D'];

const OPTION_COLORS = {
  A: { base: '#6366f1', soft: 'rgba(99,102,241,0.12)' },
  B: { base: '#a78bfa', soft: 'rgba(167,139,250,0.12)' },
  C: { base: '#22d3ee', soft: 'rgba(34,211,238,0.12)' },
  D: { base: '#f59e0b', soft: 'rgba(245,158,11,0.12)' },
};

export default function QuestionCard({
  question,
  index,
  selected,
  onSelect,
  showError = false,
  disabled = false,
}) {
  const cardRef = useRef(null);

  // Shake if unanswered when submit was attempted
  useEffect(() => {
    if (showError && !selected && cardRef.current) {
      cardRef.current.classList.remove('shake');
      void cardRef.current.offsetWidth; // reflow to restart animation
      cardRef.current.classList.add('shake');
    }
  }, [showError, selected]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="card"
      style={{
        padding: '22px 24px',
        marginBottom: 16,
        borderColor: showError && !selected ? 'var(--danger)' : undefined,
        boxShadow:
          showError && !selected
            ? '0 0 0 2px rgba(239,68,68,0.2)'
            : undefined,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
        <span
          style={{
            width: 30,
            height: 30,
            minWidth: 30,
            borderRadius: 8,
            background: selected ? 'var(--primary-soft)' : 'var(--bg-surface)',
            border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
            color: selected ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 13,
            transition: 'all 0.2s',
          }}
        >
          {index + 1}
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 15.5,
            fontWeight: 500,
            color: 'var(--text)',
            lineHeight: 1.55,
          }}
        >
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt;
          const color = OPTION_COLORS[opt];

          return (
            <motion.button
              key={opt}
              whileHover={!disabled ? { x: 3 } : {}}
              whileTap={!disabled ? { scale: 0.99 } : {}}
              onClick={() => !disabled && onSelect(question.id, opt)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 16px',
                borderRadius: 9,
                border: `1px solid ${isSelected ? color.base : 'var(--border-muted)'}`,
                background: isSelected ? color.soft : 'var(--bg-surface)',
                cursor: disabled ? 'default' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.17s ease',
                boxShadow: isSelected ? `0 0 0 1px ${color.base}` : 'none',
              }}
            >
              {/* Option badge */}
              <span
                style={{
                  width: 26,
                  height: 26,
                  minWidth: 26,
                  borderRadius: 6,
                  background: isSelected ? color.base : 'var(--bg-card-2)',
                  border: `1px solid ${isSelected ? color.base : 'var(--border)'}`,
                  color: isSelected ? '#fff' : 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 12,
                  transition: 'all 0.17s',
                  flexShrink: 0,
                }}
              >
                {opt}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: isSelected ? 'var(--text)' : 'var(--text-dim)',
                  fontWeight: isSelected ? 500 : 400,
                  transition: 'color 0.17s',
                  lineHeight: 1.45,
                }}
              >
                {question.options[opt]}
              </span>
              {isSelected && (
                <span style={{ marginLeft: 'auto', fontSize: 14, color: color.base }}>✓</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Unanswered warning */}
      {showError && !selected && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--danger)', fontWeight: 500 }}
        >
          ⚠ Please select an answer before submitting
        </motion.p>
      )}
    </motion.div>
  );
}

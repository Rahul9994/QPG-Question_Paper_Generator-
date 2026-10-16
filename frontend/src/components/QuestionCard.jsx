import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon.jsx';

const OPTIONS = ['A', 'B', 'C', 'D'];
const EASE = [0.16, 1, 0.3, 1];

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

  const flagged = showError && !selected;

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1.1, ease: EASE }}
      style={{
        display: 'grid', gridTemplateColumns: 'minmax(44px, 72px) 1fr', gap: 'clamp(14px, 3vw, 36px)',
        padding: 'clamp(30px, 5vw, 52px) 0', borderTop: `1px solid ${flagged ? 'var(--ruby)' : 'var(--line)'}`,
        transition: 'border-color 0.4s',
      }}
    >
      <div>
        <span className="serif tabular" style={{ fontSize: 'clamp(30px, 4vw, 46px)', fontStyle: 'italic', fontWeight: 300, lineHeight: 1, color: selected ? 'var(--gold)' : 'var(--ink-3)', transition: 'color 0.5s' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div style={{ minWidth: 0 }}>
        <p className="serif" style={{ margin: '0 0 26px', fontSize: 'clamp(22px, 2.3vw, 30px)', fontWeight: 400, lineHeight: 1.3, color: 'var(--ink)' }}>
          {question.question}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                onClick={() => !disabled && onSelect(question.id, opt)}
                aria-pressed={isSelected}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 18, padding: '15px 20px',
                  borderRadius: 'var(--radius)', textAlign: 'left',
                  border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--line)'}`,
                  background: isSelected ? 'linear-gradient(100deg, var(--gold-soft), transparent 80%)' : 'transparent',
                  boxShadow: isSelected ? '0 0 0 1px var(--gold-glow)' : 'none',
                  cursor: disabled ? 'default' : 'pointer',
                  transition: 'all 0.45s var(--ease-lux)',
                }}
                onMouseEnter={(e) => { if (!isSelected && !disabled) e.currentTarget.style.borderColor = 'var(--line-2)'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--line)'; }}
              >
                <span
                  className="serif"
                  style={{
                    width: 34, height: 34, minWidth: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 17, fontStyle: 'italic',
                    border: `1px solid ${isSelected ? 'transparent' : 'var(--line-2)'}`,
                    background: isSelected ? 'linear-gradient(135deg, #f6e6bd, #d6b67a 50%, #a8834b)' : 'transparent',
                    color: isSelected ? '#140f08' : 'var(--ink-2)',
                    transition: 'all 0.45s var(--ease-lux)',
                  }}
                >
                  {opt}
                </span>
                <span style={{ flex: 1, fontSize: 15, lineHeight: 1.55, color: isSelected ? 'var(--ink)' : 'var(--ink-2)', fontWeight: isSelected ? 500 : 400, transition: 'color 0.3s' }}>
                  {question.options[opt]}
                </span>
                <AnimatePresence>
                  {isSelected && (
                    <motion.span initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} style={{ color: 'var(--gold)', display: 'flex' }}>
                      <Icon name="check" size={18} stroke={1.5} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>

        {flagged && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--ruby)', letterSpacing: '0.04em' }}>
            Please choose an answer before submitting.
          </motion.p>
        )}
      </div>
    </motion.article>
  );
}

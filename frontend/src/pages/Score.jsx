import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getQuizResults, clearQuizResults, getActivePaper } from '../utils/storage.js';
import { formatSeconds } from '../hooks/useTimer.js';

const GRADES = [
  { min: 80, label: 'Excellent!',        color: '#10b981', bg: 'rgba(16,185,129,0.12)',  emoji: '🏆' },
  { min: 60, label: 'Good Job!',          color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   emoji: '🎯' },
  { min: 40, label: 'Average',            color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  emoji: '📈' },
  { min: 0,  label: 'Needs Improvement',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   emoji: '💪' },
];

function getGrade(score) {
  return GRADES.find((g) => score >= g.min) || GRADES[GRADES.length - 1];
}

export default function Score() {
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const animRef = useRef(null);

  useEffect(() => {
    const saved = getQuizResults();
    if (!saved) {
      navigate('/');
      return;
    }
    setResults(saved);
    animateScore(saved.score);
  }, []); // eslint-disable-line

  function animateScore(target) {
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setDisplayScore(Math.round(ease * target));
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  function handleRetake() {
    const paper = getActivePaper();
    if (!paper) { navigate('/'); return; }
    clearQuizResults();
    navigate(`/quiz/${paper.id}`);
  }

  function handleNewPaper() {
    clearQuizResults();
    navigate('/');
  }

  function handleCopyScore() {
    if (!results) return;
    const grade = getGrade(results.score);
    const text =
      `📊 QPG Quiz Results\n` +
      `Topic: ${results.title || results.topic}\n` +
      `Score: ${results.score}% — ${grade.label} ${grade.emoji}\n` +
      `✅ Correct: ${results.correct}/${results.total}\n` +
      `⏱ Time: ${formatSeconds(results.elapsedSeconds)}\n` +
      `Difficulty: ${results.difficulty}`;
    navigator.clipboard.writeText(text).then(() => toast.success('Score copied!')).catch(() => toast.error('Copy failed'));
  }

  if (!results) return null;

  const grade = getGrade(results.score);
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (results.score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ maxWidth: 780, margin: '0 auto', padding: '40px 20px 80px' }}
    >
      {/* ── Score hero ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        {/* Ring */}
        <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 20px' }}>
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx="70" cy="70" r="52" fill="none" stroke="var(--border)" strokeWidth="9" />
            {/* Progress */}
            <motion.circle
              cx="70" cy="70" r="52"
              fill="none"
              stroke={grade.color}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ filter: `drop-shadow(0 0 8px ${grade.color}66)` }}
            />
          </svg>
          {/* Center score */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30,
                fontWeight: 800,
                color: grade.color,
                lineHeight: 1,
              }}
            >
              {displayScore}%
            </span>
          </div>
        </div>

        {/* Grade badge */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 22px',
            borderRadius: 100,
            background: grade.bg,
            border: `1px solid ${grade.color}44`,
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 20 }}>{grade.emoji}</span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 17,
              color: grade.color,
            }}
          >
            {grade.label}
          </span>
        </motion.div>

        {results.title && (
          <p style={{ margin: '0 0 6px', fontSize: 15, color: 'var(--text-dim)', fontWeight: 500 }}>
            {results.title}
          </p>
        )}
      </motion.div>

      {/* ── Stats row ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 36,
        }}
      >
        {[
          { label: 'Correct', value: results.correct, icon: '✅', color: 'var(--success)' },
          { label: 'Wrong',   value: results.wrong,   icon: '❌', color: 'var(--danger)' },
          { label: 'Total',   value: results.total,   icon: '📋', color: 'var(--primary)' },
          { label: 'Time',    value: formatSeconds(results.elapsedSeconds), icon: '⏱', color: 'var(--cyan)' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{
              padding: '16px 18px',
              textAlign: 'center',
              borderColor: `${stat.color}30`,
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{stat.icon}</div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 800,
                color: stat.color,
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Action buttons ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 44 }}
      >
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleRetake} className="btn-primary" style={{ flex: '1 1 140px' }}>
          🔄 Retake Test
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleNewPaper} className="btn-ghost" style={{ flex: '1 1 140px' }}>
          ➕ New Paper
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCopyScore} className="btn-ghost" style={{ flex: '1 1 140px' }}>
          📋 Copy Score
        </motion.button>
      </motion.div>

      {/* ── Review accordion ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 16,
          }}
        >
          Question Review
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {results.review?.map((q, i) => (
            <ReviewItem
              key={q.id}
              q={q}
              index={i}
              isExpanded={expandedId === q.id}
              onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReviewItem({ q, index, isExpanded, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 + 0.4 }}
      className="card"
      style={{
        overflow: 'hidden',
        borderColor: q.isCorrect ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
      }}
    >
      {/* Header (always visible) */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          textAlign: 'left',
        }}
      >
        {/* Status icon */}
        <span
          style={{
            width: 28,
            height: 28,
            minWidth: 28,
            borderRadius: 7,
            background: q.isCorrect ? 'var(--success-bg)' : 'var(--danger-bg)',
            border: `1px solid ${q.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
          }}
        >
          {q.isCorrect ? '✓' : '✗'}
        </span>

        {/* Question # */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            minWidth: 28,
          }}
        >
          Q{index + 1}
        </span>

        {/* Question text (truncated) */}
        <span
          style={{
            flex: 1,
            fontSize: 14,
            color: 'var(--text)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {q.question}
        </span>

        {/* Expand icon */}
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}
        >
          ▼
        </motion.span>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              style={{
                padding: '0 18px 18px',
                borderTop: '1px solid var(--border-muted)',
                paddingTop: 14,
              }}
            >
              {/* Full question */}
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text)', lineHeight: 1.55 }}>
                {q.question}
              </p>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                {Object.entries(q.options).map(([opt, text]) => {
                  const isCorrect = opt === q.correct;
                  const isChosen  = opt === q.chosen;
                  const wrongChoice = isChosen && !isCorrect;

                  let bg = 'var(--bg-surface)';
                  let border = 'var(--border-muted)';
                  let textColor = 'var(--text-dim)';

                  if (isCorrect) {
                    bg = 'var(--success-bg)';
                    border = 'rgba(16,185,129,0.4)';
                    textColor = 'var(--text)';
                  } else if (wrongChoice) {
                    bg = 'var(--danger-bg)';
                    border = 'rgba(239,68,68,0.4)';
                    textColor = 'var(--text)';
                  }

                  return (
                    <div
                      key={opt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: bg,
                        border: `1px solid ${border}`,
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          minWidth: 22,
                          borderRadius: 5,
                          background: isCorrect ? 'var(--success)' : wrongChoice ? 'var(--danger)' : 'var(--bg-card)',
                          color: (isCorrect || wrongChoice) ? '#fff' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 11,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {opt}
                      </span>
                      <span style={{ color: textColor, flex: 1 }}>{text}</span>
                      {isCorrect && <span style={{ color: 'var(--success)', fontSize: 13 }}>✓ Correct</span>}
                      {wrongChoice && <span style={{ color: 'var(--danger)', fontSize: 13 }}>✗ Your answer</span>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: 8,
                    background: 'var(--primary-soft)',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--primary)' }}>💡 Explanation: </strong>
                    {q.explanation}
                  </p>
                </div>
              )}

              {/* Unanswered */}
              {!q.chosen && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  You did not answer this question.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { getQuizResults, clearQuizResults, getActivePaper } from '../utils/storage.js';
import { formatSeconds } from '../hooks/useTimer.js';
import Icon from '../components/Icon.jsx';
import { Reveal } from '../components/Reveal.jsx';

const EASE = [0.16, 1, 0.3, 1];

const GRADES = [
  { min: 80, label: 'Distinction',     color: 'var(--emerald)' },
  { min: 60, label: 'Merit',           color: 'var(--azure)' },
  { min: 40, label: 'Pass',            color: 'var(--amber)' },
  { min: 0,  label: 'Keep practising', color: 'var(--ruby)' },
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

  // Counts up in step with the ring (2s, after a 0.3s beat)
  function animateScore(target) {
    const duration = 2000;
    const start = Date.now() + 300;
    const tick = () => {
      const elapsed = Math.max(Date.now() - start, 0);
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setDisplayScore(Math.round(ease * target));
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
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
    navigate('/#atelier');
  }

  function handleCopyScore() {
    if (!results) return;
    const grade = getGrade(results.score);
    const text =
      `QPG — Results\n` +
      `Paper: ${results.title || results.topic}\n` +
      `Score: ${results.score}% — ${grade.label}\n` +
      `Correct: ${results.correct}/${results.total}\n` +
      `Time: ${formatSeconds(results.elapsedSeconds)}\n` +
      `Calibre: ${results.difficulty}`;
    navigator.clipboard.writeText(text).then(() => toast.success('Result copied')).catch(() => toast.error('Copy failed'));
  }

  if (!results) return null;

  const grade = getGrade(results.score);
  const R = 90;
  const circumference = 2 * Math.PI * R;
  const dashOffset = circumference - (results.score / 100) * circumference;

  const stats = [
    { label: 'Correct', value: results.correct, color: 'var(--emerald)' },
    { label: 'Incorrect', value: results.wrong, color: 'var(--ruby)' },
    { label: 'Questions', value: results.total, color: 'var(--ink)' },
    { label: 'Time', value: formatSeconds(results.elapsedSeconds), color: 'var(--gold)' },
  ];

  return (
    <div className="wrap-narrow" style={{ padding: 'calc(var(--nav-h) + clamp(50px, 8vw, 100px)) clamp(16px, 4vw, 40px) 120px' }}>
      {/* ── Result ─────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(60px, 8vw, 100px)' }}>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.1 }} className="eyebrow" style={{ margin: '0 0 36px' }}>
          The result
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE }}
          style={{ position: 'relative', width: 'min(280px, 72vw)', aspectRatio: '1', margin: '0 auto 34px' }}
        >
          <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f6e6bd" />
                <stop offset="50%" stopColor="#d6b67a" />
                <stop offset="100%" stopColor="#8f6d3d" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r={R} fill="none" stroke="var(--line)" strokeWidth="1" />
            <circle cx="100" cy="100" r={R - 10} fill="none" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="1 3" />
            <motion.circle
              cx="100" cy="100" r={R}
              fill="none"
              stroke="url(#ring-gold)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 2, ease: EASE, delay: 0.3 }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(214,182,122,0.5))' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="serif tabular" style={{ fontSize: 'clamp(64px, 16vw, 96px)', fontWeight: 300, lineHeight: 1, color: 'var(--ink)' }}>
              {displayScore}<span style={{ fontSize: '0.45em', color: 'var(--gold)' }}>%</span>
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: EASE, delay: 1 }}
          className="serif"
          style={{ fontSize: 'clamp(46px, 7vw, 84px)', fontWeight: 300, fontStyle: 'italic', color: grade.color, margin: '0 0 14px', lineHeight: 1 }}
        >
          {grade.label}
        </motion.h1>

        {results.title && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 1 }} style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)' }}>
            {results.title}
          </motion.p>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────── */}
      <div className="stats" style={{ marginBottom: 'clamp(40px, 6vw, 60px)' }}>
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={0.4 + i * 0.08} className="stat-cell">
            <div className="serif tabular" style={{ fontSize: 'clamp(44px, 5vw, 64px)', fontWeight: 300, lineHeight: 1, color: s.color }}>{s.value}</div>
            <p className="eyebrow-dim" style={{ margin: '14px 0 0' }}>{s.label}</p>
          </Reveal>
        ))}
      </div>

      {/* ── Actions ────────────────────────────────── */}
      <Reveal delay={0.5}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 'clamp(70px, 10vw, 120px)' }}>
          <button onClick={handleRetake} className="btn-gold" style={{ flex: '1 1 180px' }}>
            <Icon name="refresh" size={15} /> Retake paper
          </button>
          <button onClick={handleNewPaper} className="btn-line" style={{ flex: '1 1 180px' }}>
            <Icon name="plus" size={15} /> New paper
          </button>
          <button onClick={handleCopyScore} className="btn-line" style={{ flex: '1 1 180px' }}>
            <Icon name="copy" size={15} /> Copy result
          </button>
        </div>
      </Reveal>

      {/* ── Review ─────────────────────────────────── */}
      <Reveal>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, marginBottom: 26, flexWrap: 'wrap' }}>
          <h2 className="serif" style={{ fontSize: 'clamp(36px, 4.4vw, 56px)', fontWeight: 300, color: 'var(--ink)' }}>
            The <em className="metal-text">review</em>
          </h2>
          <span className="eyebrow-dim">Select a question to expand</span>
        </div>
      </Reveal>

      <div style={{ borderBottom: '1px solid var(--line)' }}>
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
    </div>
  );
}

function ReviewItem({ q, index, isExpanded, onToggle }) {
  const tone = q.isCorrect ? 'var(--emerald)' : 'var(--ruby)';
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.9, ease: EASE, delay: (index % 6) * 0.04 }}
      style={{ borderTop: '1px solid var(--line)' }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '22px 0', display: 'flex', alignItems: 'center', gap: 18, textAlign: 'left' }}
      >
        <span style={{ width: 30, height: 30, minWidth: 30, borderRadius: '50%', border: `1px solid ${tone}`, color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={q.isCorrect ? 'check' : 'x'} size={14} stroke={1.5} />
        </span>
        <span className="serif tabular" style={{ fontSize: 18, fontStyle: 'italic', color: 'var(--ink-3)', minWidth: 28 }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 15, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap' }}>
          {q.question}
        </span>
        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.5, ease: EASE }} style={{ color: 'var(--ink-3)', display: 'flex' }}>
          <Icon name="chevron" size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 0 28px clamp(0px, 6vw, 48px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {Object.entries(q.options).map(([opt, text]) => {
                  const isCorrect = opt === q.correct;
                  const wrongChoice = opt === q.chosen && !isCorrect;
                  const c = isCorrect ? 'var(--emerald)' : wrongChoice ? 'var(--ruby)' : null;
                  return (
                    <div
                      key={opt}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 'var(--radius)',
                        border: `1px solid ${c ? `color-mix(in srgb, ${c} 45%, transparent)` : 'var(--line)'}`,
                        background: isCorrect ? 'var(--emerald-bg)' : wrongChoice ? 'var(--ruby-bg)' : 'transparent',
                        fontSize: 14,
                      }}
                    >
                      <span className="serif" style={{ fontStyle: 'italic', fontSize: 17, minWidth: 16, color: c || 'var(--ink-3)' }}>{opt}</span>
                      <span style={{ flex: 1, color: c ? 'var(--ink)' : 'var(--ink-2)' }}>{text}</span>
                      {isCorrect && <span className="eyebrow-dim" style={{ color: 'var(--emerald)' }}>Correct</span>}
                      {wrongChoice && <span className="eyebrow-dim" style={{ color: 'var(--ruby)' }}>Your answer</span>}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div style={{ paddingLeft: 18, borderLeft: '1px solid var(--gold)' }}>
                  <p className="eyebrow" style={{ margin: '0 0 8px' }}>Explanation</p>
                  <p className="serif" style={{ margin: 0, fontSize: 19, lineHeight: 1.5, color: 'var(--ink-2)' }}>{q.explanation}</p>
                </div>
              )}

              {!q.chosen && (
                <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--ink-3)', fontStyle: 'italic' }}>You did not answer this question.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

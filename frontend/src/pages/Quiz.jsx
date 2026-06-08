import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import QuestionCard from '../components/QuestionCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Timer from '../components/Timer.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { useQuiz } from '../hooks/useQuiz.js';
import { useTimer } from '../hooks/useTimer.js';
import { getActivePaper, setActivePaper, setQuizResults } from '../utils/storage.js';

export default function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const topRef = useRef(null);

  // Load paper
  useEffect(() => {
    loadPaper();
  }, [id]); // eslint-disable-line

  async function loadPaper() {
    // Try localStorage first
    const cached = getActivePaper();
    if (cached && cached.id === id) {
      setPaper(cached);
      setLoading(false);
      return;
    }

    // Fallback: fetch from API
    try {
      const { data } = await api.get('/papers');
      const found = (data.data || []).find((p) => p.id === id);
      if (found) {
        setActivePaper(found);
        setPaper(found);
      } else {
        toast.error('Paper not found');
        navigate('/');
      }
    } catch {
      toast.error('Could not load paper');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }

  const quiz = useQuiz(paper);
  const timer = useTimer(!quiz.submitted);

  async function handleSubmitConfirm() {
    setShowModal(false);
    const results = quiz.confirmSubmit();
    if (!results) return;

    timer.pause();

    // Attach paper meta to results
    const enriched = {
      ...results,
      paperId: paper.id,
      topic: paper.topic,
      difficulty: paper.difficulty,
      title: paper.title,
    };

    // Save results + update best score
    setQuizResults(enriched);

    try {
      await api.patch(`/papers/${paper.id}`, { score: results.score });
    } catch {
      // non-fatal
    }

    navigate('/score');
  }

  function handleSubmitClick() {
    const canSubmit = quiz.trySubmit();
    if (!canSubmit) {
      toast.error(`Please answer all ${quiz.unansweredIds.length} remaining question(s)`);
      // Scroll to first unanswered
      const el = document.getElementById(`q-${quiz.unansweredIds[0]}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setShowModal(true);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <p style={{ margin: 0 }}>Loading quiz…</p>
        </div>
      </div>
    );
  }

  if (!paper) return null;

  const questions = paper.questions || [];

  return (
    <>
      {/* Sticky Header */}
      <div
        ref={topRef}
        style={{
          position: 'sticky',
          top: 60, // below navbar
          zIndex: 90,
          background: 'rgba(var(--bg-nav, 8,8,22), 0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-muted)',
          padding: '12px 20px',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {/* Top row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {paper.topic}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {quiz.answeredCount}/{questions.length} answered
              </span>
            </div>
            <Timer formatted={timer.formatted} />
          </div>

          <ProgressBar answered={quiz.answeredCount} total={questions.length} label={false} />
        </div>
      </div>

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px 140px' }}
      >
        {/* Paper title */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 6px',
            }}
          >
            {paper.title}
          </h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <DiffBadge diff={paper.difficulty} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {questions.length} questions
            </span>
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, i) => (
          <div key={q.id} id={`q-${q.id}`}>
            <QuestionCard
              question={q}
              index={i}
              selected={quiz.answers[q.id]}
              onSelect={quiz.selectAnswer}
              showError={quiz.submitAttempted && !quiz.answers[q.id]}
              disabled={quiz.submitted}
            />
          </div>
        ))}
      </motion.div>

      {/* Floating Submit Button */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 280, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <motion.button
            whileHover={quiz.allAnswered ? { scale: 1.03 } : {}}
            whileTap={quiz.allAnswered ? { scale: 0.97 } : {}}
            onClick={handleSubmitClick}
            style={{
              padding: '14px 36px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              background: quiz.allAnswered
                ? 'linear-gradient(135deg, #10b981, #34d399)'
                : 'var(--bg-card)',
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: quiz.allAnswered ? 'transparent' : 'var(--border)',
              color: quiz.allAnswered ? '#fff' : 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 15,
              cursor: quiz.allAnswered ? 'pointer' : 'not-allowed',
              boxShadow: quiz.allAnswered
                ? '0 8px 32px rgba(16,185,129,0.35)'
                : '0 4px 20px rgba(0,0,0,0.3)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.25s ease',
            }}
          >
            {quiz.allAnswered ? (
              <>✓ Submit Test</>
            ) : (
              <>{quiz.answeredCount}/{questions.length} — Keep Going</>
            )}
          </motion.button>
        </motion.div>
      </AnimatePresence>

      <ConfirmModal
        isOpen={showModal}
        answered={quiz.answeredCount}
        total={questions.length}
        onConfirm={handleSubmitConfirm}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}

function DiffBadge({ diff }) {
  const map = {
    easy:   { icon: '🟢', color: 'var(--success)', bg: 'var(--success-bg)' },
    medium: { icon: '🟡', color: 'var(--warning)', bg: 'var(--warning-bg)' },
    hard:   { icon: '🔴', color: 'var(--danger)',  bg: 'var(--danger-bg)' },
  };
  const s = map[diff] || map.medium;
  return (
    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: s.bg, color: s.color, fontWeight: 600, textTransform: 'capitalize' }}>
      {s.icon} {diff}
    </span>
  );
}

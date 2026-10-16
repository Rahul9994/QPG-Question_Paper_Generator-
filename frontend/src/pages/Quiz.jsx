import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import QuestionCard from '../components/QuestionCard.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import Timer from '../components/Timer.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { useQuiz } from '../hooks/useQuiz.js';
import { useTimer } from '../hooks/useTimer.js';
import { getActivePaper, setActivePaper, setQuizResults, getArchive, recordAttempt } from '../utils/storage.js';
import { scrollToTarget } from '../lib/smoothScroll.js';
import Icon from '../components/Icon.jsx';

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

  function loadPaper() {
    // Active paper first, then this browser's archive
    const cached = getActivePaper();
    const found = cached?.id === id ? cached : getArchive().find((p) => p.id === id);
    if (found) {
      setActivePaper(found);
      setPaper(found);
    } else {
      toast.error('Paper not found in this browser');
      navigate('/');
    }
    setLoading(false);
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
    recordAttempt(paper.id, results.score);

    navigate('/score');
  }

  function handleSubmitClick() {
    const canSubmit = quiz.trySubmit();
    if (!canSubmit) {
      toast.error(`Please answer all ${quiz.unansweredIds.length} remaining question(s)`);
      // Scroll to first unanswered
      const el = document.getElementById(`q-${quiz.unansweredIds[0]}`);
      if (el) scrollToTarget(el, { offset: -220 });
      return;
    }
    setShowModal(true);
  }


  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh' }}>
        <p className="serif" style={{ fontSize: 28, fontStyle: 'italic', color: 'var(--ink-3)' }}>Opening the paper…</p>
      </div>
    );
  }

  if (!paper) return null;

  const questions = paper.questions || [];

  return (
    <>
      {/* Sticky invigilator bar */}
      <div
        ref={topRef}
        style={{
          position: 'sticky', top: 'var(--nav-h)', zIndex: 90, marginTop: 'var(--nav-h)',
          background: 'color-mix(in srgb, var(--bg) 78%, transparent)',
          backdropFilter: 'blur(20px) saturate(1.2)', WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div className="wrap-narrow" style={{ padding: '16px clamp(16px, 4vw, 40px) 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <span className="tag" style={{ color: 'var(--gold)', borderColor: 'var(--gold-glow)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {paper.topic}
              </span>
              <span className="eyebrow-dim tabular" style={{ whiteSpace: 'nowrap' }}>
                {quiz.answeredCount} / {questions.length} answered
              </span>
            </div>
            <Timer formatted={timer.formatted} />
          </div>
        </div>
        <ProgressBar answered={quiz.answeredCount} total={questions.length} label={false} />
      </div>

      {/* Paper */}
      <div className="wrap-narrow" style={{ padding: 'clamp(56px, 8vw, 100px) clamp(16px, 4vw, 40px) 180px' }}>
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          style={{ marginBottom: 'clamp(40px, 6vw, 70px)' }}
        >
          <p className="eyebrow" style={{ margin: '0 0 22px' }}>Examination paper</p>
          <h1 className="serif" style={{ fontSize: 'clamp(40px, 5.6vw, 76px)', fontWeight: 300, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '0 0 26px' }}>
            {paper.title}
          </h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`tag tag-${paper.difficulty}`}>{paper.difficulty}</span>
            <span className="eyebrow-dim">{questions.length} questions</span>
            <span className="eyebrow-dim">·</span>
            <span className="eyebrow-dim">Answer every question to submit</span>
          </div>
        </motion.header>

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
      </div>

      {/* Floating submit */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'fixed', bottom: 28, left: 0, right: 0, zIndex: 80, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
      >
        <button
          onClick={handleSubmitClick}
          className={quiz.allAnswered ? 'btn-gold' : 'btn-line'}
          style={{
            pointerEvents: 'auto', padding: '18px 34px',
            ...(quiz.allAnswered ? {} : {
              background: 'color-mix(in srgb, var(--bg-solid) 80%, transparent)',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: 'var(--ink-2)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            }),
          }}
        >
          {quiz.allAnswered ? (
            <>Submit paper <Icon name="arrow" size={16} className="arrow" /></>
          ) : (
            <span className="tabular">{quiz.answeredCount} / {questions.length} — keep going</span>
          )}
        </button>
      </motion.div>

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

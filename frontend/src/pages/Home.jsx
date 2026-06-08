import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import LoadingScreen from '../components/LoadingScreen.jsx';
import { setActivePaper } from '../utils/storage.js';

const TOPIC_CHIPS = [
  'Python', 'JavaScript', 'React', 'DSA',
  'SQL', 'Node.js', 'Operating Systems',
  'Computer Networks', 'Machine Learning', 'System Design',
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const COUNTS = [5, 10, 15, 20];

const DIFFICULTY_COLORS = {
  Easy:   { color: 'var(--success)', bg: 'var(--success-bg)', border: 'rgba(16,185,129,0.3)' },
  Medium: { color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(245,158,11,0.3)' },
  Hard:   { color: 'var(--danger)',  bg: 'var(--danger-bg)',  border: 'rgba(239,68,68,0.3)' },
};

export default function Home() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const [papers, setPapers] = useState([]);
  const [papersLoading, setPapersLoading] = useState(true);

  // Fetch past papers
  useEffect(() => {
    fetchPapers();
  }, []);

  async function fetchPapers() {
    try {
      const { data } = await api.get('/papers');
      setPapers(data.data || []);
    } catch {
      // fail silently — papers section just stays empty
    } finally {
      setPapersLoading(false);
    }
  }

  async function handleGenerate() {
    const trimmed = topic.trim();
    if (!trimmed) {
      toast.error('Please enter a topic to generate questions');
      return;
    }

    setLoading(true);
    try {
      // 1. Generate questions
      const { data: genData } = await api.post('/generate', {
        topic: trimmed,
        difficulty: difficulty.toLowerCase(),
        count,
      });

      const generated = genData.data;

      // 2. Save to DB
      const { data: saveData } = await api.post('/papers', {
        title: generated.title,
        topic: trimmed,
        difficulty: difficulty.toLowerCase(),
        count,
        questions: generated.questions,
      });

      const paper = saveData.data;

      // 3. Store in localStorage + navigate
      setActivePaper(paper);
      toast.success('Questions generated!');
      navigate(`/quiz/${paper.id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to generate questions. Check your API key.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRetake(paper) {
    setActivePaper(paper);
    navigate(`/quiz/${paper.id}`);
  }

  async function handleDelete(paperId) {
    const prev = papers;
    setPapers((p) => p.filter((x) => x.id !== paperId));
    try {
      await api.delete(`/papers/${paperId}`);
      toast.success('Paper deleted');
    } catch {
      setPapers(prev);
      toast.error('Failed to delete paper');
    }
  }

  return (
    <>
      <AnimatePresence>{loading && <LoadingScreen topic={topic} count={count} difficulty={difficulty} />}</AnimatePresence>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 20px 80px' }}>

        {/* ── Hero ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 52 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 14px',
              borderRadius: 100,
              background: 'var(--primary-soft)',
              border: '1px solid rgba(99,102,241,0.3)',
              marginBottom: 22,
            }}
          >
            <span style={{ fontSize: 13 }}>✨</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.04em' }}>
              POWERED BY OPENROUTER AI
            </span>
          </motion.div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 6vw, 54px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: '0 0 16px',
              lineHeight: 1.1,
            }}
          >
            <span className="gradient-text">AI Question Paper</span>
            <br />
            <span style={{ color: 'var(--text)' }}>Generator</span>
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text-dim)', margin: 0, maxWidth: 460, marginInline: 'auto', lineHeight: 1.7 }}>
            Generate high-quality MCQ papers on any topic in seconds.
            Test yourself. Track progress. Ace your exams.
          </p>
        </motion.div>

        {/* ── Generate Form ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="card"
          style={{ padding: '28px 28px 24px', marginBottom: 40 }}
        >
          {/* Topic Input */}
          <div style={{ marginBottom: 22 }}>
            <p className="section-label">Topic</p>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                placeholder="e.g. React Hooks, Binary Trees, SQL Joins…"
                maxLength={120}
                style={{ paddingLeft: 42 }}
              />
              <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
            </div>

            {/* Quick chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
              {TOPIC_CHIPS.map((chip) => (
                <motion.button
                  key={chip}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className="chip"
                  onClick={() => setTopic(chip)}
                >
                  {chip}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Difficulty + Count row */}
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ flex: '1 1 200px' }}>
              <p className="section-label">Difficulty</p>
              <div className="toggle-group">
                {DIFFICULTIES.map((d) => {
                  const col = DIFFICULTY_COLORS[d];
                  const active = difficulty === d;
                  return (
                    <motion.button
                      key={d}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setDifficulty(d)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 8,
                        border: `1px solid ${active ? col.border : 'var(--border)'}`,
                        background: active ? col.bg : 'var(--bg-surface)',
                        color: active ? col.color : 'var(--text-dim)',
                        fontFamily: 'var(--font-body)',
                        fontSize: 14,
                        fontWeight: active ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        boxShadow: active ? `0 0 0 1px ${col.border}` : 'none',
                      }}
                    >
                      {d === 'Easy' && '🟢 '}
                      {d === 'Medium' && '🟡 '}
                      {d === 'Hard' && '🔴 '}
                      {d}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <p className="section-label">Questions</p>
              <div className="toggle-group">
                {COUNTS.map((n) => (
                  <motion.button
                    key={n}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setCount(n)}
                    className={`toggle-btn ${count === n ? 'active' : ''}`}
                  >
                    {n}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', fontSize: 16, padding: '14px', letterSpacing: '-0.01em' }}
          >
            {loading ? (
              <>
                <Spinner /> Generating…
              </>
            ) : (
              '🚀 Generate with AI'
            )}
          </motion.button>
        </motion.div>

        {/* ── Past Papers ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Past Papers
            </h2>
            {papers.length > 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {papers.length} paper{papers.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {papersLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              Loading papers…
            </div>
          ) : papers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                padding: '48px 20px',
                borderRadius: 'var(--radius-lg)',
                border: '2px dashed var(--border-muted)',
                color: 'var(--text-muted)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No papers yet</p>
              <p style={{ margin: '6px 0 0', fontSize: 13 }}>Generate your first AI question paper above</p>
            </motion.div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 14,
              }}
            >
              <AnimatePresence>
                {papers.map((paper, i) => (
                  <PaperCard
                    key={paper.id}
                    paper={paper}
                    index={i}
                    onRetake={handleRetake}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

function PaperCard({ paper, index, onRetake, onDelete }) {
  const diff = paper.difficulty;
  const colors = {
    easy:   { color: 'var(--success)', bg: 'var(--success-bg)' },
    medium: { color: 'var(--warning)', bg: 'var(--warning-bg)' },
    hard:   { color: 'var(--danger)',  bg: 'var(--danger-bg)' },
  };
  const col = colors[diff] || colors.medium;

  const date = new Date(paper.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const scoreColor =
    paper.bestScore === null ? 'var(--text-muted)'
    : paper.bestScore >= 80 ? 'var(--success)'
    : paper.bestScore >= 60 ? 'var(--info)'
    : paper.bestScore >= 40 ? 'var(--warning)'
    : 'var(--danger)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="card"
      style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
            margin: 0,
            lineHeight: 1.35,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {paper.title}
        </h3>
        <span
          style={{
            padding: '3px 9px',
            borderRadius: 6,
            background: col.bg,
            color: col.color,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'capitalize',
            flexShrink: 0,
          }}
        >
          {diff}
        </span>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)' }}>
        <span>📅 {date}</span>
        <span>❓ {paper.count}Q</span>
        {paper.attempts > 0 && <span>🔄 {paper.attempts}×</span>}
      </div>

      {/* Best score */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 8,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-muted)',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Best Score</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: scoreColor, fontFamily: 'var(--font-display)' }}>
          {paper.bestScore !== null ? `${paper.bestScore}%` : '—'}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onRetake(paper)}
          className="btn-primary"
          style={{ flex: 1, fontSize: 13, padding: '9px 12px' }}
        >
          ▶ Retake
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onDelete(paper.id)}
          className="btn-danger"
          style={{ padding: '9px 12px' }}
          title="Delete paper"
        >
          🗑
        </motion.button>
      </div>
    </motion.div>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2.5" strokeDasharray="30" strokeDashoffset="10" strokeLinecap="round"/>
    </svg>
  );
}

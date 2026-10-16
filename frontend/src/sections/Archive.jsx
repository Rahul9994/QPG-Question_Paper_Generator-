import { useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Icon from '../components/Icon.jsx';
import { Reveal, LineReveal } from '../components/Reveal.jsx';

const EASE = [0.16, 1, 0.3, 1];

function scoreColor(score) {
  if (score === null || score === undefined) return 'var(--ink-3)';
  if (score >= 80) return 'var(--emerald)';
  if (score >= 60) return 'var(--azure)';
  if (score >= 40) return 'var(--amber)';
  return 'var(--ruby)';
}

function PaperCard({ paper, index, onRetake, onDelete }) {
  const ref = useRef(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });

  function onMove(e) {
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    mx.set(x); my.set(y);
    ref.current.style.setProperty('--mx', `${x * 100}%`);
    ref.current.style.setProperty('--my', `${y * 100}%`);
  }

  function onLeave() { mx.set(0.5); my.set(0.5); }

  const date = new Date(paper.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const diff = paper.difficulty || 'medium';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
      viewport={{ once: true, amount: 0.2 }}
      exit={{ opacity: 0, scale: 0.94, filter: 'blur(6px)', transition: { duration: 0.4 } }}
      transition={{ duration: 1.1, ease: EASE, delay: (index % 3) * 0.08 }}
      style={{ perspective: 1000 }}
    >
      <motion.article
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="glass glow-edge"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', gap: 22, minHeight: 300 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="serif" style={{ fontStyle: 'italic', fontSize: 18, color: 'var(--gold)' }}>
            Nº {String(index + 1).padStart(2, '0')}
          </span>
          <span className={`tag tag-${diff}`}>{diff}</span>
        </div>

        <h3
          className="serif"
          style={{
            fontSize: 27, fontWeight: 400, lineHeight: 1.15, color: 'var(--ink)', margin: 0,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          }}
        >
          {paper.title}
        </h3>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
          <span>{date}</span>
          <span>·</span>
          <span>{paper.count} questions</span>
          {paper.attempts > 0 && (<><span>·</span><span>{paper.attempts} {paper.attempts === 1 ? 'sitting' : 'sittings'}</span></>)}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
          <div>
            <p className="eyebrow-dim" style={{ margin: '0 0 6px' }}>Best score</p>
            <span className="serif tabular" style={{ fontSize: 48, fontWeight: 300, lineHeight: 0.9, color: scoreColor(paper.bestScore) }}>
              {paper.bestScore !== null && paper.bestScore !== undefined ? `${paper.bestScore}%` : '—'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-icon danger" onClick={() => onDelete(paper.id)} aria-label="Delete paper" title="Delete paper">
              <Icon name="trash" size={16} />
            </button>
            <button className="btn-line" onClick={() => onRetake(paper)} style={{ padding: '12px 18px', fontSize: 10.5 }}>
              {paper.attempts > 0 ? 'Retake' : 'Attempt'} <Icon name="arrow" size={14} />
            </button>
          </div>
        </div>
      </motion.article>
    </motion.div>
  );
}

export default function Archive({ papers, loading, onRetake, onDelete, onCompose }) {
  return (
    <section id="archive" className="section" style={{ paddingTop: 'clamp(60px, 8vw, 120px)' }}>
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 'clamp(40px, 6vw, 80px)' }}>
          <div>
            <Reveal><p className="eyebrow" style={{ margin: '0 0 26px' }}>Nº 02 — The Archive</p></Reveal>
            <LineReveal
              text="Every paper, remembered."
              italic={[2]}
              style={{ fontSize: 'clamp(46px, 6vw, 96px)', fontWeight: 300, lineHeight: 0.98, letterSpacing: '-0.025em', margin: 0 }}
            />
          </div>
          {papers.length > 0 && (
            <Reveal delay={0.2}>
              <span className="serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-3)' }}>
                {papers.length} {papers.length === 1 ? 'paper' : 'papers'} in the collection
              </span>
            </Reveal>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 18 }}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="glass"
                animate={{ opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                style={{ height: 300 }}
              />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <Reveal>
            <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 'clamp(48px, 8vw, 100px) 24px', textAlign: 'center' }}>
              <p className="serif" style={{ fontSize: 'clamp(30px, 3.6vw, 48px)', fontStyle: 'italic', fontWeight: 300, color: 'var(--ink-2)', margin: '0 0 12px' }}>
                Your archive awaits its first paper.
              </p>
              <p style={{ margin: '0 0 34px', color: 'var(--ink-3)', fontSize: 14 }}>Composed papers are kept here, with your best score for each.</p>
              <button className="btn-line" onClick={onCompose}>Compose the first <Icon name="arrow" size={14} /></button>
            </div>
          </Reveal>
        ) : (
          <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 18 }}>
            <AnimatePresence>
              {papers.map((paper, i) => (
                <PaperCard key={paper.id} paper={paper} index={i} onRetake={onRetake} onDelete={onDelete} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
}

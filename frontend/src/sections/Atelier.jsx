import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/Icon.jsx';
import { Reveal, LineReveal } from '../components/Reveal.jsx';
import { useEngine, engineLabel } from '../hooks/useEngine.js';

export const TOPIC_CHIPS = [
  'Python', 'JavaScript', 'React', 'DSA',
  'SQL', 'Node.js', 'Operating Systems',
  'Computer Networks', 'Machine Learning', 'System Design',
];

export const CALIBRES = [
  { value: 'Easy',   name: 'Foundation', numeral: 'I',   note: 'Core concepts, clearly framed.' },
  { value: 'Medium', name: 'Advanced',   numeral: 'II',  note: 'Applied and scenario-based.' },
  { value: 'Hard',   name: 'Mastery',    numeral: 'III', note: 'Edge cases and subtle traps.' },
];

const COUNTS = [5, 10, 15, 20];
const EASE = [0.16, 1, 0.3, 1];

function SpecRow({ label, value, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 20, padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
      <span className="eyebrow-dim">{label}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="serif"
          style={{ fontSize: 21, fontStyle: accent ? 'italic' : 'normal', color: accent ? 'var(--gold)' : 'var(--ink)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function Atelier({ topic, setTopic, difficulty, setDifficulty, count, setCount, loading, onGenerate }) {
  const engine = useEngine();
  const calibre = CALIBRES.find((c) => c.value === difficulty) || CALIBRES[1];

  return (
    <section id="atelier" className="section" style={{ paddingTop: 'clamp(80px, 10vw, 140px)' }}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 'clamp(48px, 7vw, 110px)', alignItems: 'start' }}>
        {/* Left: title + live specification */}
        <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 40px)' }}>
          <Reveal><p className="eyebrow" style={{ margin: '0 0 28px' }}>Nº 01 — The Atelier</p></Reveal>
          <LineReveal
            text="Compose a paper."
            italic={[2]}
            style={{ fontSize: 'clamp(54px, 7vw, 112px)', fontWeight: 300, lineHeight: 0.95, letterSpacing: '-0.025em', margin: '0 0 30px' }}
          />
          <Reveal delay={0.15}>
            <p style={{ maxWidth: 440, margin: '0 0 48px', color: 'var(--ink-2)', fontSize: 16, lineHeight: 1.8, fontWeight: 300 }}>
              Name a subject, choose a calibre and a length. The engine composes questions,
              four balanced options and an explanation for every answer.
            </p>
          </Reveal>

          <Reveal delay={0.25}>
            <div style={{ maxWidth: 480, borderTop: '1px solid var(--line-2)' }}>
              <SpecRow label="Subject" value={topic.trim() || 'Awaiting your subject'} accent={!topic.trim()} />
              <SpecRow label="Calibre" value={`${calibre.name} · ${calibre.numeral}`} />
              <SpecRow label="Length" value={`${count} questions`} />
              <SpecRow label="Est. sitting" value={`≈ ${Math.max(3, Math.round(count * 1.2))} minutes`} />
              <SpecRow label="Engine" value={engineLabel(engine)} accent />
            </div>
          </Reveal>
        </div>

        {/* Right: the composer */}
        <Reveal delay={0.1} y={60}>
          <div className="glass" style={{ padding: 'clamp(26px, 4vw, 56px)', position: 'relative', overflow: 'hidden' }}>
            <div aria-hidden="true" style={{ position: 'absolute', top: -160, right: -160, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, var(--gold-glow), transparent 65%)', opacity: 0.55, pointerEvents: 'none' }} />

            <label htmlFor="topic" className="eyebrow-dim" style={{ display: 'block', marginBottom: 6 }}>I. Subject</label>
            <input
              id="topic"
              className="field-lux"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
              placeholder="Name your subject…"
              maxLength={120}
              autoComplete="off"
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '22px 0 52px' }}>
              {TOPIC_CHIPS.map((chip) => (
                <button key={chip} className={`chip-lux ${topic === chip ? 'on' : ''}`} onClick={() => setTopic(chip)}>
                  {chip}
                </button>
              ))}
            </div>

            <p className="eyebrow-dim" style={{ margin: '0 0 16px' }}>II. Calibre</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 10, marginBottom: 52 }}>
              {CALIBRES.map((c) => (
                <button key={c.value} className={`calibre ${difficulty === c.value ? 'on' : ''}`} onClick={() => setDifficulty(c.value)}>
                  <span className="serif" style={{ display: 'block', fontSize: 15, fontStyle: 'italic', color: difficulty === c.value ? 'var(--gold)' : 'var(--ink-3)', marginBottom: 14 }}>
                    {c.numeral}
                  </span>
                  <span className="serif" style={{ display: 'block', fontSize: 23, lineHeight: 1, marginBottom: 8, color: 'inherit' }}>{c.name}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>{c.value} · {c.note}</span>
                </button>
              ))}
            </div>

            <p className="eyebrow-dim" style={{ margin: '0 0 16px' }}>III. Length</p>
            <div className="seg" style={{ marginBottom: 52 }}>
              {COUNTS.map((n) => (
                <button key={n} className={`tabular ${count === n ? 'on' : ''}`} onClick={() => setCount(n)} aria-pressed={count === n}>
                  {count === n && (
                    <motion.span
                      layoutId="count-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                      style={{ position: 'absolute', inset: 0, borderRadius: 999, background: 'linear-gradient(135deg, #f6e6bd, #d6b67a 50%, #a8834b)', zIndex: -1 }}
                    />
                  )}
                  {String(n).padStart(2, '0')}
                </button>
              ))}
            </div>

            <button className="btn-gold" onClick={onGenerate} disabled={loading} style={{ width: '100%', padding: '21px 30px', fontSize: 12.5 }}>
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid rgba(20,15,8,0.3)', borderTopColor: '#140f08', animation: 'spin 0.8s linear infinite' }} />
                  Composing…
                </>
              ) : (
                <>Compose paper <Icon name="arrow" size={16} className="arrow" /></>
              )}
            </button>

            <p style={{ margin: '18px 0 0', textAlign: 'center', fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
              {engine && !engine.configured
                ? 'Add GROQ_API_KEY to backend/.env to switch the engine on.'
                : 'Press Enter to compose · the best free Groq model is selected automatically'}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

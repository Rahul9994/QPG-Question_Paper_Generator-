import { Reveal, ScrubWords, Counter } from '../components/Reveal.jsx';

const TEXT =
  'We believe a great examination is a work of quiet precision — every question measured, every option balanced, every answer explained. Now it takes seconds, not evenings.';

export default function Manifesto({ paperCount }) {
  const stats = [
    { value: '∞', label: 'Subjects', note: 'From SQL joins to Sanskrit grammar' },
    { value: 3, pad: 2, label: 'Calibres', note: 'Foundation, Advanced, Mastery' },
    { value: 20, pad: 2, label: 'Questions', note: 'Per paper, each one explained' },
    { value: paperCount, pad: 2, label: 'In your archive', note: 'Every attempt remembered' },
  ];

  return (
    <section className="section" style={{ paddingBottom: 'clamp(80px, 10vw, 140px)' }}>
      <div className="wrap">
        <div className="split">
          <Reveal>
            <p className="eyebrow" style={{ margin: '0.9em 0 0' }}>— The Manifesto</p>
          </Reveal>
          <div style={{ minWidth: 0 }}>
            <ScrubWords
              text={TEXT}
              accents={[7, 8, 22]}
              style={{
                margin: 0, fontFamily: 'var(--font-display)', fontWeight: 300,
                fontSize: 'clamp(32px, 4.6vw, 72px)', lineHeight: 1.12, letterSpacing: '-0.015em', color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        <div className="stats" style={{ marginTop: 'clamp(80px, 10vw, 140px)' }}>
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="stat-cell">
              <div className="serif tabular" style={{ fontSize: 'clamp(54px, 6vw, 88px)', fontWeight: 300, lineHeight: 1, color: 'var(--ink)' }}>
                <Counter value={s.value} pad={s.pad} />
              </div>
              <p className="eyebrow" style={{ margin: '20px 0 8px' }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>{s.note}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';

const MESSAGES = [
  'Consulting the AI oracle…',
  'Crafting brain-bending questions…',
  'Summoning knowledge…',
  'Calibrating difficulty…',
  'Polishing explanations…',
];

export default function LoadingScreen({ topic, count, difficulty }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        gap: 28,
        padding: 24,
      }}
    >
      {/* Animated orb */}
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--primary)',
            borderRightColor: 'var(--violet)',
          }}
        />
        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 14,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: 'var(--cyan)',
            borderLeftColor: 'var(--violet)',
          }}
        />
        {/* Center */}
        <div
          style={{
            position: 'absolute',
            inset: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--violet))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          🧠
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 700,
            margin: '0 0 8px',
            color: 'var(--text)',
          }}
        >
          Generating Questions
        </h3>

        {topic && (
          <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--text-dim)' }}>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                background: 'var(--primary-soft)',
                color: 'var(--primary)',
                fontWeight: 600,
              }}
            >
              {topic}
            </span>
          </p>
        )}

        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-dim)' }}>
          {count} {difficulty} MCQs — this may take a moment
        </p>
      </div>

      {/* Animated messages */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px',
          borderRadius: 10,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        <LoadingDots />
        <RandomMessage />
      </motion.div>
    </motion.div>
  );
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`dot-${i}`}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            display: 'inline-block',
            background: 'var(--primary)',
          }}
        />
      ))}
    </div>
  );
}

function RandomMessage() {
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  return (
    <span style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic' }}>{msg}</span>
  );
}

import Icon from './Icon.jsx';

export default function Timer({ formatted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-2)' }}>
      <Icon name="clock" size={15} style={{ color: 'var(--gold)' }} />
      <span className="serif tabular" style={{ fontSize: 22, fontWeight: 400, color: 'var(--ink)', letterSpacing: '0.04em', minWidth: 58 }}>
        {formatted}
      </span>
    </div>
  );
}

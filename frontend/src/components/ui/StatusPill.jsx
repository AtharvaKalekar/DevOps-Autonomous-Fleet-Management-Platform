const STATUS_MAP = {
  active: 'pill pill-success',
  idle: 'pill pill-warning',
  maintenance: 'pill pill-orange',
  offline: 'pill pill-danger',
  critical: 'pill pill-danger',
  high: 'pill pill-orange',
  medium: 'pill pill-warning',
  low: 'pill pill-info',
};

export default function StatusPill({ status, label }) {
  const cls = STATUS_MAP[status] || 'pill pill-neutral';
  return (
    <span className={`${cls} capitalize`}>{label ?? status}</span>
  );
}

interface StatusBadgeProps {
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  running: 'RUNNING',
  idle: 'IDLE',
  open: 'OPEN',
  in_progress: 'IN PROGRESS',
  done: 'DONE',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] || status.toUpperCase();
  const pulsing = status === 'running' || status === 'in_progress';

  return (
    <span className={`badge badge--${status}`}>
      {pulsing && <span className="badge__dot" style={{ background: 'currentColor' }} />}
      {label}
    </span>
  );
}

interface CategoryBadgeProps {
  category: string;
  label: string;
  color: string;
}

export function CategoryBadge({ label, color }: CategoryBadgeProps) {
  return (
    <span
      className="badge badge--category"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 15%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: string }) {
  return <span className={`priority-dot priority-dot--${priority}`} />;
}

export function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`badge badge--${type}`}>
      {type.toUpperCase()}
    </span>
  );
}

export function AssigneeBadge({ assignee }: { assignee: string }) {
  return (
    <span className={assignee === 'me' ? 'badge badge--assignee-me' : 'badge badge--assignee-bot'}>
      {assignee === 'me' ? 'ME' : 'BOT'}
    </span>
  );
}

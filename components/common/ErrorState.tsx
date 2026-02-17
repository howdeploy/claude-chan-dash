import Card from './Card';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card borderColor="var(--red)">
      <div style={{ fontSize: '0.8125rem', color: 'var(--red)', marginBottom: 10 }}>
        Connection error: {message}
      </div>
      {onRetry && (
        <button className="btn btn--danger btn--sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </Card>
  );
}

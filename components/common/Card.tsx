import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  label?: string;
  clickable?: boolean;
  borderColor?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export default function Card({ children, label, clickable, borderColor, style, onClick }: CardProps) {
  return (
    <div
      className={`card ${clickable ? 'card--clickable' : ''}`}
      onClick={onClick}
      style={{
        ...(borderColor ? { borderLeftWidth: 2, borderLeftStyle: 'solid', borderLeftColor: borderColor } : {}),
        ...style,
      }}
    >
      {label && <div className="card__label">{label}</div>}
      {children}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

export default function LoadingState({ text = 'Loading...' }: { text?: string }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: 20,
      fontSize: '0.8125rem',
      color: 'var(--overlay0)',
    }}>
      <span style={{ color: 'var(--accent-primary)' }}>⟩</span>
      {text}
      <span style={{ color: 'var(--accent-primary)', minWidth: '1.5em' }}>{dots || '\u00A0'}</span>
    </div>
  );
}

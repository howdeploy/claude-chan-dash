'use client';

import { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  showTime?: boolean;
}

export default function Header({ title, showTime = true }: HeaderProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!showTime) return;
    function update() {
      setTime(new Date().toLocaleTimeString('ru-RU', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        timeZone: 'Europe/Moscow',
      }));
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [showTime]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 12,
      marginBottom: 'var(--space-xl)',
      paddingBottom: 'var(--space-md)',
      borderBottom: '1px solid var(--surface0)',
    }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{title}</h1>
      {showTime && time && (
        <span style={{ fontSize: '0.75rem', color: 'var(--overlay0)', fontVariantNumeric: 'tabular-nums' }}>
          {time} МСК
        </span>
      )}
    </div>
  );
}

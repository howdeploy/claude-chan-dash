'use client';

import { ReactNode } from 'react';

interface MarkdownViewProps {
  text: string;
}

export default function MarkdownView({ text }: MarkdownViewProps) {
  let cleaned = text;
  if (cleaned.startsWith('---')) {
    const endIndex = cleaned.indexOf('---', 3);
    if (endIndex !== -1) {
      cleaned = cleaned.slice(endIndex + 3).trim();
    }
  }

  const lines = cleaned.split('\n');
  const elements: ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';
  let lastWasEmpty = false;

  function renderInline(str: string): ReactNode[] {
    const parts: ReactNode[] = [];
    let remaining = str;
    let key = 0;

    // Process inline patterns
    const regex = /(\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        parts.push(remaining.slice(lastIndex, match.index));
      }

      if (match[2]) {
        // Bold
        parts.push(<strong key={key++} style={{ color: 'var(--text)', fontWeight: 600 }}>{match[2]}</strong>);
      } else if (match[3]) {
        // Inline code
        parts.push(
          <span key={key++} style={{
            background: 'rgba(203, 166, 247, 0.08)',
            padding: '1px 6px',
            borderRadius: 3,
            fontSize: '0.75rem',
            color: 'var(--accent-primary)',
          }}>{match[3]}</span>
        );
      } else if (match[4] && match[5]) {
        // Link
        parts.push(
          <a key={key++} href={match[5]} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent-secondary)' }}>
            {match[4]}
          </a>
        );
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < remaining.length) {
      parts.push(remaining.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [str];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={i} style={{
            background: 'var(--crust)',
            border: '1px solid var(--surface0)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: 12,
            overflowX: 'auto',
          }}>
            {codeLang && (
              <div style={{ fontSize: '0.625rem', color: 'var(--overlay0)', marginBottom: 6, letterSpacing: '0.05em' }}>
                {codeLang.toUpperCase()}
              </div>
            )}
            <pre style={{ fontSize: '0.75rem', color: 'var(--subtext0)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {codeLines.join('\n')}
            </pre>
          </div>
        );
        codeLines = [];
        codeLang = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      if (!lastWasEmpty) {
        elements.push(<div key={i} style={{ height: 6 }} />);
        lastWasEmpty = true;
      }
      continue;
    }
    lastWasEmpty = false;

    if (line.startsWith('# ')) {
      elements.push(
        <div key={i} style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, marginTop: 16 }} className="gradient-text">
          {line.slice(2)}
        </div>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <div key={i} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6, marginTop: 14 }}>
          {line.slice(3)}
        </div>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <div key={i} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--subtext1)', marginBottom: 4, marginTop: 12 }}>
          {line.slice(4)}
        </div>
      );
      continue;
    }

    if (/^-{3,}$/.test(line) || /^\*{3,}$/.test(line)) {
      elements.push(
        <div key={i} style={{ height: 1, background: 'var(--surface0)', margin: '12px 0' }} />
      );
      continue;
    }

    if (/^\s*[-*]\s/.test(line)) {
      const indent = (line.match(/^(\s*)/)?.[1] || '').length;
      const content = line.replace(/^\s*[-*]\s/, '');
      elements.push(
        <div key={i} style={{
          display: 'flex', gap: 8, marginBottom: 4, paddingLeft: indent * 8,
          fontSize: '0.8125rem', color: 'var(--subtext0)', lineHeight: 1.5,
        }}>
          <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
      continue;
    }

    elements.push(
      <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--subtext0)', lineHeight: 1.6, marginBottom: 4 }}>
        {renderInline(line)}
      </div>
    );
  }

  return <div>{elements}</div>;
}

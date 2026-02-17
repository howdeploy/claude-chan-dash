'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [dots, setDots] = useState('');
  const [backend, setBackend] = useState<'gateway' | 'claude-cli'>('claude-cli');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Loading dots animation
  useEffect(() => {
    if (!sending) return;
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400);
    return () => clearInterval(interval);
  }, [sending]);

  // Load history
  useEffect(() => {
    fetch('/api/chat').then(r => r.json())
      .then(data => {
        if (data.messages) setMessages(data.messages);
        if (data.backend) setBackend(data.backend);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = {
      id: `tmp_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.history) {
        setMessages(data.history);
      } else if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: 'Ошибка соединения с ассистентом',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending]);

  async function clearHistory() {
    if (!confirm('Очистить историю чата?')) return;
    await fetch('/api/chat', { method: 'DELETE' });
    setMessages([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString('ru-RU', {
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Moscow',
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--space-xl) * 2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Header title="Чат" showTime={false} />
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              padding: '4px 12px', fontSize: '0.6875rem', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--surface1)', background: 'transparent',
              color: 'var(--overlay0)', cursor: 'pointer',
            }}
          >
            Очистить
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
        padding: '0 0 16px 0',
        fontFamily: 'monospace',
      }}>
        {messages.length === 0 && !sending && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8, color: 'var(--overlay0)',
          }}>
            <span style={{ fontSize: '1.5rem' }}>▹</span>
            <span style={{ fontSize: '0.8125rem' }}>Напиши сообщение ассистенту</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--surface2)' }}>
              {backend === 'gateway' ? 'Ответы через Clawdbot Gateway' : 'Ответы через claude --print'}
            </span>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ padding: '6px 0' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{
                fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0, minWidth: 20,
                color: msg.role === 'user' ? 'var(--green)' : 'var(--accent-primary)',
              }}>
                {msg.role === 'user' ? '>' : '◈'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <pre style={{
                  fontSize: '0.8125rem',
                  color: msg.role === 'user' ? 'var(--text)' : 'var(--subtext0)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}>
                  {msg.content}
                </pre>
                <span style={{ fontSize: '0.5625rem', color: 'var(--surface2)' }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ padding: '6px 0' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-primary)', minWidth: 20 }}>
                ◈
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--overlay0)' }}>
                думаю{dots}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid var(--surface0)',
        padding: '12px 0 0 0',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--mantle)',
          border: '1px solid var(--surface0)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ color: 'var(--green)', fontSize: '0.8125rem', fontWeight: 700, flexShrink: 0 }}>{'>'}</span>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение ассистенту..."
            disabled={sending}
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: '0.8125rem', fontFamily: 'monospace',
              resize: 'none', lineHeight: 1.5, padding: 0,
            }}
          />
        </div>
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--accent-primary)',
            background: input.trim() && !sending
              ? 'rgba(203, 166, 247, 0.1)' : 'transparent',
            color: input.trim() && !sending
              ? 'var(--accent-primary)' : 'var(--surface2)',
            fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
            opacity: input.trim() && !sending ? 1 : 0.4,
            fontFamily: 'monospace',
          }}
        >
          ↵
        </button>
      </div>
    </div>
  );
}

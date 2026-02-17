'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Card from '@/components/common/Card';
import { StatusBadge, PriorityDot } from '@/components/common/Badge';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

interface StatusData {
  name: string;
  version: string;
  uptime: string;
  currentTask: string | null;
  memorySize: string;
  totalTasks: number;
  completedTasks: number;
  cpu?: string;
  ram?: string;
  disk?: string;
  loadAvg?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  date: string;
  priority: string;
}

interface Process {
  id: string;
  name: string;
  status: string;
  nextRun: string | null;
}

interface UsageMeter {
  label: string;
  messages: number;
  tokens: string;
  pctMessages: number;
  pctTokens: number;
}

interface UsageData {
  meters: UsageMeter[];
  total: { sessions: number; messages: number };
  model: string;
  plan: string;
}

export default function OverviewClient() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(interval);
  }, []);

  const load = useCallback(async () => {
    try {
      const [s, t, p, u] = await Promise.all([
        fetch('/api/status').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()).catch(() => ({ tasks: [] })),
        fetch('/api/processes').then(r => r.json()).catch(() => ({ processes: [] })),
        fetch('/api/usage').then(r => r.json()).catch(() => null),
      ]);
      setStatus(s);
      setTasks(t.tasks || []);
      setProcesses(p.processes || []);
      if (u && !u.error) setUsage(u);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !status) return <LoadingState text="Connecting to agent" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === today);
  const runningProcesses = processes.filter(p => p.status === 'running');

  return (
    <>
      <Header title="Дашборд ассистента" />

      <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Колонка 1: Задачи пользователя */}
        <Card label={`> ЗАДАЧИ НА СЕГОДНЯ (${todayTasks.length})`}>
          {todayTasks.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--overlay0)' }}>Нет задач на сегодня</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todayTasks.slice(0, 8).map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)',
                  borderLeft: `2px solid ${task.status === 'done' ? 'var(--green)' : task.status === 'in_progress' ? 'var(--blue)' : 'var(--surface1)'}`,
                }}>
                  <PriorityDot priority={task.priority} />
                  <span style={{
                    fontSize: '0.75rem', flex: 1,
                    color: task.status === 'done' ? 'var(--overlay0)' : 'var(--text)',
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {task.title}
                  </span>
                  <StatusBadge status={task.status} />
                </div>
              ))}
              {todayTasks.length > 8 && (
                <div style={{ fontSize: '0.6875rem', color: 'var(--overlay0)', paddingLeft: 12 }}>
                  + ещё {todayTasks.length - 8}...
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Колонка 2: Задачи бота / автопроцессы */}
        <Card label={`> ПРОЦЕССЫ АССИСТЕНТА (${runningProcesses.length})`}>
          {runningProcesses.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--overlay0)' }}>Нет активных процессов</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {runningProcesses.map(proc => (
                <div key={proc.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)', borderLeft: '2px solid var(--accent-primary)',
                }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text)' }}>{proc.name}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--overlay0)', marginTop: 2 }}>
                      след: {proc.nextRun ? new Date(proc.nextRun).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                  </div>
                  <StatusBadge status={proc.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Колонка 3: Состояние сервера */}
        <Card label="> СОСТОЯНИЕ СЕРВЕРА">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusBadge status="running" />
              <span style={{ color: 'var(--subtext0)', fontSize: '0.75rem' }}>
                аптайм: {status?.uptime || '—'}
              </span>
            </div>
            {[
              { label: 'CPU', value: status?.cpu || '—' },
              { label: 'RAM', value: status?.ram || '—' },
              { label: 'ДИСК', value: status?.disk || '—' },
              { label: 'НАГРУЗКА', value: status?.loadAvg || '—' },
              { label: 'ЗАДАЧИ', value: `${status?.completedTasks || 0}/${status?.totalTasks || 0}` },
              { label: 'ПАМЯТЬ АГЕНТА', value: status?.memorySize || '—' },
              { label: 'ВЕРСИЯ АССИСТЕНТА', value: `v${status?.version || '?'}` },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
              }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--overlay0)', letterSpacing: '0.05em' }}>
                  {item.label}
                </span>
                <span className="gradient-text" style={{ fontSize: '0.875rem', fontWeight: 700 }}>
                  {item.value}
                </span>
              </div>
            ))}
            {status?.currentTask && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(203, 166, 247, 0.03)',
                border: '1px solid var(--surface0)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ color: 'var(--accent-primary)' }}>⟩</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {status.currentTask}
                </span>
                <span style={{ color: 'var(--accent-primary)', minWidth: '1.5em' }}>{dots || '\u00A0'}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Статус-лайн подписки */}
      {usage && (
        <div style={{ marginTop: 20 }}>
          {/* Заголовок */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12, padding: '0 4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.6875rem' }}>
              <span style={{
                padding: '2px 8px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(203, 166, 247, 0.1)', border: '1px solid rgba(203, 166, 247, 0.2)',
                color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.625rem',
                letterSpacing: '0.05em',
              }}>
                {usage.plan}
              </span>
              <span style={{ color: 'var(--overlay0)' }}>
                {usage.model.replace(/-\d+$/, '').split('/').pop()}
              </span>
            </div>
            <div style={{ fontSize: '0.625rem', color: 'var(--surface2)' }}>
              всего {usage.total.messages.toLocaleString()} сообщений · {usage.total.sessions} сессий
            </div>
          </div>

          {/* Прогресс-метры */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {usage.meters.map(meter => {
              const barColor = meter.pctMessages > 80
                ? 'var(--red)' : meter.pctMessages > 50
                ? 'var(--peach)' : 'var(--accent-primary)';
              return (
                <div key={meter.label} style={{
                  padding: '12px 14px',
                  background: 'var(--mantle)',
                  border: '1px solid var(--surface0)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 8,
                  }}>
                    <span style={{ fontSize: '0.625rem', color: 'var(--overlay0)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {meter.label}
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: barColor }}>
                      {meter.pctMessages}%
                    </span>
                  </div>

                  {/* Прогресс-бар */}
                  <div style={{
                    height: 4, borderRadius: 2,
                    background: 'var(--surface0)',
                    overflow: 'hidden', marginBottom: 8,
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${meter.pctMessages}%`,
                      background: barColor,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--surface2)' }}>
                    <span>{meter.messages.toLocaleString()} msg</span>
                    <span>{meter.tokens} tok</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

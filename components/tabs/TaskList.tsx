'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchTasks, updateTask, deleteTask, type Task } from '@/lib/api-client';
import { formatDate, formatDeadlineTime } from '@/lib/formatters';
import { CATEGORIES } from '@/lib/constants';
import Card from '@/components/common/Card';
import { StatusBadge, PriorityDot, CategoryBadge, AssigneeBadge } from '@/components/common/Badge';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

interface TaskListProps {
  onEdit: (task: Task) => void;
}

export default function TaskList({ onEdit }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await fetchTasks();
      setTasks(data.tasks || []);
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

  async function toggleDone(task: Task) {
    const newStatus = task.status === 'done' ? 'open' : 'done';
    await updateTask(task.id, { status: newStatus });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить задачу?')) return;
    await deleteTask(id);
    load();
  }

  if (loading && tasks.length === 0) return <LoadingState text="Loading tasks" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  let filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  if (assigneeFilter !== 'all') {
    filtered = filtered.filter(t => (t.assignee || 'agent') === assigneeFilter);
  }

  const grouped: Record<string, Task[]> = {};
  filtered.forEach(task => {
    const date = task.date || 'undated';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(task);
  });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const statusCounts = {
    all: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'all', label: 'Все' },
          { key: 'open', label: 'Открытые' },
          { key: 'in_progress', label: 'В работе' },
          { key: 'done', label: 'Выполнены' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`filter-btn ${filter === f.key ? 'filter-btn--active' : ''}`}
          >
            {f.label} ({statusCounts[f.key as keyof typeof statusCounts]})
          </button>
        ))}
        <span style={{ width: 1, height: 20, background: 'var(--surface0)', margin: '0 4px' }} />
        {[
          { key: 'all', label: 'Все' },
          { key: 'agent', label: 'Агент' },
          { key: 'me', label: 'Мои' },
        ].map(f => (
          <button
            key={`a_${f.key}`}
            onClick={() => setAssigneeFilter(f.key)}
            className={`filter-btn ${assigneeFilter === f.key ? 'filter-btn--active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sortedDates.map(date => (
        <Card key={date}>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--accent-primary)',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid var(--surface0)',
            letterSpacing: '0.05em',
          }}>
            {'>'} {formatDate(date)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {grouped[date].map(task => {
              const cat = CATEGORIES[task.category] || CATEGORIES.other;
              return (
                <div key={task.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.015)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `2px solid ${task.status === 'done' ? 'var(--green)' : task.status === 'in_progress' ? 'var(--blue)' : 'var(--surface1)'}`,
                }}>
                  <button
                    onClick={() => toggleDone(task)}
                    style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: task.status === 'done' ? '1px solid var(--green)' : '1px solid var(--surface2)',
                      background: task.status === 'done' ? 'rgba(166, 227, 161, 0.15)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: 'var(--green)', cursor: 'pointer',
                    }}
                  >
                    {task.status === 'done' ? '✓' : task.status === 'in_progress' ? '—' : ''}
                  </button>
                  <PriorityDot priority={task.priority} />
                  {task.assignee && <AssigneeBadge assignee={task.assignee} />}
                  <span
                    onClick={() => onEdit(task)}
                    style={{
                      fontSize: '0.8125rem', flex: 1, cursor: 'pointer',
                      color: task.status === 'done' ? 'var(--overlay0)' : 'var(--text)',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                    {task.deadline && task.status !== 'done' && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--overlay0)', marginLeft: 8 }}>
                        {formatDeadlineTime(task.deadline)}
                      </span>
                    )}
                  </span>
                  {task.category && <CategoryBadge category={task.category} label={cat.label} color={cat.color} />}
                  <StatusBadge status={task.status} />
                  <button
                    onClick={() => handleDelete(task.id)}
                    style={{
                      fontSize: '0.75rem', color: 'var(--surface2)', cursor: 'pointer',
                      padding: '2px 6px', borderRadius: 4,
                    }}
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--overlay0)', fontSize: '0.8125rem' }}>
          Нет задач
        </div>
      )}
    </div>
  );
}

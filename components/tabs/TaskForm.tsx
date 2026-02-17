'use client';

import { useState, useEffect } from 'react';
import { createTask, updateTask, type Task } from '@/lib/api-client';
import Modal from '@/components/common/Modal';

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function TaskForm({ task, onClose, onSaved }: TaskFormProps) {
  const isEdit = !!task;
  const [title, setTitle] = useState(task?.title || '');
  const [priority, setPriority] = useState<string>(task?.priority || 'medium');
  const [category, setCategory] = useState<string>(task?.category || 'other');
  const [assignee, setAssignee] = useState<string>(task?.assignee || 'agent');
  const [date, setDate] = useState<string>(task?.date || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<string>(task?.status || 'open');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setCategory(task.category);
      setAssignee(task.assignee);
      setDate(task.date);
      setStatus(task.status);
    }
  }, [task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (isEdit && task) {
        await updateTask(task.id, { title, priority: priority as Task['priority'], category, assignee: assignee as Task['assignee'], date, status: status as Task['status'] });
      } else {
        await createTask({ title, priority, category, assignee, date });
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={isEdit ? 'Редактировать задачу' : 'Новая задача'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div className="form-group">
          <label className="form-label">Название</label>
          <input
            className="form-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Что нужно сделать?"
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Приоритет</label>
            <select className="form-select" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Категория</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="work">Работа</option>
              <option value="home">Дом</option>
              <option value="health">Здоровье</option>
              <option value="fitness">Спорт</option>
              <option value="finance">Финансы</option>
              <option value="system">System</option>
              <option value="other">Другое</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Исполнитель</label>
            <select className="form-select" value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="agent">Агент</option>
              <option value="me">Мои</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Дата</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>

        {isEdit && (
          <div className="form-group">
            <label className="form-label">Статус</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="open">Открыта</option>
              <option value="in_progress">В работе</option>
              <option value="done">Выполнена</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn--primary" disabled={saving || !title.trim()}>
            {saving ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

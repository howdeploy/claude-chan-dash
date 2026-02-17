'use client';

import { useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import TaskList from '@/components/tabs/TaskList';
import TaskForm from '@/components/tabs/TaskForm';
import type { Task } from '@/lib/api-client';

export default function TasksClient() {
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = useCallback((task: Task) => {
    setEditTask(task);
    setShowForm(true);
  }, []);

  function handleSaved() {
    setRefreshKey(k => k + 1);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Header title="Задачи" />
        <button className="btn btn--primary" onClick={() => { setEditTask(null); setShowForm(true); }}>
          + Новая задача
        </button>
      </div>

      {showForm && (
        <TaskForm
          task={editTask}
          onClose={() => { setShowForm(false); setEditTask(null); }}
          onSaved={handleSaved}
        />
      )}

      <TaskList key={refreshKey} onEdit={handleEdit} />
    </>
  );
}

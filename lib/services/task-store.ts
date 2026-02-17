import fs from 'fs';
import path from 'path';
import { getWorkspacePath } from './config-store';

interface TaskData {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'done';
  date: string;
  deadline: string | null;
  priority: 'high' | 'medium' | 'low';
  category: string;
  assignee: 'agent' | 'me';
  createdAt: string;
}

function getTasksPath(): string {
  const workspace = getWorkspacePath();
  return path.join(workspace, '.claude-dash', 'tasks.json');
}

function ensureDir(): void {
  const dir = path.dirname(getTasksPath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readTasks(): TaskData[] {
  const filePath = getTasksPath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeTasks(tasks: TaskData[]): void {
  ensureDir();
  fs.writeFileSync(getTasksPath(), JSON.stringify(tasks, null, 2));
}

export function getAllTasks(filters?: {
  status?: string;
  date?: string;
  assignee?: string;
}): TaskData[] {
  let tasks = readTasks();

  if (filters?.status) {
    tasks = tasks.filter(t => t.status === filters.status);
  }
  if (filters?.date) {
    tasks = tasks.filter(t => t.date === filters.date);
  }
  if (filters?.assignee) {
    tasks = tasks.filter(t => t.assignee === filters.assignee);
  }

  return tasks;
}

export function createTask(data: {
  title: string;
  priority?: string;
  category?: string;
  date?: string;
  deadline?: string | null;
  assignee?: string;
}): TaskData {
  const tasks = readTasks();
  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const today = new Date().toISOString().split('T')[0];

  const task: TaskData = {
    id,
    title: data.title,
    status: 'open',
    date: data.date || today,
    deadline: data.deadline || null,
    priority: (data.priority as TaskData['priority']) || 'medium',
    category: data.category || 'other',
    assignee: (data.assignee as TaskData['assignee']) || 'agent',
    createdAt: new Date().toISOString(),
  };

  tasks.push(task);
  writeTasks(tasks);
  return task;
}

export function updateTask(id: string, data: Partial<TaskData>): TaskData | null {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  const allowed: (keyof TaskData)[] = ['title', 'status', 'date', 'deadline', 'priority', 'category', 'assignee'];
  for (const key of allowed) {
    if (key in data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (tasks[index] as any)[key] = data[key];
    }
  }

  writeTasks(tasks);
  return tasks[index];
}

export function deleteTaskById(id: string): boolean {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  writeTasks(tasks);
  return true;
}

export function getTaskStats(): { total: number; completed: number; currentTask: string | null } {
  const tasks = readTasks();
  const inProgress = tasks.find(t => t.status === 'in_progress');
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    currentTask: inProgress?.title || null,
  };
}

const API_BASE = '/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options;
  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// Status
export function fetchStatus() {
  return apiFetch<{
    name: string;
    version: string;
    uptime: string;
    currentTask: string | null;
    memorySize: string;
    totalTasks: number;
    completedTasks: number;
  }>('/status');
}

// Tasks
export interface Task {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'done';
  date: string;
  deadline: string | null;
  priority: 'high' | 'medium' | 'low';
  category: string;
  assignee: 'agent' | 'me';
}

export function fetchTasks(params?: Record<string, string>) {
  return apiFetch<{ tasks: Task[] }>('/tasks', { params });
}

export function createTask(data: Record<string, unknown>) {
  return apiFetch<{ success: boolean; id: string }>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTask(id: string, data: Partial<Task>) {
  return apiFetch<{ success: boolean; id: string }>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteTask(id: string) {
  return apiFetch<{ success: boolean }>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

// Processes
export interface Process {
  id: string;
  name: string;
  type: 'cron' | 'schedule';
  schedule: string;
  status: 'running' | 'idle';
  lastRun: string | null;
  nextRun: string | null;
  description: string;
}

export function fetchProcesses() {
  return apiFetch<{ processes: Process[] }>('/processes');
}

// Skills
export interface Skill {
  id: string;
  name: string;
  type: 'system' | 'custom';
  active: boolean;
  description: string;
  addedDate: string | null;
  usageCount: number | null;
}

export function fetchSkills() {
  return apiFetch<{ skills: Skill[] }>('/skills');
}

export function fetchSkillContent(name: string) {
  return apiFetch<{ name: string; content: string }>(`/skills/${name}`);
}

export function updateSkillContent(name: string, content: string) {
  return apiFetch<{ success: boolean }>(`/skills/${name}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

// Files
export interface AgentFile {
  name: string;
  path: string;
  category: string;
  size: string;
  modified: string;
}

export function fetchFiles() {
  return apiFetch<{ files: AgentFile[] }>('/files');
}

export function fetchFileContent(path: string) {
  return apiFetch<{ name: string; path: string; content: string }>('/files/content', {
    params: { path },
  });
}

export async function uploadFile(file: File): Promise<{ success: boolean; name: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function deleteFile(path: string) {
  return apiFetch<{ success: boolean }>(`/files/${encodeURIComponent(path)}`, {
    method: 'DELETE',
  });
}

// Settings
export interface Settings {
  agentName: string;
  refreshInterval: number;
  themeIndex: number;
  workspacePath: string;
}

export function fetchSettings() {
  return apiFetch<Settings>('/settings');
}

export function updateSettings(data: Partial<Settings>) {
  return apiFetch<{ success: boolean }>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Health
export function fetchHealth() {
  return apiFetch<{ ok: boolean }>('/health');
}

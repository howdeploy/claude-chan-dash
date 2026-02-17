import fs from 'fs';
import path from 'path';
import { getWorkspacePath } from './config-store';

interface ProcessData {
  id: string;
  name: string;
  type: 'cron' | 'schedule';
  schedule: string;
  status: 'running' | 'idle';
  lastRun: string | null;
  nextRun: string | null;
  description: string;
}

function getCachePath(): string {
  const workspace = getWorkspacePath();
  return path.join(workspace, '.claude-dash', 'cron-cache.json');
}

export function getProcesses(): ProcessData[] {
  const filePath = getCachePath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : data.processes || [];
  } catch {
    return [];
  }
}

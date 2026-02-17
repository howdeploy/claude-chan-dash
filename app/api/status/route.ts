import { NextResponse } from 'next/server';
import { getTaskStats } from '@/lib/services/task-store';
import { getConfig, getStartedAt } from '@/lib/services/config-store';
import { formatUptime } from '@/lib/formatters';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

function getMemorySize(): string {
  const workspace = getConfig().workspacePath;
  let totalBytes = 0;

  const memoryDirs = ['memory', '.learnings', 'notes'];
  for (const dir of memoryDirs) {
    const dirPath = path.join(workspace, dir);
    if (fs.existsSync(dirPath)) {
      try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          try {
            const stat = fs.statSync(path.join(dirPath, file));
            if (stat.isFile()) totalBytes += stat.size;
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }
  }

  // Also count root .md files
  try {
    const rootFiles = fs.readdirSync(workspace);
    for (const file of rootFiles) {
      if (file.endsWith('.md')) {
        try {
          const stat = fs.statSync(path.join(workspace, file));
          if (stat.isFile()) totalBytes += stat.size;
        } catch { /* skip */ }
      }
    }
  } catch { /* skip */ }

  if (totalBytes < 1024) return `${totalBytes} B`;
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
  return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getCpuUsage(): string {
  try {
    const output = execSync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'", { encoding: 'utf-8', timeout: 3000 });
    return `${parseFloat(output).toFixed(1)}%`;
  } catch {
    return '—';
  }
}

function getRamUsage(): string {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const usedGB = (used / (1024 ** 3)).toFixed(1);
  const totalGB = (total / (1024 ** 3)).toFixed(1);
  const pct = ((used / total) * 100).toFixed(0);
  return `${usedGB}/${totalGB} GB (${pct}%)`;
}

function getDiskUsage(): string {
  try {
    const output = execSync("df -h / | awk 'NR==2 {print $3\"/\"$2\" (\"$5\")\"}'", { encoding: 'utf-8', timeout: 3000 });
    return output.trim();
  } catch {
    return '—';
  }
}

function getLoadAvg(): string {
  const load = os.loadavg();
  return `${load[0].toFixed(2)} / ${load[1].toFixed(2)} / ${load[2].toFixed(2)}`;
}

export function GET() {
  const config = getConfig();
  const stats = getTaskStats();

  return NextResponse.json({
    name: config.agentName,
    version: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    uptime: formatUptime(getStartedAt()),
    currentTask: stats.currentTask,
    memorySize: getMemorySize(),
    totalTasks: stats.total,
    completedTasks: stats.completed,
    cpu: getCpuUsage(),
    ram: getRamUsage(),
    disk: getDiskUsage(),
    loadAvg: getLoadAvg(),
  });
}

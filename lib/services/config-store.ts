import fs from 'fs';
import path from 'path';

interface DashConfig {
  agentName: string;
  refreshInterval: number;
  themeIndex: number;
  workspacePath: string;
  startedAt: number;
}

const DEFAULT_CONFIG: DashConfig = {
  agentName: 'Clawdbot',
  refreshInterval: 30000,
  themeIndex: 0,
  workspacePath: process.env.WORKSPACE_PATH || process.env.HOME || '/root',
  startedAt: Date.now(),
};

function getConfigPath(): string {
  const workspace = process.env.WORKSPACE_PATH || process.env.HOME || '/root';
  return path.join(workspace, '.claude-dash', 'config.json');
}

function ensureDir(): void {
  const dir = path.dirname(getConfigPath());
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let cachedConfig: DashConfig | null = null;

export function getConfig(): DashConfig {
  if (cachedConfig) return cachedConfig;

  const filePath = getConfigPath();
  if (!fs.existsSync(filePath)) {
    cachedConfig = { ...DEFAULT_CONFIG };
    saveConfig(cachedConfig);
    return cachedConfig;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    cachedConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    return cachedConfig!;
  } catch {
    cachedConfig = { ...DEFAULT_CONFIG };
    return cachedConfig;
  }
}

export function saveConfig(updates: Partial<DashConfig>): DashConfig {
  ensureDir();
  const current = getConfig();
  const updated = { ...current, ...updates };
  fs.writeFileSync(getConfigPath(), JSON.stringify(updated, null, 2));
  cachedConfig = updated;
  return updated;
}

export function getWorkspacePath(): string {
  return getConfig().workspacePath;
}

export function getStartedAt(): number {
  return getConfig().startedAt;
}

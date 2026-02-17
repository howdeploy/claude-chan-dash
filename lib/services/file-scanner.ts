import fs from 'fs';
import path from 'path';
import { formatFileSize } from '../formatters';
import { getWorkspacePath } from './config-store';

interface FileData {
  name: string;
  path: string;
  category: string;
  size: string;
  modified: string;
}

const EXCLUDED_DIRS = new Set([
  '.credentials', '.venv', 'node_modules', '__pycache__',
  '.git', '.next', 'tmp', '.cache', '.claude-dash',
]);

const EXCLUDED_EXTENSIONS = new Set([
  '.py', '.pyc', '.pyo', '.so', '.o', '.a',
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico',
  '.zip', '.tar', '.gz', '.bz2',
]);

function categorize(relativePath: string, name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (relativePath.startsWith('notes/') || relativePath.startsWith('notes\\')) return 'notes';
  if (relativePath.startsWith('.learnings/') || relativePath.startsWith('learnings/')) return 'learnings';
  if (relativePath.startsWith('memory/')) return 'memory';
  if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) return 'configs';
  if (['.sh', '.bash', '.zsh', '.py', '.js', '.ts'].includes(ext)) return 'scripts';
  if (!relativePath.includes('/') && relativePath.endsWith('.md')) return 'core';
  return 'other';
}

function scanDir(dirPath: string, basePath: string, results: FileData[], depth = 0): void {
  if (depth > 3) return;
  if (!fs.existsSync(dirPath)) return;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') && depth === 0 && entry.name !== '.learnings') continue;
      if (EXCLUDED_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        scanDir(fullPath, basePath, results, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (EXCLUDED_EXTENSIONS.has(ext)) continue;
        if (!ext || ['.md', '.txt', '.json', '.yaml', '.yml', '.toml'].includes(ext)) {
          try {
            const stat = fs.statSync(fullPath);
            results.push({
              name: entry.name,
              path: relativePath,
              category: categorize(relativePath, entry.name),
              size: formatFileSize(stat.size),
              modified: stat.mtime.toISOString(),
            });
          } catch { /* skip files we can't stat */ }
        }
      }
    }
  } catch { /* ignore permission errors */ }
}

export function getFiles(): FileData[] {
  const workspace = getWorkspacePath();
  const results: FileData[] = [];
  scanDir(workspace, workspace, results);
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

export function getFileContent(filePath: string): string | null {
  const workspace = getWorkspacePath();
  // Prevent path traversal
  const resolved = path.resolve(workspace, filePath);
  if (!resolved.startsWith(path.resolve(workspace))) return null;
  // Block credential files
  if (resolved.includes('.credentials')) return null;

  if (!fs.existsSync(resolved)) return null;
  try {
    return fs.readFileSync(resolved, 'utf-8');
  } catch {
    return null;
  }
}

export function deleteFileByPath(filePath: string): boolean {
  const workspace = getWorkspacePath();
  const resolved = path.resolve(workspace, filePath);
  if (!resolved.startsWith(path.resolve(workspace))) return false;
  if (resolved.includes('.credentials')) return false;

  if (!fs.existsSync(resolved)) return false;
  try {
    fs.unlinkSync(resolved);
    return true;
  } catch {
    return false;
  }
}

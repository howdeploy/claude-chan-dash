import fs from 'fs';
import path from 'path';

interface SkillData {
  id: string;
  name: string;
  type: 'system' | 'custom';
  active: boolean;
  description: string;
  addedDate: string | null;
  usageCount: number | null;
}

function scanSkillDir(dirPath: string, type: 'system' | 'custom'): SkillData[] {
  if (!fs.existsSync(dirPath)) return [];

  const skills: SkillData[] = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillMd = path.join(dirPath, entry.name, 'SKILL.md');
      const hasSkillMd = fs.existsSync(skillMd);

      let description = '';
      if (hasSkillMd) {
        try {
          const content = fs.readFileSync(skillMd, 'utf-8');
          const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('---'));
          description = lines[0]?.trim().slice(0, 200) || '';
        } catch { /* ignore */ }
      }

      const stat = fs.statSync(path.join(dirPath, entry.name));

      skills.push({
        id: `skill_${type}_${entry.name}`,
        name: entry.name,
        type,
        active: hasSkillMd,
        description,
        addedDate: stat.birthtime.toISOString().split('T')[0],
        usageCount: null,
      });
    }
  } catch { /* ignore */ }

  return skills;
}

export function getAllSkills(): SkillData[] {
  const homeDir = process.env.HOME || '/root';

  // Custom skills from ~/.claude/skills/
  const customPath = path.join(homeDir, '.claude', 'skills');
  const customSkills = scanSkillDir(customPath, 'custom');

  // System skills from OpenClaw
  const systemPaths = [
    '/usr/lib/node_modules/openclaw/skills',
    '/usr/local/lib/node_modules/openclaw/skills',
    path.join(homeDir, '.openclaw', 'skills'),
  ];

  const systemSkills: SkillData[] = [];
  for (const p of systemPaths) {
    systemSkills.push(...scanSkillDir(p, 'system'));
  }

  return [...systemSkills, ...customSkills];
}

export function getSkillContent(name: string): string | null {
  const homeDir = process.env.HOME || '/root';

  const searchPaths = [
    path.join(homeDir, '.claude', 'skills', name, 'SKILL.md'),
    `/usr/lib/node_modules/openclaw/skills/${name}/SKILL.md`,
    `/usr/local/lib/node_modules/openclaw/skills/${name}/SKILL.md`,
    path.join(homeDir, '.openclaw', 'skills', name, 'SKILL.md'),
  ];

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      try {
        return fs.readFileSync(p, 'utf-8');
      } catch { /* ignore */ }
    }
  }

  return null;
}

export function saveSkillContent(name: string, content: string): boolean {
  const homeDir = process.env.HOME || '/root';

  // Only allow editing custom skills in ~/.claude/skills/
  const skillPath = path.join(homeDir, '.claude', 'skills', name, 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    // Also check system paths (read-only, but file must exist somewhere)
    const systemPaths = [
      `/usr/lib/node_modules/openclaw/skills/${name}/SKILL.md`,
      `/usr/local/lib/node_modules/openclaw/skills/${name}/SKILL.md`,
      path.join(homeDir, '.openclaw', 'skills', name, 'SKILL.md'),
    ];
    for (const p of systemPaths) {
      if (fs.existsSync(p)) {
        try {
          fs.writeFileSync(p, content, 'utf-8');
          return true;
        } catch { return false; }
      }
    }
    return false;
  }

  try {
    fs.writeFileSync(skillPath, content, 'utf-8');
    return true;
  } catch {
    return false;
  }
}

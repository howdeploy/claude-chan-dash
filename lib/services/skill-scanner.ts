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

/** Find system skills installed via npx (clawdbot or openclaw). */
function findNpxSkillPaths(homeDir: string): string[] {
  const npxDir = path.join(homeDir, '.npm', '_npx');
  if (!fs.existsSync(npxDir)) return [];

  const paths: string[] = [];
  try {
    const hashes = fs.readdirSync(npxDir, { withFileTypes: true });
    for (const hash of hashes) {
      if (!hash.isDirectory()) continue;
      for (const pkg of ['clawdbot', 'openclaw']) {
        const skillsDir = path.join(npxDir, hash.name, 'node_modules', pkg, 'skills');
        if (fs.existsSync(skillsDir)) {
          paths.push(skillsDir);
        }
      }
    }
  } catch { /* ignore */ }

  return paths;
}

/** Collect all skill search paths in priority order */
function getSkillSearchPaths(homeDir: string): { custom: string[]; system: string[] } {
  const custom: string[] = [];
  const system: string[] = [];

  // Custom: env override
  if (process.env.CUSTOM_SKILLS_PATH) {
    custom.push(process.env.CUSTOM_SKILLS_PATH);
  }
  // Custom: ~/clawd/skills/ (Clawdbot)
  custom.push(path.join(homeDir, 'clawd', 'skills'));
  // Custom: ~/openclaw/skills/ (OpenClaw)
  custom.push(path.join(homeDir, 'openclaw', 'skills'));
  // Custom: ~/.claude/skills/ (Claude Code native)
  custom.push(path.join(homeDir, '.claude', 'skills'));

  // System: env override
  if (process.env.SYSTEM_SKILLS_PATH) {
    system.push(process.env.SYSTEM_SKILLS_PATH);
  }
  // System: npx-installed clawdbot/openclaw
  system.push(...findNpxSkillPaths(homeDir));
  // System: global npm installs
  system.push(
    '/usr/lib/node_modules/clawdbot/skills',
    '/usr/lib/node_modules/openclaw/skills',
    '/usr/local/lib/node_modules/clawdbot/skills',
    '/usr/local/lib/node_modules/openclaw/skills',
    path.join(homeDir, '.openclaw', 'skills'),
  );

  return { custom, system };
}

export function getAllSkills(): SkillData[] {
  const homeDir = process.env.HOME || '/root';
  const { custom: customPaths, system: systemPaths } = getSkillSearchPaths(homeDir);

  const seen = new Set<string>();
  const result: SkillData[] = [];

  function addUnique(skills: SkillData[]) {
    for (const s of skills) {
      if (!seen.has(s.name)) {
        seen.add(s.name);
        result.push(s);
      }
    }
  }

  // System skills first (higher priority display)
  for (const p of systemPaths) {
    addUnique(scanSkillDir(p, 'system'));
  }

  // Custom skills
  for (const p of customPaths) {
    addUnique(scanSkillDir(p, 'custom'));
  }

  return result;
}

export function getSkillContent(name: string): string | null {
  const homeDir = process.env.HOME || '/root';
  const { custom, system } = getSkillSearchPaths(homeDir);

  const searchPaths = [
    ...custom.map(p => path.join(p, name, 'SKILL.md')),
    ...system.map(p => path.join(p, name, 'SKILL.md')),
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
  const { custom, system } = getSkillSearchPaths(homeDir);

  // Try custom paths first (writable)
  for (const dir of custom) {
    const p = path.join(dir, name, 'SKILL.md');
    if (fs.existsSync(p)) {
      try {
        fs.writeFileSync(p, content, 'utf-8');
        return true;
      } catch { /* not writable, try next */ }
    }
  }

  // Try system paths (usually read-only)
  for (const dir of system) {
    const p = path.join(dir, name, 'SKILL.md');
    if (fs.existsSync(p)) {
      try {
        fs.writeFileSync(p, content, 'utf-8');
        return true;
      } catch { return false; }
    }
  }

  return false;
}

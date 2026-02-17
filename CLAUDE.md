# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server at 127.0.0.1:3000
npm run build        # Production build
npm run start        # Production server at 127.0.0.1:3000
```

No tests or linter configured.

## Architecture

Next.js 16 App Router dashboard for managing an AI assistant. React 19, TypeScript 5.9, Catppuccin Mocha theme (CSS variables, no Tailwind). All UI text is in Russian.

### Layout

`app/layout.tsx` — server component wrapping `ThemeProvider` > `Sidebar` > `Shell` > page content. `AgentationDev` (npm `agentation`) is included for dev-only visual feedback overlay.

Each route follows the pattern: `app/<route>/page.tsx` (server) imports `<Route>Client.tsx` (client component with all logic).

### Pages

- `/` — `OverviewClient`: 3-column grid (today's tasks, running processes, server status) + usage progress bars from `~/.claude/stats-cache.json`
- `/chat` — `ChatClient`: TUI-style monospace chat calling `claude --print` via API
- `/tasks` — Task CRUD with priorities, categories, assignees, dates
- `/processes` — Cron-like process manager
- `/skills` — Skill scanner from `~/.claude/skills/`
- `/files` — Tree view file manager scanning workspace directory
- `/settings` — Agent name, theme selector, workspace path

### Data Layer

No database. All state lives in JSON files under `~/.claude-dash/` (tasks, config, chat history). File scanner reads workspace directory (default `$HOME`). Config cached in memory via `lib/services/config-store.ts`.

Key services in `lib/services/`:
- `config-store.ts` — `~/.claude-dash/config.json`, in-memory cache, `getConfig()`/`saveConfig()`
- `task-store.ts` — `~/.claude-dash/tasks.json`, CRUD operations
- `file-scanner.ts` — recursive workspace scan, categorizes files (core/notes/learnings/memory/configs/scripts)
- `skill-scanner.ts` — reads `~/.claude/skills/` directories for SKILL.md files
- `process-cache.ts` — process definitions and scheduling

### API Routes

All under `app/api/`. Notable patterns:
- `api/chat/route.ts` — calls `claude --print` via `execSync` with `unset CLAUDECODE` to allow nested CLI invocation. 120s timeout.
- `api/status/route.ts` — server metrics via `os` module and shell commands (`top`, `df`)
- `api/usage/route.ts` — reads `~/.claude/stats-cache.json`, computes usage percentages against Max 5x plan limits
- `api/settings/route.ts` — GET/PATCH for config. Sidebar fetches this separately (fast) from heavy endpoints like files

### Styling

Pure CSS in `styles/`. Catppuccin Mocha palette defined in `styles/variables.css`. Theme switching changes `--accent-primary`, `--accent-secondary`, `--accent-tertiary` CSS variables. 15 built-in color themes in `lib/constants.ts`.

Shell is centered: `margin-left: max(var(--sidebar-width), calc((100vw + var(--sidebar-width) - 1100px) / 2))`.

### Sidebar

Fetches agent name from `/api/settings` immediately (separate fast fetch), then counts from heavy endpoints (tasks/processes/skills/files) in parallel. Nav items defined in `lib/constants.ts` `NAV_ITEMS` with `bottom` flag for settings at bottom.

### Key Patterns

- `@/*` path alias maps to project root
- Components in `components/common/` (Card, Badge, Modal, etc.) and `components/tabs/` (page-specific)
- `Header` component shows Moscow time (`Europe/Moscow`) inline next to title
- File categories and colors defined in `lib/constants.ts` (`FILE_CATEGORY_COLORS`, `FILE_CATEGORY_LABELS`)
- Path traversal prevention in file operations via `path.resolve` + `startsWith` check

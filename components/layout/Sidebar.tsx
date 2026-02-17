'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/constants';

interface Counts {
  tasks: number;
  processes: number;
  skills: number;
  files: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({ tasks: 0, processes: 0, skills: 0, files: 0 });
  const [open, setOpen] = useState(false);
  const [agentName, setAgentName] = useState('');

  // Fetch agent name immediately (fast endpoint)
  useEffect(() => {
    fetch('/api/settings').then(r => r.json())
      .then(data => { if (data.agentName) setAgentName(data.agentName); })
      .catch(() => {});
  }, []);

  // Fetch counts separately (slow — files scan)
  useEffect(() => {
    async function load() {
      try {
        const [tasks, processes, skills, files] = await Promise.all([
          fetch('/api/tasks').then(r => r.json()).catch(() => ({ tasks: [] })),
          fetch('/api/processes').then(r => r.json()).catch(() => ({ processes: [] })),
          fetch('/api/skills').then(r => r.json()).catch(() => ({ skills: [] })),
          fetch('/api/files').then(r => r.json()).catch(() => ({ files: [] })),
        ]);
        setCounts({
          tasks: (tasks.tasks || []).filter((t: { status: string }) => t.status !== 'done').length,
          processes: (processes.processes || []).filter((p: { status: string }) => p.status === 'running').length,
          skills: (skills.skills || []).filter((s: { active: boolean }) => s.active).length,
          files: (files.files || []).length,
        });
      } catch {
        // silently fail
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  function getCount(key: string): number | undefined {
    const map: Record<string, number> = {
      tasks: counts.tasks,
      processes: counts.processes,
      skills: counts.skills,
      files: counts.files,
    };
    return map[key] || undefined;
  }

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__title gradient-text">{agentName}</div>
          <div className="sidebar__subtitle">панель управления</div>
          <div className="sidebar__divider" style={{ margin: 'var(--space-sm) 0 0 0' }} />
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.filter(item => !item.bottom).map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`sidebar__link ${isActive(item.href) ? 'sidebar__link--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="sidebar__icon">{item.icon}</span>
              {item.label}
              {getCount(item.key) !== undefined && (
                <span className="sidebar__count">{getCount(item.key)}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar__bottom">
          {NAV_ITEMS.filter(item => item.bottom).map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={`sidebar__link ${isActive(item.href) ? 'sidebar__link--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="sidebar__icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}

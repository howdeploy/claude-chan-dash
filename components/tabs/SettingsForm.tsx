'use client';

import { useState, useEffect } from 'react';
import { fetchSettings, updateSettings, type Settings } from '@/lib/api-client';
import { THEMES } from '@/lib/constants';
import { useTheme } from '@/components/ThemeProvider';
import Card from '@/components/common/Card';
import LoadingState from '@/components/common/LoadingState';

export default function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { themeIndex, setTheme } = useTheme();

  useEffect(() => {
    fetchSettings()
      .then(data => { setSettings(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings({
        agentName: settings.agentName,
        refreshInterval: settings.refreshInterval,
        themeIndex,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState text="Loading settings" />;
  if (!settings) return <div style={{ color: 'var(--overlay0)' }}>Failed to load settings</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: 600 }}>
      <Card label="Agent">
        <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
          <label className="form-label">Имя агента</label>
          <input
            className="form-input"
            value={settings.agentName}
            onChange={e => setSettings({ ...settings, agentName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Интервал обновления (мс)</label>
          <input
            className="form-input"
            type="number"
            min="5000"
            step="5000"
            value={settings.refreshInterval}
            onChange={e => setSettings({ ...settings, refreshInterval: parseInt(e.target.value) || 30000 })}
          />
        </div>
      </Card>

      <Card label="Theme">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 8,
        }}>
          {THEMES.map((theme, i) => (
            <button
              key={i}
              onClick={() => setTheme(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: i === themeIndex ? '1px solid var(--accent-primary)' : '1px solid var(--surface1)',
                background: i === themeIndex ? 'rgba(203, 166, 247, 0.08)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', gap: 3 }}>
                {[theme.primary, theme.secondary, theme.tertiary].map((c, j) => (
                  <span key={j} style={{
                    width: 12, height: 12, borderRadius: '50%', background: c,
                  }} />
                ))}
              </div>
              <span style={{
                fontSize: '0.6875rem',
                color: i === themeIndex ? 'var(--text)' : 'var(--overlay1)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {theme.name}
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Card label="Paths">
        <div className="form-group">
          <label className="form-label">Workspace Path</label>
          <input
            className="form-input"
            value={settings.workspacePath}
            disabled
            style={{ opacity: 0.6 }}
          />
          <small style={{ color: 'var(--overlay0)', fontSize: '0.6875rem' }}>
            Задаётся через WORKSPACE_PATH в .env.local
          </small>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        {saved && (
          <span style={{ color: 'var(--green)', fontSize: '0.8125rem' }}>Saved!</span>
        )}
      </div>
    </div>
  );
}

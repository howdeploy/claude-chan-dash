'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSkills, fetchSkillContent, updateSkillContent, type Skill } from '@/lib/api-client';
import Card from '@/components/common/Card';
import { TypeBadge } from '@/components/common/Badge';
import Modal from '@/components/common/Modal';
import MarkdownView from '@/components/common/MarkdownView';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

export default function SkillGrid() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showType, setShowType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillContent, setSkillContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchSkills();
      setSkills(data.skills || []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function openSkill(skill: Skill) {
    setSelectedSkill(skill);
    setContentLoading(true);
    setSkillContent(null);
    setEditing(false);
    try {
      const data = await fetchSkillContent(skill.name);
      setSkillContent(data.content);
    } catch (e) {
      setSkillContent(`Error loading: ${(e as Error).message}`);
    } finally {
      setContentLoading(false);
    }
  }

  function startEditing() {
    setEditContent(skillContent || '');
    setEditing(true);
  }

  async function saveEdit() {
    if (!selectedSkill) return;
    setSaving(true);
    try {
      await updateSkillContent(selectedSkill.name, editContent);
      setSkillContent(editContent);
      setEditing(false);
    } catch {
      // stay in edit mode on error
    } finally {
      setSaving(false);
    }
  }

  if (loading && skills.length === 0) return <LoadingState text="Loading skills" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  let filtered = showType === 'all' ? skills : skills.filter(s => s.type === showType);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(s => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
  }

  const systemCount = skills.filter(s => s.type === 'system').length;
  const customCount = skills.filter(s => s.type === 'custom').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {selectedSkill && (
        <Modal
          title={
            <>
              <span>{selectedSkill.name}</span>
              <TypeBadge type={selectedSkill.type} />
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: selectedSkill.active ? 'var(--green)' : 'var(--surface2)',
                boxShadow: selectedSkill.active ? '0 0 6px rgba(166, 227, 161, 0.4)' : 'none',
              }} />
              {!contentLoading && skillContent && !editing && (
                <button
                  onClick={startEditing}
                  style={{
                    marginLeft: 'auto', padding: '4px 12px', fontSize: '0.6875rem',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--surface1)',
                    background: 'transparent', color: 'var(--overlay0)', cursor: 'pointer',
                  }}
                >
                  Редактировать
                </button>
              )}
              {editing && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      padding: '4px 12px', fontSize: '0.6875rem',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--surface1)',
                      background: 'transparent', color: 'var(--overlay0)', cursor: 'pointer',
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    style={{
                      padding: '4px 12px', fontSize: '0.6875rem',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-primary)',
                      background: 'rgba(203, 166, 247, 0.1)',
                      color: 'var(--accent-primary)', cursor: 'pointer',
                      opacity: saving ? 0.5 : 1,
                    }}
                  >
                    {saving ? 'Сохраняю...' : 'Сохранить'}
                  </button>
                </div>
              )}
            </>
          }
          onClose={() => { setSelectedSkill(null); setSkillContent(null); setEditing(false); }}
          footer={
            <>
              <span>skills/{selectedSkill.name}/SKILL.md</span>
              {selectedSkill.addedDate && <span>added: {selectedSkill.addedDate}</span>}
            </>
          }
        >
          {contentLoading ? <LoadingState text={`Loading ${selectedSkill.name}/SKILL.md`} /> : (
            editing ? (
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                style={{
                  width: '100%', minHeight: 400, background: 'var(--base)',
                  border: '1px solid var(--surface0)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text)', fontSize: '0.8125rem', fontFamily: 'monospace',
                  padding: 16, resize: 'vertical', outline: 'none', lineHeight: 1.6,
                }}
              />
            ) : (
              skillContent ? <MarkdownView text={skillContent} /> : null
            )
          )}
        </Modal>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'all', label: `Все (${skills.length})` },
            { key: 'system', label: `Системные (${systemCount})` },
            { key: 'custom', label: `Мои (${customCount})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setShowType(f.key)}
              className={`filter-btn ${showType === f.key ? 'filter-btn--active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Поиск скиллов..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="form-input"
          style={{ flex: 1, minWidth: 180, padding: '6px 14px', fontSize: '0.75rem' }}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 12,
      }}>
        {filtered.map(skill => (
          <Card
            key={skill.id}
            clickable
            borderColor={skill.active
              ? (skill.type === 'system' ? 'var(--blue)' : 'var(--accent-primary)')
              : 'var(--surface0)'
            }
            style={{ opacity: skill.active ? 1 : 0.5 }}
            onClick={() => openSkill(skill)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600 }}>{skill.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <TypeBadge type={skill.type} />
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: skill.active ? 'var(--green)' : 'var(--surface2)',
                  boxShadow: skill.active ? '0 0 6px rgba(166, 227, 161, 0.4)' : 'none',
                }} />
              </div>
            </div>
            <div style={{
              fontSize: '0.6875rem', color: 'var(--overlay0)', marginBottom: 10,
              lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {skill.description || '—'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16 }}>
                {skill.usageCount != null && (
                  <div style={{ fontSize: '0.6875rem' }}>
                    <span style={{ color: 'var(--overlay0)' }}>uses: </span>
                    <span style={{ color: 'var(--accent-primary)' }}>{skill.usageCount}</span>
                  </div>
                )}
                {skill.addedDate && (
                  <div style={{ fontSize: '0.6875rem' }}>
                    <span style={{ color: 'var(--overlay0)' }}>added: </span>
                    <span style={{ color: 'var(--overlay1)' }}>{skill.addedDate}</span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: '0.625rem', color: 'var(--surface2)' }}>click to open</span>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--overlay0)', fontSize: '0.8125rem' }}>
          Ничего не найдено
        </div>
      )}
    </div>
  );
}

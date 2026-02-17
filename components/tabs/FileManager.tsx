'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchFiles, fetchFileContent, uploadFile, deleteFile, type AgentFile } from '@/lib/api-client';
import { FILE_CATEGORY_COLORS, FILE_CATEGORY_LABELS } from '@/lib/constants';
import Modal from '@/components/common/Modal';
import MarkdownView from '@/components/common/MarkdownView';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import FileUpload from '@/components/common/FileUpload';

interface TreeNode {
  name: string;
  isDir: boolean;
  path: string;
  file?: AgentFile;
  children: Record<string, TreeNode>;
  fileCount: number;
}

function buildTree(files: AgentFile[]): TreeNode {
  const root: TreeNode = { name: '/', isDir: true, path: '', children: {}, fileCount: 0 };

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          isDir: true,
          path: parts.slice(0, i + 1).join('/'),
          children: {},
          fileCount: 0,
        };
      }
      current = current.children[part];
    }

    const fileName = parts[parts.length - 1];
    current.children[fileName] = {
      name: fileName,
      isDir: false,
      path: file.path,
      file,
      children: {},
      fileCount: 0,
    };
  }

  // Count files in dirs
  function countFiles(node: TreeNode): number {
    if (!node.isDir) return 1;
    let count = 0;
    for (const child of Object.values(node.children)) {
      count += countFiles(child);
    }
    node.fileCount = count;
    return count;
  }
  countFiles(root);

  return root;
}

function sortChildren(children: Record<string, TreeNode>): TreeNode[] {
  return Object.values(children).sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const icons: Record<string, string> = {
    md: '◇', json: '{ }', yaml: '≡', yml: '≡', toml: '≡',
    sh: '›_', bash: '›_', js: 'js', ts: 'ts', txt: '≡',
  };
  return (
    <span style={{
      fontSize: '0.625rem', fontWeight: 700, color: 'var(--overlay0)',
      width: 22, textAlign: 'center', flexShrink: 0, fontFamily: 'monospace',
    }}>
      {icons[ext] || '·'}
    </span>
  );
}

function TreeView({
  node, depth, expanded, toggleExpand, onFileClick, onDelete,
}: {
  node: TreeNode; depth: number;
  expanded: Set<string>; toggleExpand: (path: string) => void;
  onFileClick: (file: AgentFile) => void;
  onDelete: (file: AgentFile, e: React.MouseEvent) => void;
}) {
  const sorted = sortChildren(node.children);
  const isOpen = expanded.has(node.path);

  if (node.isDir && depth > 0) {
    return (
      <>
        <div
          onClick={() => toggleExpand(node.path)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', paddingLeft: depth * 16 + 10,
            cursor: 'pointer', borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem', color: 'var(--text)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: '0.625rem', color: 'var(--overlay0)', width: 12, textAlign: 'center' }}>
            {isOpen ? '▾' : '▸'}
          </span>
          <span style={{ color: 'var(--accent-secondary)' }}>▤</span>
          <span style={{ fontWeight: 600 }}>{node.name}</span>
          <span style={{ fontSize: '0.625rem', color: 'var(--surface2)', marginLeft: 'auto' }}>
            {node.fileCount}
          </span>
        </div>
        {isOpen && sorted.map(child => (
          <TreeView
            key={child.path}
            node={child} depth={depth + 1}
            expanded={expanded} toggleExpand={toggleExpand}
            onFileClick={onFileClick} onDelete={onDelete}
          />
        ))}
      </>
    );
  }

  if (!node.isDir && node.file) {
    const color = FILE_CATEGORY_COLORS[node.file.category] || FILE_CATEGORY_COLORS.other;
    return (
      <div
        onClick={() => onFileClick(node.file!)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 10px', paddingLeft: depth * 16 + 10,
          cursor: 'pointer', borderRadius: 'var(--radius-md)',
          fontSize: '0.75rem', transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(203, 166, 247, 0.03)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <FileIcon name={node.name} />
        <span style={{ color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
        <span style={{ fontSize: '0.5625rem', color, opacity: 0.7 }}>
          {FILE_CATEGORY_LABELS[node.file.category] || ''}
        </span>
        <span style={{ fontSize: '0.625rem', color: 'var(--surface2)' }}>{node.file.size}</span>
        <button
          onClick={(e) => onDelete(node.file!, e)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--surface2)', fontSize: '0.625rem', padding: '2px 4px',
            borderRadius: 'var(--radius-sm)', transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--surface2)')}
          title="Удалить"
        >
          ✕
        </button>
      </div>
    );
  }

  // Root level — render children directly
  return (
    <>
      {sorted.map(child => (
        <TreeView
          key={child.path}
          node={child} depth={depth}
          expanded={expanded} toggleExpand={toggleExpand}
          onFileClick={onFileClick} onDelete={onDelete}
        />
      ))}
    </>
  );
}

export default function FileManager() {
  const [files, setFiles] = useState<AgentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedFile, setSelectedFile] = useState<AgentFile | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const data = await fetchFiles();
      setFiles(data.files || []);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() =>
    categoryFilter === 'all' ? files : files.filter(f => f.category === categoryFilter),
    [files, categoryFilter]
  );

  const tree = useMemo(() => buildTree(filtered), [filtered]);

  // Auto-expand first level dirs
  useEffect(() => {
    const firstLevel = Object.values(tree.children)
      .filter(n => n.isDir)
      .map(n => n.path);
    setExpanded(new Set(firstLevel));
  }, [tree]);

  function toggleExpand(p: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  }

  async function openFile(file: AgentFile) {
    setSelectedFile(file);
    setContentLoading(true);
    setFileContent(null);
    try {
      const data = await fetchFileContent(file.path);
      setFileContent(data.content || 'Файл пуст');
    } catch {
      setFileContent('Ошибка загрузки файла');
    } finally {
      setContentLoading(false);
    }
  }

  async function handleDelete(file: AgentFile, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Удалить ${file.name}?`)) return;
    try {
      await deleteFile(file.path);
      load();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpload(file: File) {
    await uploadFile(file);
    load();
  }

  if (loading && files.length === 0) return <LoadingState text="Загрузка файлов" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const categoryCounts: Record<string, number> = {};
  files.forEach(f => { categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1; });

  // Count dirs
  const dirSet = new Set<string>();
  files.forEach(f => {
    const parts = f.path.split('/');
    if (parts.length > 1) dirSet.add(parts[0]);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {selectedFile && (
        <Modal
          title={<><FileIcon name={selectedFile.name} /> {selectedFile.name}</>}
          onClose={() => { setSelectedFile(null); setFileContent(null); }}
          footer={
            <>
              <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}>{selectedFile.path}</span>
              <span>{selectedFile.size}</span>
            </>
          }
        >
          {contentLoading ? <LoadingState text="Загрузка" /> : (
            <MarkdownView text={fileContent || ''} />
          )}
        </Modal>
      )}

      <FileUpload onUpload={handleUpload} />

      {/* Категории */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`filter-btn ${categoryFilter === 'all' ? 'filter-btn--active' : ''}`}
        >
          Все ({files.length})
        </button>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`filter-btn ${categoryFilter === 'all' ? '' : ''}`}
          style={{ pointerEvents: 'none', background: 'none', border: 'none', color: 'var(--surface2)', fontSize: '0.6875rem' }}
        >
          ▤ {dirSet.size} папок
        </button>
        {Object.entries(FILE_CATEGORY_LABELS).map(([key, label]) => {
          const count = categoryCounts[key] || 0;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`filter-btn ${categoryFilter === key ? 'filter-btn--active' : ''}`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Дерево файлов */}
      <div style={{
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid var(--surface0)',
        borderRadius: 'var(--radius-lg)',
        padding: '8px 0',
        maxHeight: 600,
        overflow: 'auto',
      }}>
        <TreeView
          node={tree} depth={0}
          expanded={expanded} toggleExpand={toggleExpand}
          onFileClick={openFile} onDelete={handleDelete}
        />
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--overlay0)', fontSize: '0.8125rem' }}>
          Нет файлов
        </div>
      )}
    </div>
  );
}

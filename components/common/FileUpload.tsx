'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_SIZE } from '@/lib/constants';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validate(file: File): string | null {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext)) {
      return `Разрешены только: ${ALLOWED_UPLOAD_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      return 'Максимальный размер: 10 MB';
    }
    return null;
  }

  async function handleFile(file: File) {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await onUpload(file);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <div
        className={`upload-zone ${dragging ? 'upload-zone--active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div style={{ fontSize: '2rem', opacity: 0.5 }}>📄</div>
        <div className="upload-zone__text">
          {uploading ? 'Загрузка...' : 'Перетащите файл или нажмите'}
        </div>
        <div className="upload-zone__hint">
          {ALLOWED_UPLOAD_EXTENSIONS.join(', ')} — до 10 MB
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_UPLOAD_EXTENSIONS.join(',')}
        onChange={onChange}
        style={{ display: 'none' }}
      />
      {error && (
        <div style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: 'var(--space-sm)' }}>
          {error}
        </div>
      )}
    </div>
  );
}

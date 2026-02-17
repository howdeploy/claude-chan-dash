'use client';

import Header from '@/components/layout/Header';
import FileManager from '@/components/tabs/FileManager';

export default function FilesClient() {
  return (
    <>
      <Header title="Файлы" />
      <FileManager />
    </>
  );
}

'use client';

import Header from '@/components/layout/Header';
import ProcessList from '@/components/tabs/ProcessList';

export default function ProcessesClient() {
  return (
    <>
      <Header title="Процессы" />
      <ProcessList />
    </>
  );
}

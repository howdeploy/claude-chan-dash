'use client';

import { ReactNode } from 'react';

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="shell">
      {children}
    </main>
  );
}

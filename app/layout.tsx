import type { Metadata } from 'next';
import ThemeProvider from '@/components/ThemeProvider';
import Sidebar from '@/components/layout/Sidebar';
import Shell from '@/components/layout/Shell';
import { AgentationDev } from '@/components/AgentationDev';
import '@/styles/variables.css';
import '@/styles/reset.css';
import '@/styles/typography.css';
import '@/styles/animations.css';
import '@/styles/theme.css';
import '@/styles/components/card.css';
import '@/styles/components/badge.css';
import '@/styles/components/button.css';
import '@/styles/components/modal.css';
import '@/styles/components/sidebar.css';
import '@/styles/components/form.css';
import '@/styles/components/file-manager.css';
import '@/styles/layout.css';

export const metadata: Metadata = {
  title: 'Clawdbot Dashboard',
  description: 'AI Agent Dashboard — Catppuccin Mocha',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <ThemeProvider>
          <Sidebar />
          <Shell>{children}</Shell>
          <AgentationDev />
        </ThemeProvider>
      </body>
    </html>
  );
}

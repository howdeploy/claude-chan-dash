'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { THEMES } from '@/lib/constants';

interface ThemeContextType {
  themeIndex: number;
  themeName: string;
  setTheme: (index: number) => void;
  nextTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeIndex: 0,
  themeName: THEMES[0].name,
  setTheme: () => {},
  nextTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeIndex, setThemeIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('dash-theme-index');
    if (saved) {
      const idx = parseInt(saved, 10);
      if (idx >= 0 && idx < THEMES.length) {
        setThemeIndex(idx);
        applyTheme(idx);
      }
    }
  }, []);

  function applyTheme(index: number) {
    const theme = THEMES[index];
    const root = document.documentElement;
    root.style.setProperty('--accent-primary', theme.primary);
    root.style.setProperty('--accent-secondary', theme.secondary);
    root.style.setProperty('--accent-tertiary', theme.tertiary);
  }

  const setTheme = useCallback((index: number) => {
    if (index < 0 || index >= THEMES.length) return;
    setThemeIndex(index);
    applyTheme(index);
    localStorage.setItem('dash-theme-index', String(index));
  }, []);

  const nextTheme = useCallback(() => {
    const next = (themeIndex + 1) % THEMES.length;
    setTheme(next);
  }, [themeIndex, setTheme]);

  return (
    <ThemeContext.Provider value={{
      themeIndex,
      themeName: THEMES[themeIndex].name,
      setTheme,
      nextTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

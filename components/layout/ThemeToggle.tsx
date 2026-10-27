'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme(): [Theme, () => void] {
  const { resolvedTheme, setTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = (mounted && resolvedTheme === 'dark' ? 'dark' : 'light') as Theme;

  const toggle = useCallback(() => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }, [currentTheme, setTheme]);

  return [currentTheme, toggle];
}

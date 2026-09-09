'use client';

import { useEffect } from 'react';

export default function ThemeLoader() {
  useEffect(() => {
    const bg   = localStorage.getItem('theme_bg')   ?? '#030711';
    const text = localStorage.getItem('theme_text') ?? '#F1F5F9';
    document.documentElement.style.setProperty('--bg', bg);
    document.documentElement.style.setProperty('--text', text);
  }, []);
  return null;
}

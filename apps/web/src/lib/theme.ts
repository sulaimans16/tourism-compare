import { useEffect, useState } from 'react';

export type ThemeChoice = 'system' | 'light' | 'dark';

function read(): ThemeChoice {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

/** System / light / dark, stored per browser. "system" removes data-theme so prefers-color-scheme applies. */
export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(read);
  useEffect(() => {
    const root = document.documentElement;
    if (choice === 'system') delete root.dataset.theme;
    else root.dataset.theme = choice;
    try {
      if (choice === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', choice);
    } catch {
      /* storage unavailable: theme still applies for this visit */
    }
  }, [choice]);
  const next = () => setChoice((c) => (c === 'system' ? 'light' : c === 'light' ? 'dark' : 'system'));
  return { choice, next };
}

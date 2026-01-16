/**
 * Theme Context - Global dark/light mode state
 * Persists user preference to localStorage
 */

import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'crossview_theme_mode';

const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  toggleMode: () => {},
  setMode: () => {},
});

export function ThemeModeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
      // Check system preference
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  const toggleMode = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setMode = (newMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setModeState(newMode);
    }
  };

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      toggleMode,
      setMode,
    }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
}

export default ThemeContext;

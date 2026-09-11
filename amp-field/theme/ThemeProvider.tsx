import { createContext, type ReactNode, useContext, useMemo } from 'react';

import { darkTheme, type Theme, type ThemeName, themes } from './theme';

const ThemeContext = createContext<Theme>(darkTheme);

export type ThemeProviderProps = {
  readonly children: ReactNode;
  /** Overridable so tests and future settings can select a theme. */
  readonly name?: ThemeName;
};

export function ThemeProvider({ children, name = 'dark' }: ThemeProviderProps) {
  const theme = useMemo(() => themes[name], [name]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

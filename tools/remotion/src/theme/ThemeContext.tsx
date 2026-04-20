// tools/remotion/src/theme/ThemeContext.tsx
import { createContext, useContext, type FC, type ReactNode } from 'react';
import type { Theme } from '@theme/types';
import { defaultTheme } from '@theme/colors';

const ThemeContext = createContext<Theme>(defaultTheme);

type ProviderProps = { theme: Theme; children: ReactNode };

export const ThemeProvider: FC<ProviderProps> = ({ theme, children }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);

export const useTheme = (): Theme => useContext(ThemeContext);

// shared/theme/colors.ts
import type { Theme } from './types';

export const defaultTheme = {
  bg: '#0c0c0f',
  bgElevated: '#141419',
  bgSurface: '#1a1a22',
  bgHover: '#22222d',
  border: '#2a2a36',
  borderBright: '#3a3a4a',
  text: '#e8e8ed',
  textMuted: '#8888a0',
  textDim: '#55556a',
  accent: '#38bdf8',
  accentDim: '#0c4a6e',
  accentBright: '#7dd3fc',
  warn: '#fbbf24',
  error: '#f87171',
  chunks: ['#38bdf880', '#818cf880', '#fbbf2480', '#f472b680', '#6ee7b780'] as const,
} as const satisfies Theme;

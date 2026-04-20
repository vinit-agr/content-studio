// shared/theme/projects/cx-agent-evals.ts
import type { Theme } from '../types';
import { defaultTheme } from '../colors';

export const cxAgentEvalsTheme = {
  ...defaultTheme,
  accent: '#6ee7b7', // mint green — HANDOFF reference palette
  accentDim: '#2d6b54',
  accentBright: '#a7f3d0',
  chunks: ['#6ee7b780', '#818cf880', '#fbbf2480', '#f472b680', '#38bdf880'] as const,
} as const satisfies Theme;

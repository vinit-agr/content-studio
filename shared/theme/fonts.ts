// shared/theme/fonts.ts
import { loadFont } from '@remotion/google-fonts/JetBrainsMono';

export const fontFamily = 'JetBrains Mono';
export const monoStack = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";

let loaded = false;

export const loadFonts = (): void => {
  if (loaded) return;
  loadFont();
  loaded = true;
};

// shared/theme/types.ts
export type Theme = {
  readonly bg: string;
  readonly bgElevated: string;
  readonly bgSurface: string;
  readonly bgHover: string;
  readonly border: string;
  readonly borderBright: string;
  readonly text: string;
  readonly textMuted: string;
  readonly textDim: string;
  readonly accent: string;
  readonly accentDim: string;
  readonly accentBright: string;
  readonly warn: string;
  readonly error: string;
  readonly chunks: readonly [string, string, string, string, string];
};

export type ChunkIndex = 0 | 1 | 2 | 3 | 4;

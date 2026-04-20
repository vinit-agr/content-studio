// tools/remotion/src/compositions/chunk-vs-span/thumbnail.tsx
import type { FC } from 'react';
import { TitleCard } from '@primitives';

export const ChunkVsSpanThumbnail: FC = () => (
  <TitleCard
    title="Chunk vs Span"
    subtitle="character-level beats chunk-level"
    align="center"
    enter="none"
  />
);

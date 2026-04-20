// tools/remotion/src/compositions/chunk-vs-span/scenes/01-intro.tsx
import type { FC } from 'react';
import { Caption, TitleCard } from '@primitives';
import { CAPTIONS } from '../captions';

export const IntroScene: FC = () => (
  <>
    <TitleCard title="Chunk vs Span" subtitle="Intro — 0:00–0:05" enter="fade" />
    <Caption text={CAPTIONS.intro} position="bottom" />
  </>
);

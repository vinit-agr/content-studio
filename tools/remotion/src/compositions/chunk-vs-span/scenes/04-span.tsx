// tools/remotion/src/compositions/chunk-vs-span/scenes/04-span.tsx
import type { FC } from 'react';
import { Caption, TitleCard } from '@primitives';
import { CAPTIONS } from '../captions';

export const SpanScene: FC = () => (
  <>
    <TitleCard title="The Answer Span" subtitle="0:30–0:40 — character-level" enter="fade" />
    <Caption text={CAPTIONS.span} position="bottom" />
  </>
);

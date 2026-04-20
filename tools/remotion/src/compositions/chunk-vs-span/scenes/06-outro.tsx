// tools/remotion/src/compositions/chunk-vs-span/scenes/06-outro.tsx
import type { FC } from 'react';
import { Caption, TitleCard } from '@primitives';
import { CAPTIONS } from '../captions';

export const OutroScene: FC = () => (
  <>
    <TitleCard title="github.com/vinit-agr/cx-agent-evals" subtitle="1:10–1:30" enter="fade" />
    <Caption text={CAPTIONS.outro} position="bottom" />
  </>
);

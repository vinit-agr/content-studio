// tools/remotion/src/compositions/chunk-vs-span/scenes/05-comparison.tsx
import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Caption, MetricBar, TitleCard } from '@primitives';
import { CAPTIONS } from '../captions';

export const ComparisonScene: FC = () => (
  <AbsoluteFill style={{ padding: 96 }}>
    <TitleCard title="Chunk vs Span Recall" subtitle="0:40–1:10" enter="fade" />
    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 96,
        right: 96,
        display: 'flex',
        flexDirection: 'column',
        gap: 48,
      }}
    >
      <MetricBar label="Chunk-level recall" value={1.0} color="accent" />
      <MetricBar label="Span-level recall" value={0.4} color="warn" />
    </div>
    <Caption text={CAPTIONS.comparison} position="bottom" />
  </AbsoluteFill>
);

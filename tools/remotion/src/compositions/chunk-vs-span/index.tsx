// tools/remotion/src/compositions/chunk-vs-span/index.tsx
import type { FC } from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { useTheme } from '../../theme';
import { SCENES } from './frames';
import { IntroScene } from './scenes/01-intro';
import { DocumentScene } from './scenes/02-document';
import { ChunkingScene } from './scenes/03-chunking';
import { SpanScene } from './scenes/04-span';
import { ComparisonScene } from './scenes/05-comparison';
import { OutroScene } from './scenes/06-outro';

export { TOTAL_DURATION_FRAMES } from './frames';

export const ChunkVsSpan: FC = () => {
  const theme = useTheme();
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <Sequence from={SCENES.intro.start} durationInFrames={SCENES.intro.duration}>
        <IntroScene />
      </Sequence>
      <Sequence from={SCENES.document.start} durationInFrames={SCENES.document.duration}>
        <DocumentScene />
      </Sequence>
      <Sequence from={SCENES.chunking.start} durationInFrames={SCENES.chunking.duration}>
        <ChunkingScene />
      </Sequence>
      <Sequence from={SCENES.span.start} durationInFrames={SCENES.span.duration}>
        <SpanScene />
      </Sequence>
      <Sequence from={SCENES.comparison.start} durationInFrames={SCENES.comparison.duration}>
        <ComparisonScene />
      </Sequence>
      <Sequence from={SCENES.outro.start} durationInFrames={SCENES.outro.duration}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};

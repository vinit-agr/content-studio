// tools/remotion/src/compositions/chunk-vs-span/scenes/02-document.tsx
import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Caption, Document, TitleCard } from '@primitives';
import { SAMPLE_DOCUMENT } from '@shared/assets/data/sample-document';
import { CAPTIONS } from '../captions';

export const DocumentScene: FC = () => (
  <AbsoluteFill style={{ padding: 96, backgroundColor: 'transparent' }}>
    <TitleCard title="The Document" subtitle="0:05–0:15" enter="fade" />
    <div style={{ position: 'absolute', top: 360, left: 96, right: 96 }}>
      <Document
        text={SAMPLE_DOCUMENT}
        reveal="byWord"
        revealStartFrame={15}
        revealDurationFrames={240}
      />
    </div>
    <Caption text={CAPTIONS.document} position="bottom" />
  </AbsoluteFill>
);

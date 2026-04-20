// tools/remotion/src/compositions/chunk-vs-span/scenes/03-chunking.tsx
import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Caption, Chunk, TitleCard } from '@primitives';
import { SAMPLE_DOCUMENT } from '@shared/assets/data/sample-document';
import { CAPTIONS } from '../captions';

// Naive chunking for the placeholder visual: split by sentence.
const CHUNKS = SAMPLE_DOCUMENT.split('. ')
  .filter((s) => s.trim().length > 0)
  .map((s, i, arr) => (i < arr.length - 1 ? `${s}.` : s));

export const ChunkingScene: FC = () => (
  <AbsoluteFill style={{ padding: 96 }}>
    <TitleCard title="Chunking" subtitle="0:15–0:30" enter="fade" />
    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 96,
        right: 96,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {CHUNKS.map((text, i) => (
        <Chunk key={i} index={i} text={text} label={`C${i + 1}`} />
      ))}
    </div>
    <Caption text={CAPTIONS.chunking} position="bottom" />
  </AbsoluteFill>
);

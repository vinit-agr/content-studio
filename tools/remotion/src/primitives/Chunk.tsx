// tools/remotion/src/primitives/Chunk.tsx
// STUB: shows the chunk index + text with a palette-matched border.
// Upgrade: animate into existence when the containing chunk is "retrieved".
import type { CSSProperties, FC } from 'react';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type ChunkProps = {
  index: number;
  text: string;
  label?: string;
  style?: CSSProperties;
};

export const Chunk: FC<ChunkProps> = ({ index, text, label, style }) => {
  const theme = useTheme();
  const color = theme.chunks[index % 5] ?? theme.accent;
  return (
    <div
      style={{
        border: `2px dashed ${color}`,
        padding: '12px 16px',
        fontFamily: monoStack,
        color: theme.text,
        ...style,
      }}
    >
      <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 4 }}>
        {label ?? `stub:Chunk[${index}]`}
      </div>
      <div style={{ fontSize: 20 }}>{text}</div>
    </div>
  );
};

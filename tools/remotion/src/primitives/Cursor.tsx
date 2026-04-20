// tools/remotion/src/primitives/Cursor.tsx
// STUB: blinking terminal-style cursor; will sync to narration beats later.
import type { CSSProperties, FC } from 'react';
import { useCurrentFrame } from 'remotion';
import { useTheme } from '../theme';

export type CursorProps = {
  blinking?: boolean;
  style?: CSSProperties;
};

export const Cursor: FC<CursorProps> = ({ blinking = true, style }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const visible = !blinking || Math.floor(frame / 15) % 2 === 0;
  return (
    <span
      data-stub="Cursor"
      style={{
        display: 'inline-block',
        width: 12,
        height: 24,
        background: theme.accent,
        opacity: visible ? 1 : 0,
        verticalAlign: 'text-bottom',
        ...style,
      }}
    />
  );
};

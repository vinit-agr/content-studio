// tools/remotion/src/primitives/Span.tsx
// STUB: highlights a character span inline.
// Upgrade: implement spanGlow easing on the highlight.
import type { CSSProperties, FC } from 'react';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type SpanProps = {
  text: string;
  glow?: boolean;
  style?: CSSProperties;
};

export const Span: FC<SpanProps> = ({ text, glow = false, style }) => {
  const theme = useTheme();
  return (
    <span
      data-stub="Span"
      data-glow={glow}
      style={{
        fontFamily: monoStack,
        borderBottom: `2px dashed ${theme.accent}`,
        padding: '0 2px',
        color: theme.text,
        ...style,
      }}
    >
      {text}
    </span>
  );
};

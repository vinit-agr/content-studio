// tools/remotion/src/primitives/Token.tsx
// STUB: renders a single token; will animate per-token reveal later.
import type { CSSProperties, FC } from 'react';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type TokenProps = {
  text: string;
  highlighted?: boolean;
  style?: CSSProperties;
};

export const Token: FC<TokenProps> = ({ text, highlighted = false, style }) => {
  const theme = useTheme();
  return (
    <span
      data-stub="Token"
      style={{
        fontFamily: monoStack,
        color: highlighted ? theme.accent : theme.text,
        border: `1px dashed ${highlighted ? theme.accent : theme.border}`,
        padding: '0 4px',
        marginRight: 4,
        ...style,
      }}
    >
      {text}
    </span>
  );
};

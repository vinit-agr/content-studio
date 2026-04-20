// tools/remotion/src/primitives/Document.tsx
import type { CSSProperties, FC } from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type DocumentProps = {
  text: string;
  reveal?: 'instant' | 'byChar' | 'byWord';
  revealStartFrame?: number;
  revealDurationFrames?: number;
  style?: CSSProperties;
};

export const Document: FC<DocumentProps> = ({
  text,
  reveal = 'instant',
  revealStartFrame = 0,
  revealDurationFrames,
  style,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();

  let visibleText = text;
  if (reveal !== 'instant') {
    if (revealDurationFrames === undefined) {
      throw new Error(`Document: revealDurationFrames is required when reveal="${reveal}"`);
    }
    const units = reveal === 'byChar' ? [...text] : text.split(/(\s+)/);
    const count = Math.floor(
      interpolate(frame - revealStartFrame, [0, revealDurationFrames], [0, units.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
    visibleText = units.slice(0, count).join('');
  }

  return (
    <div
      style={{
        color: theme.text,
        fontFamily: monoStack,
        fontSize: 28,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        maxWidth: 1400,
        ...style,
      }}
    >
      {visibleText}
    </div>
  );
};

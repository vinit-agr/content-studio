// tools/remotion/src/primitives/Caption.tsx
import type { CSSProperties, FC } from 'react';
import { useCurrentFrame } from 'remotion';
import { monoStack } from '@theme/fonts';
import { fadeIn, slideIn } from '@theme/easings';
import { useTheme } from '../theme';

export type CaptionProps = {
  text: string;
  position?: 'bottom' | 'top' | 'inline';
  enter?: 'fade' | 'slide' | 'none';
  style?: CSSProperties;
};

export const Caption: FC<CaptionProps> = ({
  text,
  position = 'bottom',
  enter = 'slide',
  style,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const entrance = enter === 'fade' ? fadeIn(frame, 0) : enter === 'slide' ? slideIn(frame, 0) : {};

  const positional: CSSProperties =
    position === 'bottom'
      ? { position: 'absolute', bottom: 96, left: 96, right: 96 }
      : position === 'top'
        ? { position: 'absolute', top: 96, left: 96, right: 96 }
        : {};

  return (
    <div
      style={{
        ...positional,
        color: theme.text,
        fontFamily: monoStack,
        fontSize: 32,
        lineHeight: 1.5,
        backgroundColor: position === 'inline' ? 'transparent' : `${theme.bgElevated}cc`,
        padding: position === 'inline' ? 0 : '16px 24px',
        borderRadius: position === 'inline' ? 0 : 8,
        border: position === 'inline' ? 'none' : `1px solid ${theme.border}`,
        ...entrance,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// tools/remotion/src/primitives/TitleCard.tsx
import type { CSSProperties, FC } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { monoStack } from '@theme/fonts';
import { fadeIn, slideIn } from '@theme/easings';
import { useTheme } from '../theme';

export type TitleCardProps = {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  enter?: 'fade' | 'slide' | 'none';
  style?: CSSProperties;
  className?: string;
};

export const TitleCard: FC<TitleCardProps> = ({
  title,
  subtitle,
  align = 'center',
  enter = 'fade',
  style,
  className,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const entrance = enter === 'fade' ? fadeIn(frame, 0) : enter === 'slide' ? slideIn(frame, 0) : {};

  const centered = align === 'center';

  return (
    <AbsoluteFill
      className={className}
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: monoStack,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: centered ? 'center' : 'flex-start',
        padding: centered ? 0 : 120,
        ...entrance,
        ...style,
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700, color: theme.accent, letterSpacing: -1 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 32, color: theme.textMuted, marginTop: 24 }}>{subtitle}</div>
      )}
    </AbsoluteFill>
  );
};

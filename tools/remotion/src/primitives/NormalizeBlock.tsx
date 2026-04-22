// tools/remotion/src/primitives/NormalizeBlock.tsx
import type { FC } from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type NormalizeBlockProps = {
  appearFrame: number;
  activateFrame: number;
  fadeFrame: number;
  top?: string;
  left?: string;
  width?: string;
  height?: string;
};

export const NormalizeBlock: FC<NormalizeBlockProps> = ({
  appearFrame,
  activateFrame,
  fadeFrame,
  top = '34%',
  left = '38%',
  width = '22%',
  height = '32%',
}) => {
  const frame = useCurrentFrame();
  const theme = useTheme();

  const opacity = interpolate(
    frame,
    [
      appearFrame,
      appearFrame + 18,
      activateFrame,
      activateFrame + 12,
      fadeFrame,
      fadeFrame + 24,
    ],
    [0, 0.9, 1.0, 0.92, 0.85, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const scale = interpolate(
    frame,
    [activateFrame - 6, activateFrame, activateFrame + 12],
    [1, 1.02, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const glow = interpolate(
    frame,
    [activateFrame - 6, activateFrame, activateFrame + 12, fadeFrame],
    [0, 1, 0.45, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const boxShadow =
    glow > 0
      ? `0 0 ${42 * glow}px ${6 * glow}px rgba(110,231,183,${0.35 * glow})`
      : 'none';

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        border: `2px dashed ${theme.accent}`,
        borderRadius: 14,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.accent,
        fontFamily: monoStack,
        opacity,
        transform: `scale(${scale})`,
        boxShadow,
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '0.01em' }}>
        normalize
      </div>
      <div
        style={{
          fontSize: 16,
          marginTop: 10,
          color: theme.accent,
          opacity: 0.55,
          letterSpacing: '0.02em',
        }}
      >
        strip formatting · keep structure
      </div>
    </div>
  );
};

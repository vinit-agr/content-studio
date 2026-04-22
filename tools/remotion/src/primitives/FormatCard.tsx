// tools/remotion/src/primitives/FormatCard.tsx
import type { FC } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { monoStack } from '@theme/fonts';

export type FormatCardProps = {
  format: string;
  example: string;
  color: string;
  textColor?: string;
  top: string;
  left?: string;
  width?: string;
  height?: string;
  enterFrame: number;
  flowStartFrame: number;
  targetXPx?: number;
};

const ENTER_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);
const FLIGHT_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);

export const FormatCard: FC<FormatCardProps> = ({
  format,
  example,
  color,
  textColor = '#0c0c0f',
  top,
  left = '6%',
  width = '18%',
  height = '12%',
  enterFrame,
  flowStartFrame,
  targetXPx = 500,
}) => {
  const frame = useCurrentFrame();

  const eLocal = frame - enterFrame;
  const opacityEnter = interpolate(eLocal, [0, 9], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ENTER_EASING,
  });
  const enterTx = interpolate(eLocal, [0, 18, 24], [-80, 8, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ENTER_EASING,
  });

  const fLocal = frame - flowStartFrame;
  const flightX = interpolate(fLocal, [0, 42, 54], [0, 0.78, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: FLIGHT_EASING,
  });
  const flightOpacity = interpolate(fLocal, [0, 36, 54], [1, 0.75, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flightBlur = interpolate(fLocal, [0, 36, 54], [0, 0.4, 1.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const inFlight = frame >= flowStartFrame;
  const opacity = inFlight ? flightOpacity : opacityEnter;
  const transform = inFlight
    ? `translateX(${flightX * targetXPx}px)`
    : `translateX(${enterTx}px)`;
  const filter = inFlight ? `blur(${flightBlur}px)` : 'none';

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: monoStack,
        backgroundColor: color,
        color: textColor,
        boxShadow: '0 10px 30px -12px rgba(0,0,0,0.5)',
        opacity,
        transform,
        filter,
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.02em' }}>
        {format}
      </div>
      <div style={{ fontSize: 17, fontWeight: 500, marginTop: 8, opacity: 0.78 }}>
        {example}
      </div>
    </div>
  );
};

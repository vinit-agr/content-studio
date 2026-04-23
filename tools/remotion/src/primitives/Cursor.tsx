// tools/remotion/src/primitives/Cursor.tsx
// OS-style arrow cursor that travels between two points and dips on click.
import type { FC } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';

export type CursorPoint = {
  x: string;
  y: string;
};

export type CursorProps = {
  from: CursorPoint;
  to: CursorPoint;
  startFrame: number;
  arriveFrame: number;
  clickFrame?: number;
  fadeOutFrame?: number;
  size?: number;
};

const MOTION_EASING = Easing.bezier(0.35, 0.1, 0.3, 1);

export const Cursor: FC<CursorProps> = ({
  from,
  to,
  startFrame,
  arriveFrame,
  clickFrame,
  fadeOutFrame,
  size = 44,
}) => {
  const frame = useCurrentFrame();

  let opacity = interpolate(frame, [startFrame, startFrame + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fadeOutFrame !== undefined) {
    const fadeOut = interpolate(frame, [fadeOutFrame, fadeOutFrame + 6], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    opacity = Math.min(opacity, fadeOut);
  }

  const progress = interpolate(frame, [startFrame, arriveFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: MOTION_EASING,
  });

  // linear interp between two CSS length strings via calc
  const t = progress;
  const leftCss = `calc(${from.x} * ${1 - t} + ${to.x} * ${t})`;
  const topCss = `calc(${from.y} * ${1 - t} + ${to.y} * ${t})`;

  let scale = 1;
  if (clickFrame !== undefined) {
    scale = interpolate(
      frame,
      [clickFrame - 1, clickFrame, clickFrame + 2],
      [1, 0.9, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: leftCss,
        top: topCss,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 5,
        opacity,
        transform: `scale(${scale})`,
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 2 L3 18 L7.5 14.5 L10 21 L13 20 L10.5 13.5 L17 13 Z"
          fill="#e8e8ed"
          stroke="#0c0c0f"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

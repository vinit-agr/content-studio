// shared/theme/easings.ts
import type { CSSProperties } from 'react';
import { interpolate } from 'remotion';

export type EasingFn = (currentFrame: number, startFrame: number) => CSSProperties;

const FADE_IN_FRAMES = 9; // ~0.3s @ 30fps
const SLIDE_IN_FRAMES = 8; // ~0.25s @ 30fps
const PULSE_DOT_FRAMES = 42; // 1.4s @ 30fps
const SPAN_GLOW_FRAMES = 60; // 2s @ 30fps

export const fadeIn: EasingFn = (frame, start) => {
  const progress = interpolate(frame - start, [0, FADE_IN_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {
    opacity: progress,
    transform: `translateY(${(1 - progress) * 6}px)`,
  };
};

export const slideIn: EasingFn = (frame, start) => {
  const progress = interpolate(frame - start, [0, SLIDE_IN_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return {
    opacity: progress,
    transform: `translateX(${(1 - progress) * -8}px)`,
  };
};

export const pulseDot: EasingFn = (frame, start) => {
  const cyclePos = ((frame - start) % PULSE_DOT_FRAMES) / PULSE_DOT_FRAMES;
  const opacity = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(cyclePos * 2 * Math.PI));
  return { opacity };
};

export const spanGlow: EasingFn = (frame, start) => {
  const cyclePos = ((frame - start) % SPAN_GLOW_FRAMES) / SPAN_GLOW_FRAMES;
  const intensity = 0.5 + 0.5 * Math.sin(cyclePos * 2 * Math.PI);
  return {
    boxShadow: `0 0 ${20 * intensity}px rgba(110, 231, 183, ${0.4 + 0.6 * intensity})`,
  };
};

export const easings = { fadeIn, slideIn, pulseDot, spanGlow };

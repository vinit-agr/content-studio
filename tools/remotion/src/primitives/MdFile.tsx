// tools/remotion/src/primitives/MdFile.tsx
import type { FC } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type MdFileProps = {
  filename: string;
  source: string;
  top: string;
  left?: string;
  width?: string;
  height?: string;
  enterFrame: number;
  clicked?: boolean;
  clickFrame?: number;
};

const ENTER_EASING = Easing.bezier(0.2, 0.9, 0.2, 1);

export const MdFile: FC<MdFileProps> = ({
  filename,
  source,
  top,
  left = '66%',
  width = '26%',
  height = '11%',
  enterFrame,
  clicked = false,
  clickFrame,
}) => {
  const frame = useCurrentFrame();
  const theme = useTheme();

  const eLocal = frame - enterFrame;
  const opacityEnter = interpolate(eLocal, [0, 4, 12], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ENTER_EASING,
  });
  const txPct = interpolate(eLocal, [0, 6, 12], [-110, 6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ENTER_EASING,
  });
  const scaleEnter = interpolate(eLocal, [0, 6, 12], [0.86, 1.03, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: ENTER_EASING,
  });

  let opacityExit = 1;
  let scaleExit = 1;
  let ringOpacity = 0;
  let ringScale = 1;
  let borderColor = theme.accentDim;
  let outerRingShadow = '0 0 0 0 rgba(110,231,183,0)';

  if (clickFrame !== undefined) {
    const cLocal = frame - clickFrame;
    if (clicked) {
      ringOpacity = interpolate(cLocal, [0, 2, 12], [0, 0.9, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      ringScale = interpolate(cLocal, [0, 12], [1, 1.24], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      scaleExit = interpolate(cLocal, [0, 6, 12], [1, 1.04, 1.08], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      opacityExit = interpolate(cLocal, [0, 6, 12], [1, 0.9, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      borderColor = theme.accent;
      const outerA = interpolate(cLocal, [0, 2, 8], [0, 0.85, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      outerRingShadow = `0 0 0 2px rgba(110,231,183,${outerA})`;
    } else {
      opacityExit = interpolate(cLocal, [0, 6, 12], [1, 0.15, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      scaleExit = interpolate(cLocal, [0, 6, 12], [1, 0.98, 0.96], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    }
  }

  const opacity = Math.min(opacityEnter, opacityExit);
  const scale = scaleEnter * scaleExit;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top,
          left,
          width,
          height,
          backgroundColor: theme.bgSurface,
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 22px',
          color: theme.text,
          fontFamily: monoStack,
          boxShadow: `0 8px 24px -10px rgba(0,0,0,0.55), ${outerRingShadow}`,
          opacity,
          transform: `translateX(${txPct}%) scale(${scale})`,
          transformOrigin: '100% 10%',
        }}
      >
        {/* folded-corner .md icon */}
        <div
          style={{
            position: 'relative',
            width: 50,
            height: 58,
            flex: '0 0 50px',
            backgroundColor: theme.accent,
            color: '#0c0c0f',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 6,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: 'inset -8px 0 0 0 rgba(0,0,0,0.08)',
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>md</span>
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 0,
              height: 0,
              borderTop: `14px solid ${theme.bgSurface}`,
              borderLeft: '14px solid transparent',
            }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: theme.accent, fontSize: 22, fontWeight: 600 }}>
            {filename}
          </div>
          <div
            style={{
              color: theme.textDim,
              fontSize: 14,
              marginTop: 5,
              letterSpacing: '0.02em',
            }}
          >
            {source}
          </div>
        </div>
      </div>

      {clicked && ringOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            top,
            left,
            width,
            height,
            borderRadius: 8,
            border: `2px solid ${theme.accent}`,
            pointerEvents: 'none',
            opacity: ringOpacity,
            transform: `scale(${ringScale})`,
            transformOrigin: 'center',
          }}
        />
      )}
    </>
  );
};

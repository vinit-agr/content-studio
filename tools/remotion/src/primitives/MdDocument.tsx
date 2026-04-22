// tools/remotion/src/primitives/MdDocument.tsx
import type { FC } from 'react';
import { Easing, interpolate, useCurrentFrame } from 'remotion';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type MdDocumentContent = {
  readonly filename: string;
  readonly badge: string;
  readonly heading: string;
  readonly paragraph: {
    readonly before: string;
    readonly highlight: string;
    readonly after: string;
  };
  readonly subheading: string;
  readonly bullets: readonly string[];
};

export type MdDocumentProps = {
  content: MdDocumentContent;
  emergeFrame: number;
  top?: string;
  left?: string;
  width?: string;
  height?: string;
  originX?: string;
  originY?: string;
  cascadeOffset?: number;
  lineStagger?: number;
  lineDuration?: number;
};

const EMERGE_EASING = Easing.bezier(0.2, 0.9, 0.2, 1);

export const MdDocument: FC<MdDocumentProps> = ({
  content,
  emergeFrame,
  top = '14%',
  left = '26%',
  width = '62%',
  height = '72%',
  originX = '100%',
  originY = '10%',
  cascadeOffset = 12,
  lineStagger = 4,
  lineDuration = 6,
}) => {
  const frame = useCurrentFrame();
  const theme = useTheme();

  const eLocal = frame - emergeFrame;

  const panelOpacity = interpolate(eLocal, [0, 4, 12], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EMERGE_EASING,
  });
  const panelScale = interpolate(eLocal, [0, 8, 12], [0.3, 1.02, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EMERGE_EASING,
  });
  const panelTxPct = interpolate(eLocal, [0, 12], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EMERGE_EASING,
  });
  const panelTyPct = interpolate(eLocal, [0, 12], [-40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EMERGE_EASING,
  });

  const cascadeBase = emergeFrame + cascadeOffset;
  const lineStyle = (index: number) => {
    const local = frame - (cascadeBase + index * lineStagger);
    const opacity = interpolate(local, [0, lineDuration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const ty = interpolate(local, [0, lineDuration], [4, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return { opacity, transform: `translateY(${ty}px)` };
  };

  const pillIndex = 3 + content.bullets.length;
  const pillLocal = frame - (cascadeBase + pillIndex * lineStagger);
  const pillOpacity = interpolate(pillLocal, [0, 4, 8], [0, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pillScale = interpolate(pillLocal, [0, 4, 8], [0.85, 1.08, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glowShadow =
    '0 0 40px 4px rgba(110,231,183,0.15), 0 24px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(110,231,183,0.2)';

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        height,
        backgroundColor: theme.bgSurface,
        border: `1px solid ${theme.accent}`,
        borderRadius: 10,
        padding: '34px 40px',
        color: theme.text,
        fontFamily: monoStack,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: glowShadow,
        transformOrigin: `${originX} ${originY}`,
        opacity: panelOpacity,
        transform: `scale(${panelScale}) translate(${panelTxPct}%, ${panelTyPct}%)`,
      }}
    >
      {/* header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 14,
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <span style={{ color: theme.accent, fontWeight: 700, fontSize: 22 }}>
          {content.filename}
        </span>
        <span
          style={{
            fontSize: 14,
            color: theme.accent,
            backgroundColor: theme.accentDim,
            padding: '6px 14px',
            borderRadius: 999,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontWeight: 600,
            opacity: pillOpacity,
            transform: `scale(${pillScale})`,
            whiteSpace: 'nowrap',
          }}
        >
          {content.badge}
        </span>
      </div>

      <div style={lineStyle(0)}>
        <div
          style={{
            color: theme.accent,
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            marginTop: 4,
          }}
        >
          {content.heading}
        </div>
      </div>

      <div style={lineStyle(1)}>
        <p
          style={{
            color: theme.textMuted,
            fontSize: 22,
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {content.paragraph.before}
          <span
            style={{
              backgroundColor: 'rgba(251,191,36,0.18)',
              color: theme.warn,
              padding: '1px 8px',
              borderRadius: 3,
              fontWeight: 600,
            }}
          >
            {content.paragraph.highlight}
          </span>
          {content.paragraph.after}
        </p>
      </div>

      <div style={lineStyle(2)}>
        <div
          style={{
            color: theme.accent,
            fontSize: 28,
            fontWeight: 700,
            marginTop: 6,
          }}
        >
          {content.subheading}
        </div>
      </div>

      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {content.bullets.map((b, i) => (
          <li
            key={b}
            style={{
              color: theme.textMuted,
              fontSize: 20,
              lineHeight: 1.7,
              ...lineStyle(3 + i),
            }}
          >
            <span style={{ color: theme.accent, fontWeight: 700 }}>- </span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
};

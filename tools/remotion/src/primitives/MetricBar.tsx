// tools/remotion/src/primitives/MetricBar.tsx
// STUB: horizontal bar indicator with label; will animate value fill later.
import type { CSSProperties, FC } from 'react';
import type { Theme } from '@theme/types';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type MetricBarProps = {
  label: string;
  value: number;
  color?: keyof Theme;
  style?: CSSProperties;
};

export const MetricBar: FC<MetricBarProps> = ({ label, value, color = 'accent', style }) => {
  const theme = useTheme();
  const fill = theme[color];
  const fillIsString = typeof fill === 'string';
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div
      data-stub="MetricBar"
      style={{ fontFamily: monoStack, color: theme.text, width: 600, ...style }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>
        {label}: {clamped.toFixed(2)}
      </div>
      <div
        style={{
          height: 32,
          border: `2px dashed ${theme.border}`,
          background: theme.bgSurface,
        }}
      >
        <div
          style={{
            width: `${clamped * 100}%`,
            height: '100%',
            background: fillIsString ? fill : theme.accent,
          }}
        />
      </div>
    </div>
  );
};

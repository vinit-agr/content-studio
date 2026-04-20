// tools/remotion/src/Root.tsx
import type { ComponentType, FC } from 'react';
import { Composition, Still } from 'remotion';
import { cxAgentEvalsTheme } from '@theme/projects/cx-agent-evals';
import { loadFonts } from '@theme/fonts';
import { ThemeProvider } from './theme/ThemeContext';
import { ChunkVsSpan, TOTAL_DURATION_FRAMES } from './compositions/chunk-vs-span';
import { ChunkVsSpanThumbnail } from './compositions/chunk-vs-span/thumbnail';

loadFonts();

// NOTE: `function` declaration (not arrow) avoids TSX generic ambiguity
// where `<P ...>` at the start of an arrow parameter list can be misread.
function withTheme<P extends object>(Inner: ComponentType<P>): FC<P> {
  const Wrapped: FC<P> = (props) => (
    <ThemeProvider theme={cxAgentEvalsTheme}>
      <Inner {...props} />
    </ThemeProvider>
  );
  return Wrapped;
}

export const Root: FC = () => (
  <>
    <Composition
      id="chunk-vs-span"
      component={withTheme(ChunkVsSpan)}
      durationInFrames={TOTAL_DURATION_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
    <Still
      id="chunk-vs-span-thumbnail"
      component={withTheme(ChunkVsSpanThumbnail)}
      width={1280}
      height={720}
    />
  </>
);

import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setEntryPoint('./tools/remotion/src/index.ts');

// IMPORTANT: keep this alias list in lockstep with tsconfig.json#compilerOptions.paths.
// Paths are resolved against process.cwd() (the repo root where `pnpm` scripts run).
// Remotion's config loader transforms this file to CJS, so `import.meta.url` is not
// available — use relative paths via `path.resolve` instead.
Config.overrideWebpackConfig((current) => ({
  ...current,
  resolve: {
    ...current.resolve,
    alias: {
      ...(current.resolve?.alias ?? {}),
      '@shared': path.resolve('./shared'),
      '@theme': path.resolve('./shared/theme'),
      '@primitives': path.resolve('./tools/remotion/src/primitives'),
    },
  },
}));

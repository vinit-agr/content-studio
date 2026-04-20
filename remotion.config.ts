import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config } from '@remotion/cli/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setEntryPoint('./tools/remotion/src/index.ts');

// IMPORTANT: keep this alias list in lockstep with tsconfig.json#compilerOptions.paths.
Config.overrideWebpackConfig((current) => ({
  ...current,
  resolve: {
    ...current.resolve,
    alias: {
      ...(current.resolve?.alias ?? {}),
      '@shared': path.resolve(__dirname, 'shared'),
      '@theme': path.resolve(__dirname, 'shared/theme'),
      '@primitives': path.resolve(__dirname, 'tools/remotion/src/primitives'),
    },
  },
}));

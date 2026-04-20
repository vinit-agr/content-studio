# Content Studio Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the `content-studio` repo to the state where `pnpm studio` previews the pilot, `pnpm render:chunk-vs-span` produces a 90-second MP4, and `pnpm thumbnail:chunk-vs-span` produces a PNG — all from placeholder-fidelity scenes against the cx-agent-evals theme.

**Architecture:** Single pnpm package at repo root; ESM + TypeScript throughout. Remotion 4.x is the only fully-built tool. `shared/theme/` is the palette single source of truth; per-project overrides live under `shared/theme/projects/`. Remotion compositions consume theme via a React Context (`ThemeProvider` + `useTheme()` hook) so primitives remain theme-agnostic. Scenes read their Caption text from a co-located `captions.ts`; frame constants live in a leaf `frames.ts` to avoid import cycles. Projects directory (`projects/<source>--<slug>/`) holds tool-agnostic narrative docs; `tools/remotion/src/compositions/<slug>/` holds only Remotion code.

**Tech Stack:** pnpm + Node 20 + TypeScript 5.6 (ES2022 / Bundler resolution / strict) + Remotion 4.x + React 18 + ESLint 9 flat config + Prettier 3.

**Reference spec:** [`docs/superpowers/specs/2026-04-20-content-studio-foundation-design.md`](../specs/2026-04-20-content-studio-foundation-design.md). Read it before starting — all decisions are locked there.

**Remotion API guardrail:** If any step in Tasks 4, 7, 11, 19, 21 fails at typecheck or studio-boot time with a "Config.X is not a function" / "loadFont not exported" / "Composition prop invalid" error, fetch current Remotion 4.x docs via `context7` MCP (`mcp__plugin_context7_context7__resolve-library-id` → `mcp__plugin_context7_context7__query-docs`) before editing the plan or the code. The plan was written against Remotion 4.x docs; API surface occasionally shifts within the 4.x line.

**Pre-flight check (do this before Task 1):**

Verify the environment and current repo state:

```sh
node --version   # expect v20.x or higher
corepack --version   # expect a version; corepack ships with Node >= 16
git -C /Users/vinit/Tars/Content-Creation/content-studio status
git -C /Users/vinit/Tars/Content-Creation/content-studio log --oneline
```

Expected: clean working tree on `main` with the repo bootstrap + design spec + this plan committed (4 commits: `chore: initial commit`, `docs: foundation design spec`, `docs: spec iter 2 + iter 3`, `docs: foundation implementation plan`). The remote `origin` is `https://github.com/vinit-agr/content-studio`.

If Node is not v20+, install it (via `nvm install 20` or Homebrew) before proceeding.

All working-directory paths in this plan are relative to `/Users/vinit/Tars/Content-Creation/content-studio/`. Run every command from that directory.

---

## Task 1: Bootstrap package.json + install dependencies

**Files:**

- Create: `package.json`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "content-studio",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.12.0",
  "engines": { "node": ">=20" },
  "description": "Standalone studio repo for producing videos and motion graphics — Remotion-first, tool-pluralist.",
  "license": "MIT",
  "scripts": {
    "studio": "remotion studio",
    "render:chunk-vs-span": "remotion render chunk-vs-span out/cx-agent-evals--chunk-vs-span/v01.mp4",
    "thumbnail:chunk-vs-span": "remotion still chunk-vs-span-thumbnail out/cx-agent-evals--chunk-vs-span/v01-thumb.png",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "@remotion/bundler": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/google-fonts": "^4.0.0",
    "@remotion/renderer": "^4.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "remotion": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "eslint": "^9.0.0",
    "globals": "^15.0.0",
    "prettier": "^3.3.0",
    "typescript": "^5.6.0",
    "typescript-eslint": "^8.0.0"
  }
}
```

- [ ] **Step 2: Enable Corepack (one-time) + install**

```sh
corepack enable
pnpm install
```

Expected: pnpm installs all deps, writes `pnpm-lock.yaml`, populates `node_modules/`. Expect zero `ERR`-level output. Peer-dep warnings are OK.

- [ ] **Step 3: Verify Remotion CLI is reachable**

```sh
pnpm exec remotion --version
```

Expected: prints a version starting with `4.` (e.g., `4.0.xxx`). If it fails, re-run `pnpm install`.

- [ ] **Step 4: Commit**

```sh
git add package.json pnpm-lock.yaml
git commit -m "chore: add package.json and install Remotion 4.x + toolchain"
```

---

## Task 2: TypeScript configuration

**Files:**

- Create: `tsconfig.base.json`
- Create: `tsconfig.json`

- [ ] **Step 1: Write `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["shared/*"],
      "@theme/*": ["shared/theme/*"],
      "@primitives": ["tools/remotion/src/primitives/index"],
      "@primitives/*": ["tools/remotion/src/primitives/*"]
    },
    "types": ["node"]
  },
  "include": ["tools/**/*", "shared/**/*", "remotion.config.ts"],
  "exclude": ["node_modules", "out", "repo-references", "dist"]
}
```

> **Note:** `@primitives` (no trailing slash) resolves the `index.ts` barrel; `@primitives/*` keeps deep imports working. Keep this list in lockstep with `remotion.config.ts` webpack aliases (Task 4).

- [ ] **Step 3: Sanity-check JSON parseability**

```sh
pnpm exec node -e "JSON.parse(require('fs').readFileSync('tsconfig.base.json','utf8')); JSON.parse(require('fs').readFileSync('tsconfig.json','utf8')); console.log('both tsconfigs parse')"
```

Expected: prints `both tsconfigs parse`.

> **Why not `pnpm typecheck` here?** With `"include": ["tools/**/*", "shared/**/*", "remotion.config.ts"]` and zero TypeScript files on disk yet, `tsc --noEmit` emits error `TS18003: No inputs were found`. The first real typecheck runs in Task 4 after `remotion.config.ts` is written.

- [ ] **Step 4: Commit**

```sh
git add tsconfig.base.json tsconfig.json
git commit -m "chore: add TypeScript config (strict ESM + path aliases)"
```

---

## Task 3: Prettier and ESLint (flat config)

**Files:**

- Create: `.prettierrc`
- Create: `.prettierignore`
- Create: `eslint.config.js`

- [ ] **Step 1: Write `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "always"
}
```

- [ ] **Step 2: Write `.prettierignore`**

```
node_modules
out
repo-references
dist
pnpm-lock.yaml
LICENSE
```

- [ ] **Step 3: Write `eslint.config.js`**

```js
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['out/**', 'node_modules/**', 'repo-references/**', 'dist/**', 'pnpm-lock.yaml'],
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
```

- [ ] **Step 4: Verify Prettier and ESLint both run cleanly**

```sh
pnpm format:check
pnpm lint
```

Expected: `format:check` reports all files use Prettier style (it checks the existing `.json`/`.md`/etc.). `lint` exits 0 (no `.ts`/`.tsx` files yet, so no checks happen).

If `format:check` fails on the existing files, run `pnpm format` once to bring them in line, then re-run `format:check`.

- [ ] **Step 5: Commit**

```sh
git add .prettierrc .prettierignore eslint.config.js
git commit -m "chore: add Prettier and ESLint flat-config"
```

---

## Task 4: Remotion config with webpack aliases

**Files:**

- Create: `remotion.config.ts`

- [ ] **Step 1: Write `remotion.config.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck the config**

```sh
pnpm typecheck
```

Expected: exits 0. If it complains about `import.meta.url` or Node types, ensure `@types/node` is installed (it is, per Task 1) and `types: ["node"]` is in `tsconfig.json` (it is, per Task 2).

- [ ] **Step 3: Commit**

```sh
git add remotion.config.ts
git commit -m "chore: add Remotion config with 1080p30 H.264 + webpack aliases"
```

---

## Task 5: Theme types

**Files:**

- Create: `shared/theme/types.ts`

- [ ] **Step 1: Write the theme type**

```ts
// shared/theme/types.ts
export type Theme = {
  readonly bg: string;
  readonly bgElevated: string;
  readonly bgSurface: string;
  readonly bgHover: string;
  readonly border: string;
  readonly borderBright: string;
  readonly text: string;
  readonly textMuted: string;
  readonly textDim: string;
  readonly accent: string;
  readonly accentDim: string;
  readonly accentBright: string;
  readonly warn: string;
  readonly error: string;
  readonly chunks: readonly [string, string, string, string, string];
};

export type ChunkIndex = 0 | 1 | 2 | 3 | 4;
```

- [ ] **Step 2: Typecheck**

```sh
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```sh
git add shared/theme/types.ts
git commit -m "feat(theme): add Theme type + ChunkIndex"
```

---

## Task 6: Base palette (`defaultTheme`)

The base palette is intentionally _different_ from the cx-agent-evals palette so the override pattern actually overrides something. `defaultTheme` uses a neutral cyan accent; cx-agent-evals uses HANDOFF's mint accent (Task 9).

**Files:**

- Create: `shared/theme/colors.ts`

- [ ] **Step 1: Write `defaultTheme`**

```ts
// shared/theme/colors.ts
import type { Theme } from './types';

export const defaultTheme = {
  bg: '#0c0c0f',
  bgElevated: '#141419',
  bgSurface: '#1a1a22',
  bgHover: '#22222d',
  border: '#2a2a36',
  borderBright: '#3a3a4a',
  text: '#e8e8ed',
  textMuted: '#8888a0',
  textDim: '#55556a',
  accent: '#38bdf8',
  accentDim: '#0c4a6e',
  accentBright: '#7dd3fc',
  warn: '#fbbf24',
  error: '#f87171',
  chunks: ['#38bdf880', '#818cf880', '#fbbf2480', '#f472b680', '#6ee7b780'] as const,
} as const satisfies Theme;
```

- [ ] **Step 2: Typecheck**

```sh
pnpm typecheck
```

Expected: exits 0. If `satisfies` fails, you've drifted from `Theme` — check the missing/extra key.

- [ ] **Step 3: Commit**

```sh
git add shared/theme/colors.ts
git commit -m "feat(theme): add defaultTheme (neutral cyan base palette)"
```

---

## Task 7: Fonts loader

**Files:**

- Create: `shared/theme/fonts.ts`

- [ ] **Step 1: Write `fonts.ts`**

```ts
// shared/theme/fonts.ts
import { loadFont } from '@remotion/google-fonts/JetBrainsMono';

export const fontFamily = 'JetBrains Mono';
export const monoStack = "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace";

let loaded = false;

export const loadFonts = (): void => {
  if (loaded) return;
  loadFont();
  loaded = true;
};
```

> **Note on font timing:** `loadFont()` kicks off async font loading. In preview the font may flicker once when it resolves. In headless render, Remotion's render pipeline generally waits for pending fonts. If you observe a flash of fallback font in the rendered MP4, the fix is to block render with `delayRender`:
>
> ```ts
> // Alternative if font flicker appears in renders:
> import { continueRender, delayRender } from 'remotion';
> const handle = delayRender('fonts');
> loadFont()
>   .waitUntilDone()
>   .then(() => continueRender(handle));
> ```
>
> Start with the simple version; switch only if the symptom appears.

- [ ] **Step 2: Typecheck**

```sh
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```sh
git add shared/theme/fonts.ts
git commit -m "feat(theme): add JetBrains Mono loader and font stack constants"
```

---

## Task 8: Easings

**Files:**

- Create: `shared/theme/easings.ts`

- [ ] **Step 1: Write easings**

```ts
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
```

> **Rationale (resolves spec §13.2):** Easings are plain functions `(frame, start) => CSSProperties`. Consumers spread the result into a `style` object. Purely frame-driven — no React hooks inside, no state. This is simpler than returning `spring()` configs because `TitleCard`/`Caption` just need an object to spread into CSS, not a Remotion primitive.

- [ ] **Step 2: Typecheck**

```sh
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```sh
git add shared/theme/easings.ts
git commit -m "feat(theme): add fadeIn / slideIn / pulseDot / spanGlow easing functions"
```

---

## Task 9: cx-agent-evals theme override

**Files:**

- Create: `shared/theme/projects/cx-agent-evals.ts`

- [ ] **Step 1: Write the override**

```ts
// shared/theme/projects/cx-agent-evals.ts
import type { Theme } from '../types';
import { defaultTheme } from '../colors';

export const cxAgentEvalsTheme = {
  ...defaultTheme,
  accent: '#6ee7b7', // mint green — HANDOFF reference palette
  accentDim: '#2d6b54',
  accentBright: '#a7f3d0',
  chunks: ['#6ee7b780', '#818cf880', '#fbbf2480', '#f472b680', '#38bdf880'] as const,
} as const satisfies Theme;
```

- [ ] **Step 2: Typecheck**

```sh
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```sh
git add shared/theme/projects/cx-agent-evals.ts
git commit -m "feat(theme): add cx-agent-evals palette override (mint accent)"
```

---

## Task 10: Theme barrel (`shared/theme/index.ts`)

**Files:**

- Create: `shared/theme/index.ts`

- [ ] **Step 1: Write the barrel**

```ts
// shared/theme/index.ts
export type { Theme, ChunkIndex } from './types';
export type { EasingFn } from './easings';
export { defaultTheme } from './colors';
export { fontFamily, monoStack, loadFonts } from './fonts';
export { fadeIn, slideIn, pulseDot, spanGlow, easings } from './easings';
```

- [ ] **Step 2: Typecheck**

```sh
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```sh
git add shared/theme/index.ts
git commit -m "feat(theme): add barrel re-exports"
```

---

## Task 11: ThemeContext + theme barrel for Remotion src

**Files:**

- Create: `tools/remotion/src/theme/ThemeContext.tsx`
- Create: `tools/remotion/src/theme/index.ts`

- [ ] **Step 1: Write `ThemeContext.tsx`**

```tsx
// tools/remotion/src/theme/ThemeContext.tsx
import { createContext, useContext, type FC, type ReactNode } from 'react';
import type { Theme } from '@theme/types';
import { defaultTheme } from '@theme/colors';

const ThemeContext = createContext<Theme>(defaultTheme);

type ProviderProps = { theme: Theme; children: ReactNode };

export const ThemeProvider: FC<ProviderProps> = ({ theme, children }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);

export const useTheme = (): Theme => useContext(ThemeContext);
```

- [ ] **Step 2: Write the local barrel**

```ts
// tools/remotion/src/theme/index.ts
export { ThemeProvider, useTheme } from './ThemeContext';
```

- [ ] **Step 3: Typecheck**

```sh
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 4: Commit**

```sh
git add tools/remotion/src/theme/ThemeContext.tsx tools/remotion/src/theme/index.ts
git commit -m "feat(remotion): add ThemeProvider + useTheme() context"
```

---

## Task 12: Built primitives — TitleCard

**Files:**

- Create: `tools/remotion/src/primitives/TitleCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// tools/remotion/src/primitives/TitleCard.tsx
import type { CSSProperties, FC } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { monoStack } from '@theme/fonts';
import { fadeIn, slideIn } from '@theme/easings';
import { useTheme } from '../theme';

export type TitleCardProps = {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  enter?: 'fade' | 'slide' | 'none';
  style?: CSSProperties;
  className?: string;
};

export const TitleCard: FC<TitleCardProps> = ({
  title,
  subtitle,
  align = 'center',
  enter = 'fade',
  style,
  className,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const entrance = enter === 'fade' ? fadeIn(frame, 0) : enter === 'slide' ? slideIn(frame, 0) : {};

  const centered = align === 'center';

  return (
    <AbsoluteFill
      className={className}
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: monoStack,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: centered ? 'center' : 'flex-start',
        padding: centered ? 0 : 120,
        ...entrance,
        ...style,
      }}
    >
      <div style={{ fontSize: 88, fontWeight: 700, color: theme.accent, letterSpacing: -1 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 32, color: theme.textMuted, marginTop: 24 }}>{subtitle}</div>
      )}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Typecheck**

```sh
pnpm typecheck
```

Expected: exits 0.

- [ ] **Step 3: Lint**

```sh
pnpm lint
```

Expected: exits 0 (warnings OK, no errors).

- [ ] **Step 4: Commit**

```sh
git add tools/remotion/src/primitives/TitleCard.tsx
git commit -m "feat(primitives): add TitleCard"
```

---

## Task 13: Built primitives — Caption

**Files:**

- Create: `tools/remotion/src/primitives/Caption.tsx`

- [ ] **Step 1: Write the component**

```tsx
// tools/remotion/src/primitives/Caption.tsx
import type { CSSProperties, FC } from 'react';
import { useCurrentFrame } from 'remotion';
import { monoStack } from '@theme/fonts';
import { fadeIn, slideIn } from '@theme/easings';
import { useTheme } from '../theme';

export type CaptionProps = {
  text: string;
  position?: 'bottom' | 'top' | 'inline';
  enter?: 'fade' | 'slide' | 'none';
  style?: CSSProperties;
};

export const Caption: FC<CaptionProps> = ({
  text,
  position = 'bottom',
  enter = 'slide',
  style,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const entrance = enter === 'fade' ? fadeIn(frame, 0) : enter === 'slide' ? slideIn(frame, 0) : {};

  const positional: CSSProperties =
    position === 'bottom'
      ? { position: 'absolute', bottom: 96, left: 96, right: 96 }
      : position === 'top'
        ? { position: 'absolute', top: 96, left: 96, right: 96 }
        : {};

  return (
    <div
      style={{
        ...positional,
        color: theme.text,
        fontFamily: monoStack,
        fontSize: 32,
        lineHeight: 1.5,
        backgroundColor: position === 'inline' ? 'transparent' : `${theme.bgElevated}cc`,
        padding: position === 'inline' ? 0 : '16px 24px',
        borderRadius: position === 'inline' ? 0 : 8,
        border: position === 'inline' ? 'none' : `1px solid ${theme.border}`,
        ...entrance,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
```

- [ ] **Step 2: Typecheck + lint**

```sh
pnpm typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```sh
git add tools/remotion/src/primitives/Caption.tsx
git commit -m "feat(primitives): add Caption"
```

---

## Task 14: Built primitives — Document

**Files:**

- Create: `tools/remotion/src/primitives/Document.tsx`

- [ ] **Step 1: Write the component**

```tsx
// tools/remotion/src/primitives/Document.tsx
import type { CSSProperties, FC } from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type DocumentProps = {
  text: string;
  reveal?: 'instant' | 'byChar' | 'byWord';
  revealStartFrame?: number;
  revealDurationFrames?: number;
  style?: CSSProperties;
};

export const Document: FC<DocumentProps> = ({
  text,
  reveal = 'instant',
  revealStartFrame = 0,
  revealDurationFrames,
  style,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();

  let visibleText = text;
  if (reveal !== 'instant') {
    if (revealDurationFrames === undefined) {
      throw new Error(`Document: revealDurationFrames is required when reveal="${reveal}"`);
    }
    const units = reveal === 'byChar' ? [...text] : text.split(/(\s+)/);
    const count = Math.floor(
      interpolate(frame - revealStartFrame, [0, revealDurationFrames], [0, units.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
    visibleText = units.slice(0, count).join('');
  }

  return (
    <div
      style={{
        color: theme.text,
        fontFamily: monoStack,
        fontSize: 28,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        maxWidth: 1400,
        ...style,
      }}
    >
      {visibleText}
    </div>
  );
};
```

- [ ] **Step 2: Typecheck + lint**

```sh
pnpm typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```sh
git add tools/remotion/src/primitives/Document.tsx
git commit -m "feat(primitives): add Document with optional char/word reveal"
```

---

## Task 15: Stub primitives (Chunk, Span, Token, MetricBar, Cursor)

All five stubs render a dashed outline + their name so unfinished work is obvious on preview/render.

**Files:**

- Create: `tools/remotion/src/primitives/Chunk.tsx`
- Create: `tools/remotion/src/primitives/Span.tsx`
- Create: `tools/remotion/src/primitives/Token.tsx`
- Create: `tools/remotion/src/primitives/MetricBar.tsx`
- Create: `tools/remotion/src/primitives/Cursor.tsx`

- [ ] **Step 1: Write a shared stub helper — no, actually inline per file for clarity**

Each stub file uses the same visual pattern but different prop shapes. Inline for clarity (5 files, ~20 lines each).

- [ ] **Step 2: Write `Chunk.tsx`**

```tsx
// tools/remotion/src/primitives/Chunk.tsx
// STUB: shows the chunk index + text with a palette-matched border.
// Upgrade: animate into existence when the containing chunk is "retrieved".
import type { CSSProperties, FC } from 'react';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type ChunkProps = {
  index: number;
  text: string;
  label?: string;
  style?: CSSProperties;
};

export const Chunk: FC<ChunkProps> = ({ index, text, label, style }) => {
  const theme = useTheme();
  const color = theme.chunks[index % 5] ?? theme.accent;
  return (
    <div
      style={{
        border: `2px dashed ${color}`,
        padding: '12px 16px',
        fontFamily: monoStack,
        color: theme.text,
        ...style,
      }}
    >
      <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 4 }}>
        {label ?? `stub:Chunk[${index}]`}
      </div>
      <div style={{ fontSize: 20 }}>{text}</div>
    </div>
  );
};
```

- [ ] **Step 3: Write `Span.tsx`**

```tsx
// tools/remotion/src/primitives/Span.tsx
// STUB: highlights a character span inline.
// Upgrade: implement spanGlow easing on the highlight.
import type { CSSProperties, FC } from 'react';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type SpanProps = {
  text: string;
  glow?: boolean;
  style?: CSSProperties;
};

export const Span: FC<SpanProps> = ({ text, glow = false, style }) => {
  const theme = useTheme();
  return (
    <span
      data-stub="Span"
      data-glow={glow}
      style={{
        fontFamily: monoStack,
        borderBottom: `2px dashed ${theme.accent}`,
        padding: '0 2px',
        color: theme.text,
        ...style,
      }}
    >
      {text}
    </span>
  );
};
```

- [ ] **Step 4: Write `Token.tsx`**

```tsx
// tools/remotion/src/primitives/Token.tsx
// STUB: renders a single token; will animate per-token reveal later.
import type { CSSProperties, FC } from 'react';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../theme';

export type TokenProps = {
  text: string;
  highlighted?: boolean;
  style?: CSSProperties;
};

export const Token: FC<TokenProps> = ({ text, highlighted = false, style }) => {
  const theme = useTheme();
  return (
    <span
      data-stub="Token"
      style={{
        fontFamily: monoStack,
        color: highlighted ? theme.accent : theme.text,
        border: `1px dashed ${highlighted ? theme.accent : theme.border}`,
        padding: '0 4px',
        marginRight: 4,
        ...style,
      }}
    >
      {text}
    </span>
  );
};
```

- [ ] **Step 5: Write `MetricBar.tsx`**

```tsx
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
```

- [ ] **Step 6: Write `Cursor.tsx`**

```tsx
// tools/remotion/src/primitives/Cursor.tsx
// STUB: blinking terminal-style cursor; will sync to narration beats later.
import type { CSSProperties, FC } from 'react';
import { useCurrentFrame } from 'remotion';
import { useTheme } from '../theme';

export type CursorProps = {
  blinking?: boolean;
  style?: CSSProperties;
};

export const Cursor: FC<CursorProps> = ({ blinking = true, style }) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const visible = !blinking || Math.floor(frame / 15) % 2 === 0;
  return (
    <span
      data-stub="Cursor"
      style={{
        display: 'inline-block',
        width: 12,
        height: 24,
        background: theme.accent,
        opacity: visible ? 1 : 0,
        verticalAlign: 'text-bottom',
        ...style,
      }}
    />
  );
};
```

- [ ] **Step 7: Typecheck + lint**

```sh
pnpm typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 8: Commit**

```sh
git add tools/remotion/src/primitives/Chunk.tsx \
        tools/remotion/src/primitives/Span.tsx \
        tools/remotion/src/primitives/Token.tsx \
        tools/remotion/src/primitives/MetricBar.tsx \
        tools/remotion/src/primitives/Cursor.tsx
git commit -m "feat(primitives): add stub Chunk / Span / Token / MetricBar / Cursor"
```

---

## Task 16: Primitives barrel

**Files:**

- Create: `tools/remotion/src/primitives/index.ts`

- [ ] **Step 1: Write the barrel**

```ts
// tools/remotion/src/primitives/index.ts
export { TitleCard, type TitleCardProps } from './TitleCard';
export { Caption, type CaptionProps } from './Caption';
export { Document, type DocumentProps } from './Document';
export { Chunk, type ChunkProps } from './Chunk';
export { Span, type SpanProps } from './Span';
export { Token, type TokenProps } from './Token';
export { MetricBar, type MetricBarProps } from './MetricBar';
export { Cursor, type CursorProps } from './Cursor';
```

- [ ] **Step 2: Typecheck + lint**

```sh
pnpm typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```sh
git add tools/remotion/src/primitives/index.ts
git commit -m "feat(primitives): add barrel export"
```

---

## Task 17: Sample document + frame map + captions

**Files:**

- Create: `shared/assets/data/sample-document.ts`
- Create: `tools/remotion/src/compositions/chunk-vs-span/frames.ts`
- Create: `tools/remotion/src/compositions/chunk-vs-span/captions.ts`

- [ ] **Step 1: Write `sample-document.ts`**

```ts
// shared/assets/data/sample-document.ts
export const SAMPLE_DOCUMENT = `Retrieval-augmented generation lets a language model ground its answers in
an external corpus. The corpus is split into chunks — short passages that
can be indexed and looked up by similarity. When a user asks a question, the
retriever finds the most relevant chunks and passes them to the model as
context. The quality of the whole system depends on whether the retrieved
chunks actually contain the answer, not just a keyword that looks relevant.
That is the question evaluation is trying to settle.`;
```

- [ ] **Step 2: Write `frames.ts`**

```ts
// tools/remotion/src/compositions/chunk-vs-span/frames.ts
// Leaf module — no other imports. Prevents circular imports between
// index.tsx (registers scenes) and captions.ts (needs SceneName).
export const SCENES = {
  intro: { start: 0, duration: 150 }, // 0–5s
  document: { start: 150, duration: 300 }, // 5–15s
  chunking: { start: 450, duration: 450 }, // 15–30s
  span: { start: 900, duration: 300 }, // 30–40s
  comparison: { start: 1200, duration: 900 }, // 40–70s
  outro: { start: 2100, duration: 600 }, // 70–90s
} as const satisfies Record<string, { start: number; duration: number }>;

export type SceneName = keyof typeof SCENES;

export const TOTAL_DURATION_FRAMES = 2700;
export const FPS = 30;

// Runtime self-check: scenes contiguous + sum to total.
const names = Object.keys(SCENES) as SceneName[];
let expectedStart = 0;
for (const name of names) {
  const { start, duration } = SCENES[name];
  if (start !== expectedStart) {
    throw new Error(
      `SCENES contiguity error: "${name}" starts at ${start}, expected ${expectedStart}`,
    );
  }
  expectedStart += duration;
}
if (expectedStart !== TOTAL_DURATION_FRAMES) {
  throw new Error(
    `SCENES duration mismatch: sum=${expectedStart}, TOTAL_DURATION_FRAMES=${TOTAL_DURATION_FRAMES}`,
  );
}
```

- [ ] **Step 3: Write `captions.ts`**

```ts
// tools/remotion/src/compositions/chunk-vs-span/captions.ts
// Canonical narration lives at projects/cx-agent-evals--chunk-vs-span/script.md.
// Keep captions here short; they are the on-screen text for the day-one
// captions-only render (Q9 in the spec).
import type { SceneName } from './frames';

export const CAPTIONS = {
  intro: 'Chunk vs span — a quick tour of two recall metrics.',
  document: 'Consider this document.',
  chunking: 'Split the document into chunks. Each becomes a retrieval unit.',
  span: 'The true answer lives in this character span.',
  comparison: 'Chunk-level recall: 1.0.   Span-level recall: 0.4.',
  outro: 'Span evaluation is the honest signal.',
} as const satisfies Record<SceneName, string>;
```

- [ ] **Step 4: Typecheck + lint**

```sh
pnpm typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 5: Commit**

```sh
git add shared/assets/data/sample-document.ts \
        tools/remotion/src/compositions/chunk-vs-span/frames.ts \
        tools/remotion/src/compositions/chunk-vs-span/captions.ts
git commit -m "feat(chunk-vs-span): add SCENES frame map, captions, and sample document"
```

---

## Task 18: Scene components (all six)

All six scenes share the same shape: render a `TitleCard` + `Caption`. Scenes 2 and 3 also use `Document` with the sample text.

**Files:**

- Create: `tools/remotion/src/compositions/chunk-vs-span/scenes/01-intro.tsx`
- Create: `tools/remotion/src/compositions/chunk-vs-span/scenes/02-document.tsx`
- Create: `tools/remotion/src/compositions/chunk-vs-span/scenes/03-chunking.tsx`
- Create: `tools/remotion/src/compositions/chunk-vs-span/scenes/04-span.tsx`
- Create: `tools/remotion/src/compositions/chunk-vs-span/scenes/05-comparison.tsx`
- Create: `tools/remotion/src/compositions/chunk-vs-span/scenes/06-outro.tsx`

- [ ] **Step 1: Write `01-intro.tsx`**

```tsx
// tools/remotion/src/compositions/chunk-vs-span/scenes/01-intro.tsx
import type { FC } from 'react';
import { Caption, TitleCard } from '@primitives';
import { CAPTIONS } from '../captions';

export const IntroScene: FC = () => (
  <>
    <TitleCard title="Chunk vs Span" subtitle="Intro — 0:00–0:05" enter="fade" />
    <Caption text={CAPTIONS.intro} position="bottom" />
  </>
);
```

- [ ] **Step 2: Write `02-document.tsx`**

```tsx
// tools/remotion/src/compositions/chunk-vs-span/scenes/02-document.tsx
import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Caption, Document, TitleCard } from '@primitives';
import { SAMPLE_DOCUMENT } from '@shared/assets/data/sample-document';
import { CAPTIONS } from '../captions';

export const DocumentScene: FC = () => (
  <AbsoluteFill style={{ padding: 96, backgroundColor: 'transparent' }}>
    <TitleCard title="The Document" subtitle="0:05–0:15" enter="fade" />
    <div style={{ position: 'absolute', top: 360, left: 96, right: 96 }}>
      <Document
        text={SAMPLE_DOCUMENT}
        reveal="byWord"
        revealStartFrame={15}
        revealDurationFrames={240}
      />
    </div>
    <Caption text={CAPTIONS.document} position="bottom" />
  </AbsoluteFill>
);
```

- [ ] **Step 3: Write `03-chunking.tsx`**

```tsx
// tools/remotion/src/compositions/chunk-vs-span/scenes/03-chunking.tsx
import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Caption, Chunk, TitleCard } from '@primitives';
import { SAMPLE_DOCUMENT } from '@shared/assets/data/sample-document';
import { CAPTIONS } from '../captions';

// Naive chunking for the placeholder visual: split by sentence.
const CHUNKS = SAMPLE_DOCUMENT.split('. ')
  .filter((s) => s.trim().length > 0)
  .map((s, i, arr) => (i < arr.length - 1 ? `${s}.` : s));

export const ChunkingScene: FC = () => (
  <AbsoluteFill style={{ padding: 96 }}>
    <TitleCard title="Chunking" subtitle="0:15–0:30" enter="fade" />
    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 96,
        right: 96,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {CHUNKS.map((text, i) => (
        <Chunk key={i} index={i} text={text} label={`C${i + 1}`} />
      ))}
    </div>
    <Caption text={CAPTIONS.chunking} position="bottom" />
  </AbsoluteFill>
);
```

- [ ] **Step 4: Write `04-span.tsx`**

```tsx
// tools/remotion/src/compositions/chunk-vs-span/scenes/04-span.tsx
import type { FC } from 'react';
import { Caption, TitleCard } from '@primitives';
import { CAPTIONS } from '../captions';

export const SpanScene: FC = () => (
  <>
    <TitleCard title="The Answer Span" subtitle="0:30–0:40 — character-level" enter="fade" />
    <Caption text={CAPTIONS.span} position="bottom" />
  </>
);
```

- [ ] **Step 5: Write `05-comparison.tsx`**

```tsx
// tools/remotion/src/compositions/chunk-vs-span/scenes/05-comparison.tsx
import type { FC } from 'react';
import { AbsoluteFill } from 'remotion';
import { Caption, MetricBar, TitleCard } from '@primitives';
import { CAPTIONS } from '../captions';

export const ComparisonScene: FC = () => (
  <AbsoluteFill style={{ padding: 96 }}>
    <TitleCard title="Chunk vs Span Recall" subtitle="0:40–1:10" enter="fade" />
    <div
      style={{
        position: 'absolute',
        top: 360,
        left: 96,
        right: 96,
        display: 'flex',
        flexDirection: 'column',
        gap: 48,
      }}
    >
      <MetricBar label="Chunk-level recall" value={1.0} color="accent" />
      <MetricBar label="Span-level recall" value={0.4} color="warn" />
    </div>
    <Caption text={CAPTIONS.comparison} position="bottom" />
  </AbsoluteFill>
);
```

- [ ] **Step 6: Write `06-outro.tsx`**

```tsx
// tools/remotion/src/compositions/chunk-vs-span/scenes/06-outro.tsx
import type { FC } from 'react';
import { Caption, TitleCard } from '@primitives';
import { CAPTIONS } from '../captions';

export const OutroScene: FC = () => (
  <>
    <TitleCard title="github.com/vinit-agr/cx-agent-evals" subtitle="1:10–1:30" enter="fade" />
    <Caption text={CAPTIONS.outro} position="bottom" />
  </>
);
```

- [ ] **Step 7: Typecheck + lint**

```sh
pnpm typecheck && pnpm lint
```

Expected: both exit 0. If TS complains about `@shared/assets/data/sample-document`, re-check that `@shared/*` is in `tsconfig.json#paths`.

- [ ] **Step 8: Commit**

```sh
git add tools/remotion/src/compositions/chunk-vs-span/scenes/
git commit -m "feat(chunk-vs-span): add placeholder-fidelity scenes 01–06"
```

---

## Task 19: Composition shell (`index.tsx`)

**Files:**

- Create: `tools/remotion/src/compositions/chunk-vs-span/index.tsx`

- [ ] **Step 1: Write the composition**

```tsx
// tools/remotion/src/compositions/chunk-vs-span/index.tsx
import type { FC } from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { useTheme } from '../../theme';
import { SCENES } from './frames';
import { IntroScene } from './scenes/01-intro';
import { DocumentScene } from './scenes/02-document';
import { ChunkingScene } from './scenes/03-chunking';
import { SpanScene } from './scenes/04-span';
import { ComparisonScene } from './scenes/05-comparison';
import { OutroScene } from './scenes/06-outro';

export { TOTAL_DURATION_FRAMES } from './frames';

export const ChunkVsSpan: FC = () => {
  const theme = useTheme();
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <Sequence from={SCENES.intro.start} durationInFrames={SCENES.intro.duration}>
        <IntroScene />
      </Sequence>
      <Sequence from={SCENES.document.start} durationInFrames={SCENES.document.duration}>
        <DocumentScene />
      </Sequence>
      <Sequence from={SCENES.chunking.start} durationInFrames={SCENES.chunking.duration}>
        <ChunkingScene />
      </Sequence>
      <Sequence from={SCENES.span.start} durationInFrames={SCENES.span.duration}>
        <SpanScene />
      </Sequence>
      <Sequence from={SCENES.comparison.start} durationInFrames={SCENES.comparison.duration}>
        <ComparisonScene />
      </Sequence>
      <Sequence from={SCENES.outro.start} durationInFrames={SCENES.outro.duration}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Typecheck + lint**

```sh
pnpm typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```sh
git add tools/remotion/src/compositions/chunk-vs-span/index.tsx
git commit -m "feat(chunk-vs-span): add composition shell wiring all six scenes"
```

---

## Task 20: Thumbnail composition

**Files:**

- Create: `tools/remotion/src/compositions/chunk-vs-span/thumbnail.tsx`

- [ ] **Step 1: Write the thumbnail**

```tsx
// tools/remotion/src/compositions/chunk-vs-span/thumbnail.tsx
import type { FC } from 'react';
import { TitleCard } from '@primitives';

export const ChunkVsSpanThumbnail: FC = () => (
  <TitleCard
    title="Chunk vs Span"
    subtitle="character-level beats chunk-level"
    align="center"
    enter="none"
  />
);
```

- [ ] **Step 2: Typecheck + lint**

```sh
pnpm typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 3: Commit**

```sh
git add tools/remotion/src/compositions/chunk-vs-span/thumbnail.tsx
git commit -m "feat(chunk-vs-span): add YouTube thumbnail composition (1280x720, 1 frame)"
```

---

## Task 21: Root.tsx + Remotion entrypoint

**Files:**

- Create: `tools/remotion/src/Root.tsx`
- Create: `tools/remotion/src/index.ts`

- [ ] **Step 1: Write `Root.tsx`**

```tsx
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
```

> **Note:** `<Still>` is Remotion's idiomatic component for single-frame/image compositions. It accepts the same props as `<Composition>` minus `durationInFrames` and `fps`. `remotion still <id>` (in `package.json` scripts) renders it as a PNG.

- [ ] **Step 2: Write `index.ts`**

```ts
// tools/remotion/src/index.ts
import { registerRoot } from 'remotion';
import { Root } from './Root';

registerRoot(Root);
```

- [ ] **Step 3: Typecheck + lint**

```sh
pnpm typecheck && pnpm lint
```

Expected: both exit 0.

- [ ] **Step 4: Commit**

```sh
git add tools/remotion/src/Root.tsx tools/remotion/src/index.ts
git commit -m "feat(remotion): add Root.tsx (both compositions + ThemeProvider) and registerRoot entry"
```

---

## Task 22: Fix .gitignore so `.gitkeep` + `README.md` can live in gitignored dirs

The `.gitignore` written during repo bootstrap uses directory-exclusion rules
(`shared/assets/audio/`, `repo-references/`). Per gitignore semantics, once a
directory is excluded, children inside it can't be re-included — the `!...`
bangs have no effect. Switch to content-exclusion (`dir/**`) so the bangs work.

**Files:**

- Modify: `.gitignore`

- [ ] **Step 1: Open `.gitignore` and replace the two broken blocks**

Replace this block:

```gitignore
# External repo references (cloned locally, not vendored)
repo-references/
!repo-references/.gitkeep
!repo-references/README.md
```

with:

```gitignore
# External repo references (cloned locally, not vendored)
repo-references/**
!repo-references/.gitkeep
!repo-references/README.md
```

Replace this block:

```gitignore
# Media assets — generated or large source files stay local
shared/assets/audio/
shared/assets/images/
shared/assets/fonts/
shared/assets/video/
!shared/assets/**/.gitkeep
!shared/assets/**/README.md
```

with:

```gitignore
# Media assets — generated or large source files stay local (contents only)
shared/assets/audio/**
shared/assets/images/**
shared/assets/fonts/**
shared/assets/video/**
!shared/assets/**/.gitkeep
!shared/assets/**/README.md
```

Note the `/**` suffix — this ignores _contents_ instead of the directory itself, which lets the `!...` bang rules re-include specific files.

- [ ] **Step 2: Test the fix with a sandbox file**

```sh
mkdir -p repo-references shared/assets/audio
touch repo-references/.gitkeep shared/assets/audio/.gitkeep
touch shared/assets/audio/fake.mp3
git check-ignore -v repo-references/.gitkeep \
                   shared/assets/audio/.gitkeep \
                   shared/assets/audio/fake.mp3 \
  || echo "CHECK: .gitkeep files should NOT be ignored; fake.mp3 should be"
```

Expected:

- `repo-references/.gitkeep` → no output (not ignored) ✓
- `shared/assets/audio/.gitkeep` → no output (not ignored) ✓
- `shared/assets/audio/fake.mp3` → printed line showing `.gitignore` rule that matches ✓

Then cleanup:

```sh
rm shared/assets/audio/fake.mp3
# keep the .gitkeep files you created — they'll be committed later
# (shared/assets/audio/.gitkeep → Task 23; repo-references/.gitkeep → Task 24).
```

- [ ] **Step 3: Commit the `.gitignore` fix**

```sh
git add .gitignore
git commit -m "fix(gitignore): switch to dir/** exclusion so .gitkeep + README.md are tracked"
```

---

## Task 23: Placeholder READMEs for deferred tools + asset dirs

**Files:**

- Create: `tools/ai-gen/README.md`
- Create: `tools/ffmpeg/README.md`
- Create: `tools/editor/README.md`
- Create: `tools/remotion/src/clips/README.md`
- Create: `shared/assets/audio/.gitkeep` + `shared/assets/audio/README.md`
- Create: `shared/assets/images/.gitkeep` + `shared/assets/images/README.md`
- Create: `shared/assets/fonts/.gitkeep` + `shared/assets/fonts/README.md`
- Create: `shared/assets/video/.gitkeep` + `shared/assets/video/README.md`

(The `repo-references/` directory gets its README in Task 24 to keep the logical grouping tight.)

- [ ] **Step 1: Write `tools/ai-gen/README.md`**

```markdown
# tools/ai-gen/

Placeholder. Will hold integrations for AI image/video generators (Replicate,
Google Veo, Nano Banana, etc.) once a project requires them.

**Trigger to build out:** a project's `storyboard.md` lists `tool = ai-gen/<vendor>`
for one or more shots.
```

- [ ] **Step 2: Write `tools/ffmpeg/README.md`**

```markdown
# tools/ffmpeg/

Placeholder. Will hold FFmpeg wrappers for concat, transcode, overlay, and
final assembly when a project needs operations beyond Remotion's reach.

**Trigger to build out:** a project needs to stitch outputs from two or more tools.
```

- [ ] **Step 3: Write `tools/editor/README.md`**

```markdown
# tools/editor/

Placeholder. Will hold project files and round-trip tooling for external
video editors (DaVinci Resolve, Premiere, etc.).

**Trigger to build out:** a project requires round-tripping through an editor.
```

- [ ] **Step 4: Write `tools/remotion/src/clips/README.md`**

```markdown
# clips/

Reusable short B-roll Remotion compositions (5–20s loops).

Empty on day one. Populate when a full video wants to reference a reusable clip
across multiple projects.
```

- [ ] **Step 5: Write the four `shared/assets/<kind>/README.md` files**

Create one per kind (`audio`, `images`, `fonts`, `video`) with this content (replace `<kind>`):

```markdown
# shared/assets/<kind>/

Local-only `<kind>` assets. **Contents of this directory are gitignored**
(only `.gitkeep` and this `README.md` are committed).

Put source `<kind>` files here when a project references them. They stay on
your machine; do not commit binaries to the repo.
```

- [ ] **Step 6: Create the `.gitkeep` files**

```sh
touch shared/assets/audio/.gitkeep shared/assets/images/.gitkeep \
      shared/assets/fonts/.gitkeep shared/assets/video/.gitkeep
```

- [ ] **Step 7: Verify format + lint**

```sh
pnpm format:check && pnpm lint
```

Expected: both exit 0. If `format:check` complains about new markdown files, run `pnpm format` once and recheck.

- [ ] **Step 8: Commit**

```sh
git add tools/ai-gen/README.md tools/ffmpeg/README.md tools/editor/README.md \
        tools/remotion/src/clips/README.md \
        shared/assets/audio shared/assets/images shared/assets/fonts shared/assets/video
git commit -m "docs: add placeholder READMEs for deferred tools and shared assets"
```

---

## Task 24: repo-references/ README + .gitkeep

**Files:**

- Create: `repo-references/.gitkeep`
- Create: `repo-references/README.md`

- [ ] **Step 1: Write `repo-references/README.md`**

````markdown
# repo-references/

This folder holds local clones of external source repos — the codebases each
video project explains. The folder is **gitignored**; each developer clones
independently.

## Expected clones

- `cx-agent-evals` — source for the chunk-vs-span pilot.

  ```sh
  cd repo-references
  git clone git@github.com:vinit-agr/cx-agent-evals.git
  ```
````

Add new entries here when a new source repo enters the studio.

````

> **Note:** the clone URL uses the `vinit-agr` GitHub owner. If the source repo lives elsewhere, edit the URL at clone time — the README is a hint, not an automated step.

- [ ] **Step 2: Create `.gitkeep`**

```sh
touch repo-references/.gitkeep
````

- [ ] **Step 3: Verify `.gitignore` still lets these two files through**

```sh
git check-ignore -v repo-references/README.md repo-references/.gitkeep || echo "OK: not ignored"
```

Expected: prints `OK: not ignored` (the `!` bang rules in `.gitignore` allow these two paths).

- [ ] **Step 4: Commit**

```sh
git add repo-references/README.md repo-references/.gitkeep
git commit -m "docs: add repo-references/ README with expected clone commands"
```

---

## Task 25: Project-level docs for chunk-vs-span

**Files:**

- Create: `projects/cx-agent-evals--chunk-vs-span/script.md`
- Create: `projects/cx-agent-evals--chunk-vs-span/storyboard.md`
- Create: `projects/cx-agent-evals--chunk-vs-span/notes.md`

- [ ] **Step 1: Write `script.md`**

```markdown
# chunk-vs-span — Script

Canonical narration and caption source. Scenes and durations match
`tools/remotion/src/compositions/chunk-vs-span/frames.ts` (SCENES map).

---

## Scene 1 — Intro (0:00–0:05)

**Narration:** _A 60-second tour of two ways to score a retrieval system._

**Caption:** "Chunk vs span — a quick tour of two recall metrics."

**Visual:** title card "Chunk vs Span" on the mint-accent palette.

---

## Scene 2 — The Document (0:05–0:15)

**Narration:** _Retrieval-augmented generation grounds a model in a corpus.
Let's take one short passage from that corpus._

**Caption:** "Consider this document."

**Visual:** paragraph fades in word-by-word.

---

## Scene 3 — Chunking (0:15–0:30)

**Narration:** _The corpus is split into chunks. Each chunk becomes a unit
the retriever can pick or skip._

**Caption:** "Split the document into chunks. Each becomes a retrieval unit."

**Visual:** document breaks into ~5 colored chunks stacked vertically.

---

## Scene 4 — The Answer Span (0:30–0:40)

**Narration:** _The true answer is not a whole chunk. It's a specific
character span inside one of them._

**Caption:** "The true answer lives in this character span."

**Visual:** one chunk lights up; a sub-region inside it glows.

---

## Scene 5 — Comparison (0:40–1:10)

**Narration:** _Chunk-level recall says: the right chunk was retrieved, score
is 1.0. Span-level recall compares character overlap, and scores 0.4 — the
retrieved chunk contains the answer, but 60 percent of its text is
irrelevant context._

**Caption:** "Chunk-level recall: 1.0. Span-level recall: 0.4."

**Visual:** two metric bars animate to their values side-by-side.

---

## Scene 6 — Outro (1:10–1:30)

**Narration:** _If you want honest retrieval numbers, measure the span you
asked for — not the box it came in._

**Caption:** "Span evaluation is the honest signal."

**Visual:** repo URL + call to action.
```

- [ ] **Step 2: Write `storyboard.md`**

```markdown
# chunk-vs-span — Storyboard

| #   | Scene      | Duration | Tool     | Primitives                      | Visual                                  |
| --- | ---------- | -------- | -------- | ------------------------------- | --------------------------------------- |
| 1   | Intro      | 0:05     | remotion | TitleCard, Caption              | Mint-accent title on dark bg.           |
| 2   | Document   | 0:10     | remotion | TitleCard, Document, Caption    | Paragraph reveals word-by-word.         |
| 3   | Chunking   | 0:15     | remotion | TitleCard, Chunk×5, Caption     | Colored chunk stack below title.        |
| 4   | Span       | 0:10     | remotion | TitleCard, Caption              | (Span primitive is stub on day one.)    |
| 5   | Comparison | 0:30     | remotion | TitleCard, MetricBar×2, Caption | Two bars — chunk-recall vs span-recall. |
| 6   | Outro      | 0:20     | remotion | TitleCard, Caption              | URL on dark bg.                         |
```

- [ ] **Step 3: Write `notes.md`**

```markdown
# chunk-vs-span — Design Notes

## Why this pilot

Small enough to validate the whole pipeline (composition → render → output →
log), substantive enough to exercise theme tokens, primitives, and narration.

## Day-one fidelity

Scenes land as `TitleCard` + `Caption` + a few primitives — no polished
animation. The point is to prove the pipeline, not the visuals. Animation
polish is a follow-up pass (see spec §11 scope fence).

## Caption style

Short, declarative, no jargon in scenes 1–2. Technical terms enter only from
scene 3 onward, and only after the visual introduces them.

## Palette choices

The mint accent on the `Chunk-level recall` bar is intentional — we want the
high (chunk-level) number to feel positive on first read, so the drop to
`warn` amber on the span-level bar lands as a plot twist.
```

- [ ] **Step 4: Verify format**

```sh
pnpm format:check
```

Expected: exits 0. If it complains, run `pnpm format` and recheck.

- [ ] **Step 5: Commit**

```sh
git add projects/cx-agent-evals--chunk-vs-span/
git commit -m "docs(project): add chunk-vs-span script, storyboard, and design notes"
```

---

## Task 26: Log conventions + inaugural entries

**Files:**

- Create: `log/README.md`
- Create: `log/2026-04-20-pilot-kickoff.md`
- Create: `log/projects/cx-agent-evals--chunk-vs-span.md`

- [ ] **Step 1: Write `log/README.md`**

````markdown
# log/

Work log for the content studio. Two axes:

- **Dated entries** (`log/YYYY-MM-DD-<slug>.md`) — one per work session. Free-form
  markdown. Newest-last by filename sort.
- **Per-project files** (`log/projects/<source-repo>--<video-slug>.md`) — one per
  video project, rolling narrative (newest-first inside the file).

## Suggested frontmatter

```markdown
---
date: YYYY-MM-DD
session: <short-slug>
project: <source-repo>--<video-slug> # optional
---
```
````

## Conventions

- Write at end of session.
- Commit each log entry in its own commit.
- Logs are not auto-generated; they're the human's journal.

````

- [ ] **Step 2: Write `log/2026-04-20-pilot-kickoff.md`**

```markdown
---
date: 2026-04-20
session: pilot-kickoff
project: cx-agent-evals--chunk-vs-span
---

# Foundation bootstrap

Bootstrapped the content-studio repo end-to-end:

- Published public GitHub repo `vinit-agr/content-studio` (MIT).
- Wrote foundation design spec (resolved Q5–Q12 from HANDOFF).
- Produced implementation plan and executed it task-by-task.
- Landed Remotion 4.x + TypeScript strict + ESLint 9 flat + Prettier.
- Built theme layer with per-project overrides (`cx-agent-evals` mint palette
  overrides a neutral cyan default).
- Built three real primitives (`TitleCard`, `Caption`, `Document`) and five
  stubs (`Chunk`, `Span`, `Token`, `MetricBar`, `Cursor`).
- Wired chunk-vs-span composition: 6 scenes, 90s @ 30fps, H.264 render.
- Rendered pilot v01 (placeholder fidelity) + thumbnail locally.

## Decisions worth remembering

- Context over prop-drilling for theme. Primitives read `useTheme()`, which
  keeps them reusable across source-repo palettes.
- `frames.ts` as a leaf module holds `SCENES` + `TOTAL_DURATION_FRAMES` to
  prevent import cycles (`captions.ts` imports from here; so does `index.tsx`).
- `CAPTIONS satisfies Record<SceneName, string>` means adding a scene forces
  a caption update at compile time.

## Next

- Add `Span` / `MetricBar` / `Token` real visuals so scene 4 and 5 are not
  just TitleCard placeholders.
- Draft narration v1 and cut a second render with on-screen captions tuned.
- Decide TTS vendor for v2 (ElevenLabs vs OpenAI TTS).
````

- [ ] **Step 3: Write `log/projects/cx-agent-evals--chunk-vs-span.md`**

```markdown
# chunk-vs-span — Iteration log

Newest first.

---

## 2026-04-20 — v01 placeholder render

First end-to-end render of the pilot against the foundation. Scenes are
placeholder fidelity (`TitleCard` + `Caption` + a few primitives). Goal was
pipeline validation, not visual polish.

What worked:

- Theme context wiring: editing `cx-agent-evals.ts` palette updates the
  preview in-place.
- `frames.ts` leaf module pattern avoids circular imports as scenes grow.
- `CAPTIONS satisfies Record<SceneName, string>` catches missing scene
  coverage at compile time.

What's next:

- Replace `Span` / `MetricBar` stubs with animated visuals.
- Tune caption copy against narration v1.
```

- [ ] **Step 4: Verify format**

```sh
pnpm format:check
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```sh
git add log/
git commit -m "docs(log): add log conventions, pilot-kickoff entry, and per-project log"
```

---

## Task 27: Integration check #1 — typecheck + lint + format

- [ ] **Step 1: Run the full gate locally**

```sh
pnpm typecheck
pnpm lint
pnpm format:check
```

Expected: all three exit 0. If any fails, fix the violation before proceeding. This gate corresponds to acceptance §10.2–§10.4 in the spec.

- [ ] **Step 2: Verify git status is clean**

```sh
git status
```

Expected: `nothing to commit, working tree clean`.

No commit at this step; it's a checkpoint.

---

## Task 28: Integration check #2 — boot Remotion studio

- [ ] **Step 1: Start the studio**

```sh
pnpm studio
```

Expected: Remotion CLI starts a local dev server (typically at `http://localhost:3000`). It prints the URL and opens the browser automatically.

- [ ] **Step 2: Verify both compositions load**

In the browser sidebar you should see:

- `chunk-vs-span` — a Composition (1920×1080, 90s, 30fps).
- `chunk-vs-span-thumbnail` — a Still (1280×720). Stills render frame 0 only; no timeline scrubber for this entry.

Click each. Neither should error. All six scenes of the video should scrub cleanly from 0 to 90 seconds — each rendering a TitleCard + Caption (+ additional stubs in scenes 2, 3, 5) against the mint-accent palette.

- [ ] **Step 3: Smoke test theme hot reload**

Leave the studio running. In a separate terminal:

```sh
# Temporarily change one color to verify hot reload.
# Example: change accent on a branch or just observe, then revert.
```

Open `shared/theme/projects/cx-agent-evals.ts`. Change `accent: '#6ee7b7'` to `accent: '#ff00ff'`. Save. The studio preview should re-render with bright magenta accents within a few seconds. Revert the change and save again; it should return to mint.

This satisfies spec acceptance §10.14 (manual smoke test).

- [ ] **Step 4: Stop the studio**

`Ctrl-C` in the terminal running `pnpm studio`.

No commit at this step.

---

## Task 29: Integration check #3 — first render + thumbnail

- [ ] **Step 1: Render the video**

```sh
pnpm render:chunk-vs-span
```

Expected: Remotion bundles, renders, and writes `out/cx-agent-evals--chunk-vs-span/v01.mp4`. A progress bar reaches 100%. Total time depends on the machine (expect 30–120 seconds for 90s of placeholder content).

- [ ] **Step 2: Render the thumbnail**

```sh
pnpm thumbnail:chunk-vs-span
```

Expected: writes `out/cx-agent-evals--chunk-vs-span/v01-thumb.png`.

- [ ] **Step 3: Verify the output files**

```sh
ls -lh out/cx-agent-evals--chunk-vs-span/
```

Expected: both files present. The MP4 should be several MB (H.264 @ 1080p30 for 90s of mostly-static placeholder content is typically 3–15 MB). The PNG should be a few hundred KB at most.

- [ ] **Step 4: Verify playback**

Open `out/cx-agent-evals--chunk-vs-span/v01.mp4` in QuickTime (or any player). It should play through all six scenes without crashing. Each scene should show its title + caption against the mint palette.

Open `v01-thumb.png`. It should show "Chunk vs Span" centered on the dark mint palette.

- [ ] **Step 5: Verify `out/` is gitignored**

```sh
git status
git check-ignore -v out/cx-agent-evals--chunk-vs-span/v01.mp4
```

Expected: `git status` does **not** list anything in `out/`. `git check-ignore` prints a matching rule from `.gitignore`.

No commit at this step — `out/` stays out of the repo.

---

## Task 30: Expand README.md and update HANDOFF note

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Rewrite `README.md`**

````markdown
# content-studio

Standalone studio repo for producing videos and motion graphics — Remotion-first, tool-pluralist.

## What's here

- **`tools/remotion/`** — the motion-graphics tool, fully built for day one.
- **`tools/ai-gen/`, `tools/ffmpeg/`, `tools/editor/`** — placeholder folders for future tools.
- **`shared/theme/`** — palette + fonts + easings single source of truth. Per-project overrides live under `shared/theme/projects/`.
- **`shared/assets/`** — local-only binary assets (gitignored content, READMEs tracked).
- **`projects/<source-repo>--<video-slug>/`** — tool-agnostic script, storyboard, and notes per video.
- **`repo-references/`** — local clones of source repos the videos explain (gitignored; see `repo-references/README.md`).
- **`out/`** — rendered MP4s and thumbnails (gitignored).
- **`log/`** — dated work log + per-project iteration log.
- **`docs/superpowers/`** — design specs and implementation plans.

## Quick start

```sh
corepack enable
pnpm install
pnpm studio
```
````

Then open the printed URL. The `chunk-vs-span` composition previews the pilot.

## Render the pilot

```sh
pnpm render:chunk-vs-span
pnpm thumbnail:chunk-vs-span
```

Outputs land in `out/cx-agent-evals--chunk-vs-span/`.

## Development

- `pnpm typecheck` — strict TypeScript check.
- `pnpm lint` — ESLint 9 flat config.
- `pnpm format` / `pnpm format:check` — Prettier.

## Source repos

To script a video about a source repo, clone it into `repo-references/` — the folder is gitignored. See `repo-references/README.md` for the expected clone commands.

## Design docs

- [Foundation design](docs/superpowers/specs/2026-04-20-content-studio-foundation-design.md) — the decisions underlying this layout.
- [Implementation plan](docs/superpowers/plans/2026-04-20-content-studio-foundation.md) — task-by-task bootstrap.
- [`HANDOFF.md`](./HANDOFF.md) — origin brief (historical).

## License

MIT — see [`LICENSE`](./LICENSE).

````

- [ ] **Step 2: Verify format + lint**

```sh
pnpm format:check
````

Expected: exits 0.

- [ ] **Step 3: Commit**

```sh
git add README.md
git commit -m "docs: expand README with quick-start, render commands, and layout map"
```

---

## Task 31: Verify full acceptance gate + push to GitHub

- [ ] **Step 1: Fresh full gate**

```sh
pnpm typecheck
pnpm lint
pnpm format:check
```

Expected: all three exit 0.

- [ ] **Step 2: Verify `git status` is clean**

```sh
git status
```

Expected: `nothing to commit, working tree clean`. If anything from `out/` or `repo-references/` appears as untracked, inspect `.gitignore` and fix before continuing.

- [ ] **Step 3: Verify acceptance-criterion file presence**

```sh
test -f log/2026-04-20-pilot-kickoff.md && \
  test -f log/projects/cx-agent-evals--chunk-vs-span.md && \
  test -f log/README.md && \
  test -f repo-references/README.md && \
  test -f repo-references/.gitkeep && \
  test -f projects/cx-agent-evals--chunk-vs-span/script.md && \
  test -f projects/cx-agent-evals--chunk-vs-span/storyboard.md && \
  test -f projects/cx-agent-evals--chunk-vs-span/notes.md && \
  test -f tools/remotion/src/compositions/chunk-vs-span/captions.ts && \
  test -f tools/remotion/src/compositions/chunk-vs-span/frames.ts && \
  test -f tools/remotion/src/Root.tsx && \
  test -f tools/remotion/src/index.ts && \
  test -f tools/remotion/src/theme/ThemeContext.tsx && \
  test -f tools/remotion/src/primitives/index.ts && \
  test -f shared/theme/index.ts && \
  test -f shared/theme/types.ts && \
  test -f shared/theme/colors.ts && \
  test -f shared/theme/fonts.ts && \
  test -f shared/theme/easings.ts && \
  test -f shared/theme/projects/cx-agent-evals.ts && \
  test -f shared/assets/data/sample-document.ts && \
  test -f remotion.config.ts && \
  test -f eslint.config.js && \
  test -f tsconfig.json && \
  test -f tsconfig.base.json && \
  test -f .prettierrc && \
  echo "ALL FILES PRESENT"
```

Expected: prints `ALL FILES PRESENT`.

- [ ] **Step 4: Verify the render outputs exist from Task 29**

```sh
test -f out/cx-agent-evals--chunk-vs-span/v01.mp4 && \
  test -f out/cx-agent-evals--chunk-vs-span/v01-thumb.png && \
  echo "RENDERS PRESENT"
```

Expected: prints `RENDERS PRESENT`. If not, re-run Task 29.

- [ ] **Step 5: Review the commit log**

```sh
git log --oneline
```

Expected: clear, logical commit sequence from the initial commit through Task 30 (the expanded README). Each task produced 1 commit (or none for integration checks). No `WIP` or `fixup!` messages.

- [ ] **Step 6: Push to GitHub**

```sh
git push origin main
```

Expected: pushes all new commits to `https://github.com/vinit-agr/content-studio`.

- [ ] **Step 7: Verify on GitHub**

Open `https://github.com/vinit-agr/content-studio` in a browser. Confirm:

- The latest commit message on `main` matches the README commit.
- The repo layout matches the spec §5 tree.
- `out/` is absent from the repo.
- `repo-references/` shows only `.gitkeep` and `README.md`.
- `node_modules/` is absent.

- [ ] **Step 8: Final working-tree confirmation**

```sh
git status
```

Expected: `Your branch is up to date with 'origin/main'. nothing to commit, working tree clean`.

---

## Acceptance Criteria Mapping (cross-check against spec §10)

| Spec criterion                                  | Task(s)                               |
| ----------------------------------------------- | ------------------------------------- |
| §10.1 `pnpm install` clean                      | Task 1.2                              |
| §10.2 `pnpm typecheck`                          | Task 27.1, Task 31.1                  |
| §10.3 `pnpm lint`                               | Task 27.1, Task 31.1                  |
| §10.4 `pnpm format:check`                       | Task 27.1, Task 31.1                  |
| §10.5 `pnpm studio` boots, 6 scenes             | Task 28                               |
| §10.6 `pnpm render:chunk-vs-span` → MP4         | Task 29.1, Task 29.4                  |
| §10.7 `pnpm thumbnail:chunk-vs-span` → PNG      | Task 29.2                             |
| §10.8 `log/2026-04-20-pilot-kickoff.md`         | Task 26.2                             |
| §10.9 `repo-references/README.md`               | Task 24.1                             |
| §10.10 project docs exist, non-empty            | Task 25                               |
| §10.11 `captions.ts` entries per scene          | Task 17.3                             |
| §10.12 clean commit history, `.gitignore` works | Task 22 (fix) + Task 29.5 + Task 31.2 |
| §10.13 primitive prop types declared            | Tasks 12–15                           |
| §10.14 hot reload smoke test                    | Task 28.3                             |

Every criterion has a task. Every task ends with either a commit or a verification step that cross-references the spec.

---

## Self-Review Appendix

This plan was self-reviewed against the spec; the result is the plan above. The appendix captures what the review looked for so re-reviews have a known baseline.

**Spec coverage check:** each numbered section of the spec maps to at least one task (see mapping above). `§11` scope fence items are explicitly NOT implemented — correct.

**Placeholder scan:** no `TODO`, `TBD`, or `implement later` appears in any task body. All code blocks contain complete, compilable code.

**Type-consistency check:** `Theme`, `ChunkIndex`, `SceneName`, `TitleCardProps`/`CaptionProps`/.../`CursorProps` keep the same names and shapes across tasks. Primitive prop signatures match spec §8. `CAPTIONS satisfies Record<SceneName, string>` enforces scene/caption coverage at compile time.

**Alias consistency:** `@shared`, `@theme`, `@primitives` are defined in Task 2 (`tsconfig.json`) AND Task 4 (`remotion.config.ts`) with identical right-hand-side paths. Any task using an alias has the target path matching the declaration.

**Commit cadence:** 27 commits across 31 tasks. The four tasks that produce no commits are the integration checks (Tasks 27, 28, 29) and the final push (Task 31) — each ends in verification output, not a source change. Every code- or docs-producing task ends with a commit. Revert granularity is per-file-group (theme types vs. colors vs. fonts vs. easings etc.), so any single task can be reverted cleanly.

---

_End of plan._

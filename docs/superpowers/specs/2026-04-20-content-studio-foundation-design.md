# Content Studio — Foundation Design

**Date:** 2026-04-20
**Status:** approved (iter 3 — implementation-ready)
**Author:** Vinit Agrawal (with Claude)
**Related:** [`HANDOFF.md`](../../../HANDOFF.md) (origin brief, decisions 1–7 locked there)

---

## 1. Goal

Bootstrap a standalone Git repo (`content-studio`) capable of producing a pilot explainer video end-to-end: composition → preview → MP4 render → thumbnail → local output. The foundation is Remotion-first, tool-pluralist (other tools are folder placeholders), and tool-agnostic at the project level so future videos can assemble shots from multiple tools.

The pilot subject is `chunk-vs-span` — a 60–90s technical video explaining why character-span evaluation beats chunk-level for RAG retrieval. Source repo: `cx-agent-evals`.

## 2. Non-Goals

This spec covers the foundation only. Out of scope:

- Polished pilot visuals (scenes ship as placeholder content; animation polish is follow-up work).
- ffmpeg, AI generation, external editor integrations (folders exist, READMEs only).
- Audio: no narration, TTS, or music bed wiring.
- `timeline.json` schema and multi-tool assembly (not needed until a second tool lands).
- Cloud output (R2/S3) and YouTube upload automation.
- CI, formal tests, GitHub Actions.
- Second video or second source repo.
- Theme sync automation between cx-agent-evals and the studio palette.

See §11 (Scope Fence) for the full deferred list.

## 3. Locked Decisions (from HANDOFF.md)

These are not re-litigated here. Summary:

1. Both clip library and full videos.
2. 16:9 / 1920×1080 for YouTube; technical-dev audience.
3. Pilot: `chunk-vs-span`, 60–90s, sourced from cx-agent-evals.
4. Standalone repo, not nested; source repos live in gitignored `repo-references/`.
5. Remotion is the first tool, fully built. Other tools: placeholder folders with READMEs.
6. Folder structure per HANDOFF §6, amended in §5 below.
7. Single pnpm package at repo root.

## 4. Resolved Open Questions

| #    | Topic                        | Decision                                                                                                                         |
| ---- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Q5   | `repo-references/` mechanism | **A** — plain `git clone` into gitignored folder; README lists expected clones.                                                  |
| Q6   | Theme sync                   | **C** — per-project theme files (hand-written). No sync script yet.                                                              |
| Q7   | Work-log format              | **A** — dated narrative entries in `log/` + per-project files in `log/projects/` + `log/README.md` conventions.                  |
| Q8   | Project naming               | **A** — flat `<source-repo>--<video-slug>` (double-dash separator).                                                              |
| Q9   | Audio / narration            | **D → B** — pilot v1 captions-only, no audio pipeline on day one; v2 adds AI TTS (vendor chosen at v2 time). Music bed deferred. |
| Q10a | Render output location       | **B** — local `out/` only; manual YouTube upload.                                                                                |
| Q10b | Codec                        | **A** — H.264 1080p30 MP4, AAC audio.                                                                                            |
| Q10c | Thumbnail                    | **A** — rendered as a Remotion composition (1280×720, 1 frame).                                                                  |
| Q11  | Dependencies                 | See §6.                                                                                                                          |
| Q12  | Repo name                    | `content-studio`, already published at `github.com/vinit-agr/content-studio`.                                                    |

## 5. Repo Layout

```
content-studio/
  README.md                        # expanded in plan
  LICENSE                          # MIT
  HANDOFF.md                       # origin brief (kept for provenance)
  .gitignore
  .prettierrc
  eslint.config.js                 # ESLint v9 flat config (ESM)
  package.json                     # ESM, "type":"module"
  pnpm-lock.yaml                   # generated
  tsconfig.json
  tsconfig.base.json
  remotion.config.ts               # 1920×1080, 30fps, H.264

  tools/
    remotion/
      src/
        Root.tsx                   # registers compositions, wraps in ThemeProvider
        index.ts                   # registerRoot(Root)
        theme/
          index.ts                 # re-exports from shared/theme
          ThemeContext.tsx         # React context + useTheme() hook
        primitives/
          index.ts
          TitleCard.tsx            # built
          Caption.tsx              # built
          Document.tsx             # built
          Chunk.tsx                # stub
          Span.tsx                 # stub
          Token.tsx                # stub
          MetricBar.tsx            # stub
          Cursor.tsx               # stub
        clips/
          README.md                # empty, placeholder
        compositions/
          chunk-vs-span/
            index.tsx              # composition shell (imports SCENES, registers scenes)
            frames.ts              # leaf module: SCENES + TOTAL_DURATION_FRAMES
            captions.ts            # per-scene Caption text constants (see §8)
            scenes/
              01-intro.tsx
              02-document.tsx
              03-chunking.tsx
              04-span.tsx
              05-comparison.tsx
              06-outro.tsx
            thumbnail.tsx
            # NOTE: no script.md / notes.md here — single source of truth
            # lives under projects/cx-agent-evals--chunk-vs-span/ (see §9.3)
    ai-gen/README.md               # placeholder
    ffmpeg/README.md               # placeholder
    editor/README.md               # placeholder

  shared/
    theme/
      index.ts
      types.ts                     # Theme type + chunk-color indexer
      colors.ts                    # base palette (dark default)
      fonts.ts                     # JetBrains Mono via @remotion/google-fonts
      easings.ts                   # fade-in, slide-in, pulse-dot, span-glow
      projects/
        cx-agent-evals.ts          # hand-written from HANDOFF palette
    assets/
      audio/{.gitkeep,README.md}   # content gitignored
      images/{.gitkeep,README.md}  # content gitignored
      fonts/{.gitkeep,README.md}   # content gitignored
      video/{.gitkeep,README.md}   # content gitignored
      data/
        sample-document.ts         # committed — exports SAMPLE_DOCUMENT (string)

  projects/
    cx-agent-evals--chunk-vs-span/
      script.md
      storyboard.md                # tool-agnostic shot-by-shot
      notes.md

  repo-references/
    .gitkeep
    README.md                      # instructions: git clone ... for each source repo

  out/                             # gitignored; created at first render

  log/
    README.md                      # conventions (see §9)
    2026-04-20-pilot-kickoff.md    # inaugural entry
    projects/
      cx-agent-evals--chunk-vs-span.md

  docs/
    superpowers/
      specs/
        2026-04-20-content-studio-foundation-design.md
```

**Changes vs. HANDOFF §6:**

- Added `shared/theme/projects/` (Q6 decision).
- Added `shared/theme/index.ts`, `shared/theme/fonts.ts`, `shared/theme/easings.ts`, `shared/theme/types.ts` as first-class files.
- Added `tools/remotion/src/theme/ThemeContext.tsx` (propagation mechanism — see §7).
- Added `tools/remotion/src/primitives/index.ts` and `clips/README.md`.
- Added `shared/assets/video/` and `shared/assets/data/`; `data/sample-document.ts` is committed (a TS constant exporting a string — see §8).
- Added `.prettierrc`, `eslint.config.js`, `tsconfig.base.json`.
- **Removed** HANDOFF's `tools/remotion/src/compositions/<video>/{script.md,notes.md}`. Single source of truth for narration/notes is `projects/<source-repo>--<video-slug>/` (tool-agnostic). Composition-local `captions.ts` holds the Caption strings consumed by scene TSX; it references `projects/.../script.md` as the canonical source in a header comment.
- Deferred `timeline.json`, `projects/*/sources/`, `projects/*/thumbnail/` until ffmpeg lands. Pilot thumbnail lives inline with its composition.

## 6. Tooling & Dependencies

**`package.json` (abbreviated):**

- `"type": "module"`, `"packageManager": "pnpm@9.12.0"`, `"engines": { "node": ">=20" }`, `"private": true`.
- Runtime: `react@^18.3`, `react-dom@^18.3`, `remotion@^4`, `@remotion/cli@^4`, `@remotion/bundler@^4`, `@remotion/renderer@^4`, `@remotion/google-fonts@^4`.
- Dev: `typescript@^5.6`, `@types/node@^20`, `@types/react@^18.3`, `@types/react-dom@^18.3`, `prettier@^3.3`, `eslint@^9`, `typescript-eslint@^8` (the v8+ flat-config umbrella package), `globals@^15`.
- Scripts:
  - `studio` → `remotion studio`
  - `render:chunk-vs-span` → `remotion render chunk-vs-span out/cx-agent-evals--chunk-vs-span/v01.mp4`
  - `thumbnail:chunk-vs-span` → `remotion still chunk-vs-span-thumbnail out/cx-agent-evals--chunk-vs-span/v01-thumb.png`
  - `typecheck` → `tsc --noEmit`
  - `lint` → `eslint .`
  - `format` / `format:check` → `prettier --write .` / `prettier --check .`

**`tsconfig.base.json`:** ES2022 / ESNext modules / Bundler resolution, `strict: true`, `noUncheckedIndexedAccess: true`, `isolatedModules: true`, `jsx: "react-jsx"`.

**`tsconfig.json`:** extends base; declares path aliases `@shared/*`, `@primitives/*`, `@theme/*`; `include: ["tools/**/*", "shared/**/*", "remotion.config.ts"]`; `exclude: ["node_modules", "out", "repo-references", "dist"]`.

**Path aliases:** TS aliases are matched by a webpack alias block in `remotion.config.ts` so Remotion's bundler resolves them at preview and render time. Both lists must stay in lockstep.

**`remotion.config.ts` sketch:**

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

**`eslint.config.js` (flat ESM):**

- Uses `typescript-eslint`'s flat-config helpers (`tseslint.config(...)`).
- Extends `eslint:recommended` + `tseslint.configs.recommended`.
- Ignores `out/`, `node_modules/`, `repo-references/`, `dist/`, `pnpm-lock.yaml`.
- Rules: `@typescript-eslint/no-unused-vars`: `warn` with `{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' }` (stubs reference props they don't yet use).
- `languageOptions.globals`: Node + browser via `globals` package.

**`.prettierrc`:** semi, single quotes, trailing comma all, print width 100, arrow parens always.

## 7. Theme Architecture

**File layout:**

- `shared/theme/types.ts` — exports the canonical `Theme` type: `{ bg, bgElevated, bgSurface, bgHover, border, borderBright, text, textMuted, textDim, accent, accentDim, accentBright, warn, error, chunks: readonly [string, string, string, string, string] }`. Also exports a `ChunkIndex = 0 | 1 | 2 | 3 | 4` helper type.
- `shared/theme/colors.ts` — exports `defaultTheme: Theme`, the base dark palette. Satisfies `Theme` via `satisfies` clause so downstream palettes stay in sync.
- `shared/theme/fonts.ts` — exports `loadFonts()` (calls `loadFont()` from `@remotion/google-fonts/JetBrainsMono`) and constants `fontFamily` (`'JetBrains Mono'`) + `monoStack` (`"'JetBrains Mono', 'Fira Code', 'SF Mono', monospace"`). `loadFonts()` is called once in `Root.tsx`.
- `shared/theme/easings.ts` — exports named easings `fadeIn`, `slideIn`, `pulseDot`, `spanGlow`, each carrying its duration (in frames at 30fps) and a function that consumes the current frame + a start frame and returns a `React.CSSProperties` patch (opacity, transform, boxShadow). Implementation substrate is Remotion's `interpolate()` and `spring()`. Exact factoring is locked in the plan (see §13.2) — this spec fixes the _name_, _duration_, and _consumer contract_ but not the internal shape.
- `shared/theme/projects/cx-agent-evals.ts` — hand-written from HANDOFF's "Reference theme" block. Exports `cxAgentEvalsTheme: Theme` (satisfies `Theme`).
- `shared/theme/index.ts` — re-exports `Theme`, `ChunkIndex`, `defaultTheme`, `loadFonts`, `fontFamily`, `monoStack`, `easings`.

**Propagation:**

React Context. One `ThemeContext` defined in `tools/remotion/src/theme/ThemeContext.tsx`, exporting a `<ThemeProvider theme={...}>` and a `useTheme()` hook. `Root.tsx` wraps each composition's render with the relevant theme (`cxAgentEvalsTheme` for cx-agent-evals videos; `defaultTheme` otherwise). Primitives and scenes call `useTheme()` to read colors. No direct imports of palette constants from inside primitives — this guarantees primitives remain reusable across source-repo themes without edits.

**Why context, not prop-drilling or module constants:**

- Prop-drilling through 6 scenes and 8 primitives is noisy and error-prone.
- Module-level constant selection requires primitives to know which source repo they belong to, which violates the "primitives are theme-agnostic" invariant.
- React context is the Remotion-idiomatic pattern (Remotion itself uses context for timeline state).

## 8. Pilot Composition Scaffold

**Composition registration** (`Root.tsx`):

```tsx
// tools/remotion/src/Root.tsx (sketch)
import { Composition } from 'remotion';
import { ThemeProvider } from './theme/ThemeContext';
import { cxAgentEvalsTheme } from '@theme/projects/cx-agent-evals';
import { loadFonts } from '@theme/fonts';
import { ChunkVsSpan } from './compositions/chunk-vs-span';
import { ChunkVsSpanThumbnail } from './compositions/chunk-vs-span/thumbnail';
import { TOTAL_DURATION_FRAMES } from './compositions/chunk-vs-span/frames';

loadFonts(); // module-load-time, not per-composition

const withTheme =
  <P,>(Inner: React.ComponentType<P>): React.FC<P> =>
  (props) => (
    <ThemeProvider theme={cxAgentEvalsTheme}>
      <Inner {...props} />
    </ThemeProvider>
  );

export const Root: React.FC = () => (
  <>
    <Composition
      id="chunk-vs-span"
      component={withTheme(ChunkVsSpan)}
      durationInFrames={TOTAL_DURATION_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="chunk-vs-span-thumbnail"
      component={withTheme(ChunkVsSpanThumbnail)}
      durationInFrames={1}
      fps={30}
      width={1280}
      height={720}
    />
  </>
);
```

- `loadFonts()` runs once at module-load, not inside components. Remotion hot-reloads the module on edits, which re-runs `loadFont()` idempotently.
- `withTheme` is a tiny HOC so both the video and the thumbnail get `ThemeProvider` without repeating it. If future compositions need a different theme, `Root.tsx` uses a different wrapper.

**Frame map** (`compositions/chunk-vs-span/frames.ts` — leaf module, no other imports):

```ts
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
```

Rationale for extracting to its own file: `captions.ts` imports `SceneName` to enforce one-entry-per-scene; `index.tsx` imports `SCENES` for Sequence wrapping; `Root.tsx` imports `TOTAL_DURATION_FRAMES`. Putting this data in a leaf module avoids any import cycle as the scene graph grows.

`index.tsx` wraps each scene in `<Sequence from={SCENES[name].start} durationInFrames={SCENES[name].duration}>` and contains a runtime assertion that verifies `Σ duration === TOTAL_DURATION_FRAMES` and that scenes are contiguous (end of one = start of next).

**Primitive prop surfaces** (stable day-one, even for stubs):

```ts
// All primitives accept an optional `style` and `className`.
// Every prop is explicitly typed on day one so stubs don't leak `any`.

type TitleCardProps = {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left'; // default 'center'
  enter?: 'fade' | 'slide' | 'none'; // default 'fade'
  style?: React.CSSProperties;
  className?: string;
};

type CaptionProps = {
  text: string;
  position?: 'bottom' | 'top' | 'inline'; // default 'bottom'
  enter?: 'fade' | 'slide' | 'none'; // default 'slide'
  style?: React.CSSProperties;
};

type DocumentProps = {
  text: string; // full body
  reveal?: 'instant' | 'byChar' | 'byWord'; // default 'instant'
  revealStartFrame?: number; // default 0 (composition-relative)
  revealDurationFrames?: number; // required if reveal !== 'instant'
  style?: React.CSSProperties;
};

type ChunkProps = {
  // STUB
  index: number; // 0-based chunk index; maps to theme.chunks[index % 5]
  text: string;
  label?: string; // e.g. "C1"
  style?: React.CSSProperties;
};

type SpanProps = {
  // STUB
  text: string; // span text content
  glow?: boolean; // spanGlow animation
  style?: React.CSSProperties;
};

type TokenProps = {
  // STUB
  text: string;
  highlighted?: boolean;
  style?: React.CSSProperties;
};

type MetricBarProps = {
  // STUB
  label: string;
  value: number; // 0..1
  color?: keyof Theme; // default 'accent'
  style?: React.CSSProperties;
};

type CursorProps = {
  // STUB
  blinking?: boolean; // default true
  style?: React.CSSProperties;
};
```

Each stub renders a dashed outline with its name + a one-line HTML comment `<!-- stub: <intended behavior> -->`. Rationale: stable prop surfaces now = zero type churn when the stub is upgraded to a real implementation later.

**Scene file contract:** each scene is a pure React component, e.g.:

```tsx
// scenes/01-intro.tsx
import { Caption, TitleCard } from '@primitives';
import { CAPTIONS } from '../captions';

export const IntroScene: React.FC = () => (
  <>
    <TitleCard title="Chunk vs Span" subtitle="Intro (0–5s)" />
    <Caption text={CAPTIONS.intro} position="bottom" />
  </>
);
```

Scenes take no props. Each reads its scene-relative frame via `useCurrentFrame()` (Remotion makes this Sequence-local automatically). Scenes import their Caption text from `compositions/chunk-vs-span/captions.ts` — not from disk-resident markdown.

**`captions.ts`:** a TS module co-located with the composition, exporting a `CAPTIONS` constant keyed by scene name. Caption strings are copy-edited once, live in source, and are reviewed by the implementation plan against `projects/cx-agent-evals--chunk-vs-span/script.md` for alignment.

```ts
// compositions/chunk-vs-span/captions.ts (shape)
import type { SceneName } from './frames';

export const CAPTIONS = {
  intro: 'A 60-second tour of chunk vs span evaluation.',
  document: 'Consider this document.',
  chunking: 'Split into chunks. Each chunk becomes a retrieval unit.',
  span: 'The true answer is this character span.',
  comparison: 'Chunk-level recall: 1.0. Span-level recall: 0.4.',
  outro: 'Span evaluation is the honest signal.',
} as const satisfies Record<SceneName, string>;
```

Exact caption text is finalized in the plan from `script.md`; the spec only fixes the _shape_ (one entry per scene, keys matching `SCENES`).

**Sample data:** `shared/assets/data/sample-document.ts` — a TS module exporting a single `SAMPLE_DOCUMENT: string` constant (80–120 words about RAG retrieval / chunking, used by the `document` and `chunking` scenes). TS constant chosen over `.md` to avoid a webpack raw-loader rule and an ambient `declare module '*.md'` — both of which add config for no gain at a single-document scale.

**Thumbnail:** `thumbnail.tsx` exports `ChunkVsSpanThumbnail`, a React component rendering `<TitleCard title="Chunk vs Span" subtitle="character-level beats chunk-level" align="center" />` with the mint-accent theme at 1280×720. Because it shares primitives and theme with the video, it stays visually consistent without extra work.

## 9. Conventions & Committed Stubs

### 9.1 Log conventions (`log/README.md` contents)

Describes the log structure so the user can pick it up fresh six months from now:

- **Dated entries** (`log/YYYY-MM-DD-<slug>.md`) — one per work session, written at session end. Free-form markdown. Suggested frontmatter:

  ```markdown
  ---
  date: 2026-04-20
  session: pilot-kickoff
  project: cx-agent-evals--chunk-vs-span
  ---
  ```

  Body: what was done, decisions made, blockers, what's next.

- **Per-project files** (`log/projects/<source-repo>--<video-slug>.md`) — one per video project. Rolling narrative, newest first. Tracks how the video evolved.

- **Commit policy** — log files are committed at end of session, one commit per entry. Not auto-generated.

### 9.2 `repo-references/README.md` contents

Instructs a fresh clone how to populate external references:

````markdown
# repo-references/

This folder holds local clones of external source repos — the codebases each
video project explains. The folder is **gitignored**; each developer clones
independently.

## Expected clones

- `cx-agent-evals` — source for the chunk-vs-span pilot.
  ```sh
  cd repo-references
  git clone git@github.com:<owner>/cx-agent-evals.git
  ```
````

Add new entries here when a new source repo enters the studio.

```

(The `<owner>` placeholder is filled in by the implementation plan from the user's actual repo URL.)

### 9.3 Role of project-level docs (`projects/<source>--<slug>/`)

The `projects/` directory is the **tool-agnostic source of truth** for each video. Three files on day one:

- **`script.md`** — human-authored narration script. Scene-by-scene. Each scene block includes: scene name, intended duration, narration prose, on-screen caption text (what `captions.ts` will render on day one), and any visual notes. Drafted from HANDOFF's "Pilot video brief".
- **`storyboard.md`** — shot-by-shot table with columns: `scene | duration | tool | primitive(s) | visual description`. On day one all rows list `tool = remotion`. Future multi-tool projects will have mixed rows (e.g., `ai-gen/veo`, `ffmpeg/overlay`).
- **`notes.md`** — free-form design decisions that apply to this specific video. Examples: "Used chunk3 palette entry for the target chunk because green-green clash with accent" or "Sample document intentionally avoids jargon so the visual does the teaching."

The `tools/remotion/src/compositions/chunk-vs-span/` tree holds only *Remotion implementation* (TSX scenes, captions.ts, thumbnail). No markdown duplicated. If a future video is Remotion-only, the same split still applies.

## 10. Acceptance Criteria

Foundation is complete when all of these pass on a clean clone:

1. `pnpm install` runs clean (no peer-dep errors; warnings tolerated).
2. `pnpm typecheck` passes (zero errors).
3. `pnpm lint` passes (zero errors; warnings allowed).
4. `pnpm format:check` passes.
5. `pnpm studio` boots; both `chunk-vs-span` and `chunk-vs-span-thumbnail` appear in the Remotion preview; all 6 scenes render without runtime errors at placeholder fidelity (TitleCard + Caption against cx-agent-evals theme, per §8).
6. `pnpm render:chunk-vs-span` produces a 90-second MP4 at `out/cx-agent-evals--chunk-vs-span/v01.mp4` (H.264, 1920×1080, 30fps). Visual is wireframe-level; file is well-formed and plays in QuickTime and in a browser.
7. `pnpm thumbnail:chunk-vs-span` produces a PNG at `out/cx-agent-evals--chunk-vs-span/v01-thumb.png` at 1280×720.
8. `log/2026-04-20-pilot-kickoff.md` exists and captures the foundation bootstrap narrative (date frontmatter + body per §9.1).
9. `repo-references/README.md` exists and matches §9.2.
10. `projects/cx-agent-evals--chunk-vs-span/{script.md,storyboard.md,notes.md}` all exist and are non-empty, with the roles described in §9.3.
11. `tools/remotion/src/compositions/chunk-vs-span/captions.ts` exports one `CAPTIONS` entry per key in `SCENES` (TypeScript's `satisfies` clause enforces this at compile time).
12. Commit history is clean; `git status` shows no untracked build outputs; `.gitignore` prevents any rendered media, `node_modules/`, or `repo-references/` content from being committed.
13. Every exported primitive has its prop types declared (§8) and every stub primitive renders without throwing when given valid props.
14. *(manual smoke test)* With `pnpm studio` running, edit any color value in `shared/theme/projects/cx-agent-evals.ts`; the Remotion preview updates without a manual restart. Confirms ThemeContext + hot-reload wiring. Not a CI gate; verified once at bootstrap.

## 11. Scope Fence (Deferred)

Future specs, each with its own trigger:

**Tooling:**
- Programmatic render script using `@remotion/bundler` + `@remotion/renderer` — dependencies installed; trigger: when CLI renders become insufficient.
- `tools/ffmpeg/` — trigger: a shot needs concat, transcode, or overlay beyond Remotion's reach.
- `tools/ai-gen/` — trigger: a project wants Veo/Replicate/Nano-Banana output.
- `tools/editor/` — trigger: a project needs DaVinci/Premiere round-trip.
- `timeline.json` + `projects/*/sources/` + `projects/*/thumbnail/` subdir — trigger: first multi-tool assembly (ffmpeg-driven).

**Pilot polish:**
- Full visual implementations for `Chunk`, `Span`, `Token`, `MetricBar`, `Cursor`.
- Polished scene content beyond placeholder `TitleCard`/`Caption`.
- v2 render with AI TTS narration — pick ElevenLabs vs OpenAI TTS at that time.

**Infra:**
- `pnpm theme:sync <source-repo>` script — trigger: palette drift hurts twice.
- `repos.json` manifest + `pnpm refs:sync` — trigger: 3+ source repos.
- Cloud output (R2/S3) — trigger: drafts shared with reviewers.
- YouTube upload automation — trigger: cadence >1 video/week.
- CI / GitHub Actions — trigger: collaborator lands.
- Formal test suite — trigger: first pure-logic module (e.g., `timeline.json` validator, theme-sync script).

**Content:**
- Second video / second source repo.
- Per-project theme overrides beyond `cx-agent-evals.ts`.

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Remotion 4.x API drift vs docs | Pin major via caret; lockfile pins exact; verify `pnpm studio` and `pnpm render:chunk-vs-span` both work before declaring acceptance. Before wiring the studio, the plan validates Remotion's current 4.x API surface via the `context7` MCP (up-to-date docs). |
| Webpack alias list drifts between `tsconfig.json` and `remotion.config.ts` | Aliases are authored in `remotion.config.ts` with an inline "keep in lockstep" comment (see §6). `tsconfig.json` carries the mirror comment. Covered by acceptance §10.2 (`typecheck` fails on wrong aliases) + §10.5 (`studio` fails on wrong bundler aliases). |
| `.gitignore` accidentally commits a large binary | Belt-and-suspenders: both directory-level ignores (`out/`, `repo-references/`, `shared/assets/{audio,images,fonts,video}/`) and extension-level ignores (`*.mp4`, `*.mov`, `*.mp3`, etc.). Manually verify with `git status` + `git check-ignore` on a sample binary before first commit containing output paths. |
| Stub primitives leak into final renders unnoticed | Neutral placeholder visual (dashed outline + name label) makes unfinished work obvious during preview and thumbnail review. |
| `noUncheckedIndexedAccess: true` friction vs `theme.chunks[i]` | `Theme.chunks` typed as a fixed-length tuple `readonly [string, string, string, string, string]`. Indexed access via `ChunkIndex` union yields `string`, not `string \| undefined`. |
| ESM + TS config file loading under `"type": "module"` | `remotion.config.ts` is loaded by `@remotion/cli`, which compiles TS internally — no `ts-node` / `tsx` needed. `eslint.config.js` is plain ESM JS (no TS). Both are discovered by their canonical filenames, no extra config. Plan confirms by running `pnpm studio` and `pnpm lint` at first bootstrap checkpoint. |
| pnpm version drift between machines | `packageManager: pnpm@9.12.0` pin + `engines.node: >=20` enforced by Corepack. |

## 13. Open Items for the Plan

The implementation plan should resolve:

- **Bootstrap order.** A step-by-step ordering that keeps each step individually verifiable. Suggested spine: install → tsconfigs + Prettier/ESLint + remotion.config.ts → theme (types → colors → fonts → easings → index → cx-agent-evals override) → ThemeContext → primitives (built first: TitleCard, Caption, Document; then stubs) → composition skeleton (Root.tsx registration + SCENES) → scenes → thumbnail → script.md/storyboard.md/notes.md → first `pnpm studio` check → first `pnpm render:chunk-vs-span` check → log entry → final commit. Plan locks exact ordering and commit-point boundaries.
- **Easing implementation factoring.** `easings.ts` exports curves as functions vs. as Remotion `spring()` configs vs. as Remotion `interpolate()` configs. Plan picks the one that best matches how `TitleCard` and `Caption` consume them on day one.
- **Commit granularity.** How many commits the bootstrap lands in (one big commit vs. logical checkpoints). Plan recommends a split that makes review + potential revert easy.

---

*End of design — iteration 3 (implementation-ready).*
```

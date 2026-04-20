# Content Studio — Foundation Design

**Date:** 2026-04-20
**Status:** approved
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

See §10 for the full deferred list.

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

| # | Topic | Decision |
|---|---|---|
| Q5 | `repo-references/` mechanism | **A** — plain `git clone` into gitignored folder; README lists expected clones. |
| Q6 | Theme sync | **C** — per-project theme files (hand-written). No sync script yet. |
| Q7 | Work-log format | **A** — dated narrative entries in `log/` + per-project files in `log/projects/` + `log/README.md` conventions. |
| Q8 | Project naming | **A** — flat `<source-repo>--<video-slug>` (double-dash separator). |
| Q9 | Audio / narration | **D → B** — pilot v1 captions-only, no audio pipeline on day one; v2 adds AI TTS (vendor chosen at v2 time). Music bed deferred. |
| Q10a | Render output location | **B** — local `out/` only; manual YouTube upload. |
| Q10b | Codec | **A** — H.264 1080p30 MP4, AAC audio. |
| Q10c | Thumbnail | **A** — rendered as a Remotion composition (1280×720, 1 frame). |
| Q11 | Dependencies | See §6. |
| Q12 | Repo name | `content-studio`, already published at `github.com/vinit-agr/content-studio`. |

## 5. Repo Layout

```
content-studio/
  README.md                        # expanded in plan
  LICENSE                          # MIT
  HANDOFF.md                       # origin brief (kept for provenance)
  .gitignore
  .prettierrc
  .eslintrc.cjs
  package.json                     # ESM, "type":"module"
  pnpm-lock.yaml                   # generated
  tsconfig.json
  tsconfig.base.json
  remotion.config.ts               # 1920×1080, 30fps, H.264

  tools/
    remotion/
      src/
        Root.tsx                   # registers compositions
        index.ts                   # registerRoot(Root)
        theme/
          index.ts                 # re-exports from shared/theme
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
            index.tsx              # registers composition + SCENES frame map
            scenes/
              01-intro.tsx
              02-document.tsx
              03-chunking.tsx
              04-span.tsx
              05-comparison.tsx
              06-outro.tsx
            script.md
            storyboard.md
            notes.md
            thumbnail.tsx
    ai-gen/README.md               # placeholder
    ffmpeg/README.md               # placeholder
    editor/README.md               # placeholder

  shared/
    theme/
      index.ts
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
        sample-document.md         # committed — small text sample for pilot

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
    README.md                      # conventions
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
- Added `shared/theme/index.ts`, `shared/theme/fonts.ts`, `shared/theme/easings.ts` as first-class files.
- Added `tools/remotion/src/primitives/index.ts` and `clips/README.md`.
- Added `shared/assets/video/` and `shared/assets/data/`; `data/sample-document.md` is committed (small text only).
- Added `.prettierrc`, `.eslintrc.cjs`, `tsconfig.base.json`.
- Deferred `timeline.json`, `projects/*/sources/`, `projects/*/thumbnail/` until ffmpeg lands. Pilot thumbnail lives inline with its composition.

## 6. Tooling & Dependencies

**`package.json` (abbreviated):**

- `"type": "module"`, `"packageManager": "pnpm@9.12.0"`, `"engines": { "node": ">=20" }`, `"private": true`.
- Runtime: `react@^18.3`, `react-dom@^18.3`, `remotion@^4`, `@remotion/cli@^4`, `@remotion/bundler@^4`, `@remotion/renderer@^4`, `@remotion/google-fonts@^4`.
- Dev: `typescript@^5.6`, `@types/node@^20`, `@types/react@^18.3`, `@types/react-dom@^18.3`, `prettier@^3.3`, `eslint@^9`, `@typescript-eslint/parser@^8`, `@typescript-eslint/eslint-plugin@^8`.
- Scripts:
  - `studio` → `remotion studio`
  - `render` → `remotion render`
  - `render:chunk-vs-span` → `remotion render chunk-vs-span out/cx-agent-evals--chunk-vs-span/v01.mp4`
  - `thumbnail:chunk-vs-span` → `remotion still chunk-vs-span-thumbnail out/cx-agent-evals--chunk-vs-span/v01-thumb.png`
  - `typecheck` → `tsc --noEmit`
  - `lint` → `eslint . --ext .ts,.tsx`
  - `format` / `format:check` → `prettier --write .` / `prettier --check .`

**`tsconfig.base.json`:** ES2022 / ESNext modules / Bundler resolution, `strict: true`, `noUncheckedIndexedAccess: true`, `isolatedModules: true`, `jsx: "react-jsx"`.

**`tsconfig.json`:** extends base; declares path aliases `@shared/*`, `@primitives/*`, `@theme/*`; `include: ["tools/**/*", "shared/**/*", "remotion.config.ts"]`.

**Path aliases:** TS aliases are matched by a webpack alias block in `remotion.config.ts` via `Config.overrideWebpackConfig`, so Remotion's bundler resolves them at preview and render time.

**`remotion.config.ts`:** sets entry point to `./tools/remotion/src/index.ts`, codec to `h264`, image format `jpeg`, and registers the alias overrides.

**`.prettierrc`:** semi, single quotes, trailing comma all, print width 100, arrow parens always.

**`.eslintrc.cjs`:** extends `eslint:recommended` + `@typescript-eslint/recommended`; ignores `out/`, `node_modules/`, `repo-references/`, `dist/`.

## 7. Theme Architecture

- **Base palette** at `shared/theme/colors.ts` — the default dark theme.
- **Fonts** at `shared/theme/fonts.ts` — loads JetBrains Mono via `@remotion/google-fonts/JetBrainsMono`; exports `primary`, `monoStack` constants.
- **Easings** at `shared/theme/easings.ts` — motion curves matching the cx-agent-evals frontend keyframes: `fadeIn` (0.3s ease-out, opacity + translateY 6→0), `slideIn` (0.25s ease-out, opacity + translateX -8→0), `pulseDot` (1.4s ease-in-out loop, opacity 0.4↔1.0), `spanGlow` (2s ease-in-out, mint box-shadow flash).
- **Per-project overrides** at `shared/theme/projects/<source-repo>.ts` — each exports a `Theme` object keyed identically to the base palette. `cx-agent-evals.ts` is hand-written on day one from HANDOFF §"Reference theme", including chunk1–chunk5 accent colors.
- **Consumption:** compositions import `@theme/colors` (base) or `@theme/projects/cx-agent-evals` (override) and pass through a React context or direct prop — concrete pattern chosen in the implementation plan.

## 8. Pilot Composition Scaffold

**Composition registration** (`Root.tsx`):
- `chunk-vs-span` — 1920×1080, 30fps, 2700 frames (90s), H.264.
- `chunk-vs-span-thumbnail` — 1280×720, 30fps, 1 frame.

**Frame map** (`compositions/chunk-vs-span/index.tsx`):

```ts
export const SCENES = {
  intro:      { start:    0, duration:  150 },  // 0–5s
  document:   { start:  150, duration:  300 },  // 5–15s
  chunking:   { start:  450, duration:  450 },  // 15–30s
  span:       { start:  900, duration:  300 },  // 30–40s
  comparison: { start: 1200, duration:  900 },  // 40–70s
  outro:      { start: 2100, duration:  600 },  // 70–90s
} as const;
```

Scene files consume `SCENES.<name>.start` and `.duration` rather than hard-coding frames. The composition wraps each scene in `<Sequence from={start} durationInFrames={duration}>`.

**Primitives split:**

| Primitive | Day-one state | Purpose |
|---|---|---|
| `TitleCard` | Built | Centered title + optional subtitle; fade-in. |
| `Caption` | Built | Lower-third / on-screen label; fade-in or slide-in. |
| `Document` | Built | Monospace text block; supports character-by-character reveal driven by `useCurrentFrame`. |
| `Chunk` | Stub | Placeholder component, typed props, returns trivial rect. Anchors imports. |
| `Span` | Stub | Same pattern; span highlight visual comes later. |
| `Token` | Stub | Same pattern. |
| `MetricBar` | Stub | Same pattern; comparison bar visual comes later. |
| `Cursor` | Stub | Same pattern. |

Each stub is a typed React component exporting the same props surface it will ultimately have, returning either `null` or a neutral placeholder (e.g., a dashed outline with the primitive name). A one-line TODO comment names the intended visual behavior.

**Scene content:** each scene renders its name + scene number + intended duration using `TitleCard`/`Caption` against the correct palette. No polished animation on day one. The *story* (script.md, storyboard.md, timings) is locked; the *visuals* are iterative.

**Sample data:** `shared/assets/data/sample-document.md` — one short paragraph (80–120 words) about RAG retrieval, used by the `document` and `chunking` scenes.

**Thumbnail:** `thumbnail.tsx` renders the working title "Chunk vs Span" + mint accent against dark bg at 1280×720. Single frame.

## 9. Acceptance Criteria

Foundation is complete when all of these pass on a clean clone:

1. `pnpm install` runs clean, no warnings about peer deps.
2. `pnpm typecheck` passes (zero errors).
3. `pnpm lint` passes (zero errors; warnings allowed).
4. `pnpm format:check` passes.
5. `pnpm studio` boots; both `chunk-vs-span` and `chunk-vs-span-thumbnail` compositions appear in the Remotion preview; all 6 scenes render without runtime errors at placeholder fidelity.
6. `pnpm render:chunk-vs-span` produces a 90-second MP4 at `out/cx-agent-evals--chunk-vs-span/v01.mp4` (H.264, 1920×1080, 30fps). Visual is wireframe-level; file is well-formed and plays in QuickTime and in a browser.
7. `pnpm thumbnail:chunk-vs-span` produces a PNG at `out/cx-agent-evals--chunk-vs-span/v01-thumb.png` at 1280×720.
8. `log/2026-04-20-pilot-kickoff.md` exists and captures the foundation bootstrap narrative.
9. `repo-references/README.md` exists and tells a fresh clone how to pull `cx-agent-evals`.
10. Commit history is clean; `.gitignore` prevents any rendered media or `node_modules/` from being committed.

## 10. Scope Fence (Deferred)

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

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Remotion 4.x API drift vs docs | Pin major via caret; lockfile pins exact; verify `pnpm studio` and `pnpm render` both work before declaring acceptance. |
| Webpack alias mismatch between tsconfig and `remotion.config.ts` | Single source of truth — aliases defined once in `remotion.config.ts` and mirrored verbatim in `tsconfig.json`. Covered by acceptance §9.5/§9.6. |
| Gitignore accidentally commits a large binary | Belt-and-suspenders: both directory-level ignores (`out/`, `repo-references/`, `shared/assets/{audio,images,fonts,video}/`) and extension-level ignores (`*.mp4`, `*.mov`, `*.mp3`, etc.). |
| Stub primitives leak into final renders | Neutral placeholder visual (dashed outline + name label) makes unfinished work obvious during preview and thumbnail review. |

## 12. Open Items for the Plan

The implementation plan (next skill) should resolve:

- Exact flow for passing per-project theme into compositions: React context vs. direct prop vs. module-level constant selection. Pick one; document in the plan.
- How `Document.tsx` reads `sample-document.md` — import as raw string via Remotion's webpack config, or embed as a TS constant. Pick one; document in the plan.
- Order of bootstrap steps that lets each step be individually verifiable (install → configs → theme → primitives → scenes → composition registration → first preview → first render).

---

*End of design.*

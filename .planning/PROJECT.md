# Content Studio

## What This Is

A personal-channel content production studio for Vinit's YouTube channel. The repo houses a growing set of tools — currently Remotion-based motion graphics and an upcoming browser-capture module — that produce the visual B-roll assets stitched into talking-head technical/work videos. Each tool is independent and produces standalone media assets (MP4s, images) that downstream editors combine into final videos.

## Core Value

Cut the time from "I want to explain this idea" to "a published YouTube video" by giving Vinit a personal library of reusable, high-quality B-roll generation tools that fit his channel's style and topics.

## Requirements

### Validated

<!-- Inferred from existing brownfield code. -->

- ✓ Remotion-based motion graphics composition pipeline — existing (`tools/remotion/`)
- ✓ Reusable visual primitives (Caption, Document, Chunk, Span, Token, MetricBar, Cursor, TitleCard) — existing
- ✓ Theme system (colors, fonts, easings) with per-project overrides — existing (`shared/theme/`)
- ✓ Scene-based composition with declarative frame-timing + runtime contiguity validation — existing
- ✓ Dev studio (`pnpm studio`) and CLI render (`pnpm render:chunk-vs-span`) workflows — existing
- ✓ `chunk-vs-span` composition rendered to `out/cx-agent-evals--chunk-vs-span/v01.mp4` — existing (not yet published)
- ✓ Per-project authoring layout under `projects/<source-repo>--<slug>/` (script.md, storyboard.md, notes.md) — existing
- ✓ Codebase analysis under `.planning/codebase/` — existing

### Active

<!-- v1 milestone scope: the browser-capture module. -->

- [ ] Standalone `tools/browser-capture/` module that drives a real browser session and records the tab as MP4
- [ ] Hybrid input model: NL → committed deterministic script (replayable) **plus** an agent mode for ad-hoc/exploratory captures
- [ ] First reference shot: hellotars.com session — load page → wait for chat widget → click widget → interact (click button or scroll) → done
- [ ] MP4 output written to `out/browser-capture/<session-name>/v<NN>.mp4`, no Remotion dependency
- [ ] Browser automation library chosen on reliability-first basis (research-driven, not a guess)
- [ ] Module is reusable: future shots authored as new session scripts without touching the module

### Out of Scope

<!-- Explicit boundaries for this milestone. -->

- **Polish FX (cursor highlight, click sound, typing sound)** — explicitly deferred to v2; basic capture first
- **Routing browser-capture MP4s into Remotion compositions** — captured MP4s are standalone assets; Remotion stays focused on motion graphics
- **Final video stitching / FFmpeg editor tool** — out of this milestone; lives in a future `tools/ffmpeg/` or `tools/editor/` milestone
- **AI-generated image/video B-roll** (Nano Banana, Veo, etc.) — future milestone
- **AI-generated voiceover (ElevenLabs)** — future milestone
- **Talking-head capture/cleanup pipeline** — future milestone
- **YouTube upload automation** — out of scope; manual upload is fine
- **Polishing existing Remotion stub primitives** (Token, Span, Cursor, MetricBar, Chunk) — out unless they block a current shot
- **Multiple reference shots in v1** — only hellotars.com; more sites validated in later phases

## Context

- **Repo state:** Brownfield. Remotion pipeline is built and in regular use; one full composition (`chunk-vs-span`) is rendered. Codebase has been mapped to `.planning/codebase/` (ARCHITECTURE, STACK, STRUCTURE, CONCERNS, etc.).
- **Multi-tool studio pattern:** `tools/` is intentionally a home for many independent tools (`remotion/` is built; `ai-gen/`, `editor/`, `ffmpeg/` are placeholders). `browser-capture` slots in alongside.
- **Active video work:** The `cx-agent-evals--chunk-vs-span` video (v01.mp4) is rendered but not yet on YouTube; may need follow-up polish or cuts before publishing, but that work is not part of this milestone.
- **Channel format:** Mostly talking-head delivery, with B-roll for visualization, occasional screen-share demos, and (future) AI-generated utility B-roll.
- **Repo conventions** (from `.planning/codebase/`): TypeScript strict; pnpm; ESLint 9 flat config; Prettier; webpack aliases mirrored between `tsconfig.json` and `remotion.config.ts`; no hardcoded secrets in source.
- **Known tech debt** (from `CONCERNS.md`): five Remotion primitives are stubs (`data-stub`); webpack alias drift risk between TS and Remotion configs; per-project theme files require manual sync. None block this milestone but worth knowing.

## Constraints

- **Tech stack**: TypeScript, pnpm, Node-based tooling — matches the existing repo. New module must integrate cleanly.
- **Reliability over speed**: When picking a browser automation library / approach, prefer the most reliable option even if slower.
- **Headless preferred, headful acceptable**: Either works as long as recording is reliable. Don't overthink display servers.
- **No Remotion dependency in browser-capture**: The module must produce standalone MP4 assets. Anyone who later wants to embed in Remotion can use `<OffthreadVideo>`, but that's not the module's concern.
- **Reproducibility**: Committed shot scripts must produce the same recording on re-run (within reason — sites change).
- **Secrets hygiene**: If agent mode requires LLM API keys, they go via `.env` (excluded from git); never committed in source.
- **Personal channel scope**: Tools are tailored to Vinit's needs first. Generality is a nice-to-have, not a requirement.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Browser-capture is a standalone tool, not a Remotion composition | Keeps Remotion focused on motion graphics; MP4 assets are usable by any downstream stitcher (FFmpeg, editor, manual NLE) | — Pending |
| Hybrid NL → script + agent mode | Committed scripts give reproducibility for shipped shots; agent mode unblocks fast exploratory captures | — Pending |
| v1 polish (cursor highlight, click/typing sounds) deferred | Get the bare capture working and prove the pattern before investing in FX | — Pending |
| Reliability > speed when picking browser automation library | A capture that fails midway costs more than one that runs slowly | — Pending |
| Tool name: `tools/browser-capture/` | Plain, descriptive, matches existing `tools/<purpose>/` convention | — Pending |
| One reference shot in v1 (hellotars.com only) | Single shot proves the module; multiple shots earn their place when actual videos need them | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-21 after initialization*

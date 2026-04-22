# Content Studio

## What This Is

A personal-channel content production studio for Vinit's YouTube channel. The repo houses the Remotion-based motion graphics pipeline that produces visual videos for the channel. Each video lives under `projects/<slug>/` (script, storyboard, notes) and renders via the existing Remotion infrastructure to `out/<slug>/`. The studio's purpose is to *make and ship videos*, not to build new tooling.

## Core Value

Cut the time from "I want to explain this idea" to "a published YouTube video" by treating each video as a small, shippable project that uses the existing Remotion pipeline.

## Requirements

### Validated

<!-- Inferred from existing brownfield code. -->

- ✓ Remotion-based motion graphics composition pipeline — existing (`tools/remotion/`)
- ✓ Reusable visual primitives (TitleCard, Caption, Document) polished — existing
- ✓ Theme system (colors, fonts, easings) with per-project overrides — existing (`shared/theme/`)
- ✓ Scene-based composition with declarative frame-timing + runtime contiguity validation — existing
- ✓ Dev studio (`pnpm studio`) and CLI render (`pnpm render:chunk-vs-span`) — existing
- ✓ `chunk-vs-span` Remotion composition rendered to `out/cx-agent-evals--chunk-vs-span/v01.mp4` (pilot, captions-only, stub primitives, not yet published) — existing
- ✓ Per-project authoring layout under `projects/<source-repo>--<slug>/` (script.md, storyboard.md, notes.md) — existing
- ✓ Codebase analysis under `.planning/codebase/` — existing

### Active

<!-- v1 milestone scope: ship chunk-vs-span v02 to YouTube. -->

- [ ] Polished `Chunk` primitive animation (used in scene 3 ×5)
- [ ] Polished `MetricBar` primitive animation (used in scene 5 ×2)
- [ ] On-screen caption layer disabled/removed from `chunk-vs-span` (VO replaces it)
- [ ] Voiceover audio generated from existing `script.md` narration via ElevenLabs stock voice (per-scene MP3s or one continuous track)
- [ ] VO audio wired into the Remotion composition via `<Audio>` synced to scene start frames
- [ ] `out/cx-agent-evals--chunk-vs-span/v02.mp4` rendered with VO baked in, polished primitives, no captions
- [ ] v02 manually uploaded to YouTube — channel-public

### Out of Scope

<!-- Explicit boundaries for this milestone. Most are deferred, not killed. -->

- **Word-level transcript-driven captions (Deepgram)** — VO-only design; no on-screen text needed for v02. Future videos may revisit
- **Polishing other stub primitives (Token, Span, Cursor)** — not used in chunk-vs-span; defer until a video needs them. Span absence in scene 4 is accepted (scene stays card-only)
- **Re-recording or revising the narration script** — script as-written is final for v02
- **Palette / typography refresh** — current mint-accent dark theme stays
- **Browser-capture tool (`tools/browser-capture/`)** — full milestone planned and researched, deferred to a later cycle. See `.planning/_archive/browser-capture-milestone/` for the locked decisions, research, and roadmap when picking it back up
- **AI-generated B-roll (image/video)** — future milestone
- **Talking-head capture/cleanup pipeline** — future milestone
- **Final video stitcher (FFmpeg / editor tool)** — future milestone (not needed: chunk-vs-span renders end-to-end through Remotion alone)
- **YouTube upload automation** — manual upload is fine
- **New videos beyond chunk-vs-span** — v02 ships first; the next video earns its own milestone

## Context

- **Repo state:** Brownfield Remotion pipeline in regular use. Codebase mapped to `.planning/codebase/`.
- **Active project:** `projects/cx-agent-evals--chunk-vs-span/` — script, storyboard, design notes already exist. v01.mp4 rendered as a *pipeline-validation pilot* with deliberately-stubbed visuals per `notes.md`: *"validate the whole pipeline, not the visuals."* This milestone moves it from pilot to ship-ready.
- **Stub primitives** (per `.planning/codebase/CONCERNS.md`): Token, Span, Cursor, MetricBar, Chunk are all `data-stub`. **Only Chunk and MetricBar are in scope** to polish for this milestone — they're the two used by the current chunk-vs-span composition.
- **Scene 4 (The Answer Span):** Currently shows TitleCard + Caption only because the `Span` primitive is stubbed. Storyboard intent is "one chunk lights up; a sub-region inside it glows." For v02 this scene stays card-only; Span polish deferred.
- **Channel format:** Mostly talking-head delivery long-term, with motion-graphics videos like chunk-vs-span as standalone explainers. chunk-vs-span ships standalone — no talking head over it.
- **Repo conventions** (from `.planning/codebase/`): TypeScript strict; pnpm; ESLint 9 flat config; Prettier; webpack aliases mirrored between `tsconfig.json` and `remotion.config.ts`; no hardcoded secrets.
- **Pivot note (2026-04-22):** This milestone replaces an earlier `tools/browser-capture/` milestone that was researched and roadmapped before scope shifted to "use the tools to ship videos, don't build more tools." That work is preserved under `.planning/_archive/browser-capture-milestone/`.

## Constraints

- **Tech stack**: TypeScript, pnpm, Remotion 4.0.450 — no new frameworks
- **Audio**: ElevenLabs stock voice; API key via `.env` (never committed)
- **No captions**: VO-only design — any new caption layer is out of scope
- **Reuse, don't rebuild**: Polish existing primitives in place; don't fork or rewrite the composition
- **Personal channel scope**: Optimize for shipping one video well, not for generality
- **Keep it Remotion-only**: No FFmpeg post-processing tool, no external editor, no separate stitcher — the rendered MP4 is the final deliverable

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| **Pivot from browser-capture milestone to chunk-vs-span shipping** (2026-04-22) | Tool-building was speculative; the actual goal is shipping videos. Use what exists | — Pending |
| Path A (finish & ship chunk-vs-span) over Path B (start a new video) | One concrete deliverable; learn shipping mechanics first | — Pending |
| Polish only Chunk + MetricBar primitives | Only stubs actually used in the composition; minimum viable polish | — Pending |
| ElevenLabs stock voice (not cloned, not self-recorded) | Fast start, no recording setup, swap to cloned voice later if channel grows | — Pending |
| No on-screen captions in v02 | VO-only design; trust the viewer + the narration | — Pending |
| Scene 4 stays card-only (no Span polish) | Span isn't on the critical path; defer with the rest of the unused stubs | — Pending |
| Keep narration script as-written | Script.md is final for v02; no rewrites | — Pending |
| Keep current mint-accent dark theme | No palette refresh in scope | — Pending |
| Manual YouTube upload | Automation isn't worth building for one video | — Pending |
| Browser-capture milestone preserved, not deleted | Locked architectural decisions are valuable when we return to it | — Pending |

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
*Last updated: 2026-04-22 after milestone re-scope (browser-capture → chunk-vs-span shipping)*

# Content Studio

A personal-channel content production studio for Vinit's YouTube channel. Houses the Remotion-based motion-graphics pipeline that produces visual videos. The studio's purpose is to *make and ship videos*, not to build new tooling.

## Project state

Planning artifacts live under `.planning/`. Always treat these as the source of truth:

| File | Purpose |
|------|---------|
| `.planning/PROJECT.md` | Project context, core value, requirements (Validated/Active/Out of Scope), constraints, key decisions |
| `.planning/REQUIREMENTS.md` | Full v1 requirements with REQ-IDs (ANIM-*, CAP-*, VO-*, SHIP-*) and traceability to phases |
| `.planning/ROADMAP.md` | Phases, dependencies, success criteria |
| `.planning/STATE.md` | Active phase, completed phases, current focus |
| `.planning/config.json` | Workflow config (mode, granularity, parallelization, model profile, agent toggles) |
| `.planning/codebase/` | Brownfield codebase analysis (architecture, stack, structure, conventions, concerns) |
| `.planning/_archive/browser-capture-milestone/` | Preserved planning + research from a deferred `tools/browser-capture/` milestone (resume there when picking it back up) |

## Active milestone

**Ship `chunk-vs-span` v02 to YouTube** — take the existing pipeline-validation pilot at `out/cx-agent-evals--chunk-vs-span/v01.mp4` from card-only stub visuals + on-screen captions to a polished, voiceover-driven, captionless v02 ready for YouTube.

**2 phases:**
1. **Animation Polish + Caption Removal** — `Chunk` and `MetricBar` primitives lose their `data-stub` placeholders and animate properly; on-screen caption rendering disabled in `chunk-vs-span` composition
2. **Voiceover + Final Render + Ship** — ElevenLabs stock voice generates narration MP3 from `script.md`; audio wired into composition synced to scene start frames; v02.mp4 rendered and uploaded

## Locked decisions for this milestone

- **Polish scope:** Only `Chunk` and `MetricBar` primitives (the two stubs actually in use). Token / Span / Cursor stay stubbed.
- **Scene 4:** Stays card-only (no `Span` activation in v02).
- **VO source:** ElevenLabs stock voice (not cloned, not self-recorded). API key via `.env`.
- **Captions:** None in v02 — VO carries the message. `Caption` primitive is preserved for future videos.
- **Script:** `projects/cx-agent-evals--chunk-vs-span/script.md` is final — no rewrites.
- **Theme:** Current mint-accent dark theme stays; no palette/typography refresh.
- **Output:** Render → `out/cx-agent-evals--chunk-vs-span/v02.mp4`. v01 preserved for comparison.
- **Upload:** Manual to YouTube (no automation).

## Workflow guidance

This project uses the GSD (Get Shit Done) framework. The workflow is configured as:

- **Mode:** YOLO (auto-approve, just execute)
- **Granularity:** Coarse (2 phases for this milestone)
- **Parallelization:** Plans run in parallel where independent
- **Workflow agents:** Research, Plan Check, Verifier all enabled
- **Model profile:** Quality (Opus for research/roadmap, Sonnet for synthesis/execution)

### Common commands

| Command | When to use |
|---------|-------------|
| `/gsd-progress` | Check current state and next action |
| `/gsd-plan-phase <N>` | Create detailed PLAN.md for a phase |
| `/gsd-execute-phase <N>` | Execute all plans in a phase |
| `/gsd-discuss-phase <N>` | Adaptive questioning before planning |
| `/gsd-next` | Auto-advance to next logical step |
| `/gsd-help` | Full GSD command reference |

### Honor the workflow gates

- **Atomic commits per phase artifact** — don't batch up multiple artifacts into one commit
- **Update STATE.md** when transitioning between phases
- **Update REQUIREMENTS.md traceability** when phases complete (Pending → Complete)
- **Update PROJECT.md** at phase transitions per its own Evolution rules

## Existing brownfield context (Validated, modify carefully)

`tools/remotion/` is the existing Remotion pipeline (4.0.450). This milestone touches a small slice of it:

**In scope to modify:**
- `tools/remotion/src/primitives/Chunk.tsx` — replace stub with proper animation
- `tools/remotion/src/primitives/MetricBar.tsx` — replace stub with proper animation
- `tools/remotion/src/compositions/chunk-vs-span/` — remove caption rendering; wire `<Audio>` for VO
- `projects/cx-agent-evals--chunk-vs-span/` — add VO regen script, audio asset(s), notes update

**Do NOT modify:**
- Other primitives (TitleCard, Caption, Document — already finished)
- Other stubs (Token, Span, Cursor — out of scope; keep stubbed)
- `shared/theme/` (no palette refresh)
- `remotion.config.ts`, `tsconfig.json` (no infrastructure changes)
- `frames.ts` scene timings (script.md and durations are final)

Known stub primitives (Token, Span, Cursor, MetricBar, Chunk) are tracked in `.planning/codebase/CONCERNS.md`. Only Chunk and MetricBar get polished this milestone.

## Build commands

| Command | Purpose |
|---------|---------|
| `pnpm studio` | Launch Remotion dev studio (preview compositions live, including audio sync) |
| `pnpm render:chunk-vs-span` | Render the chunk-vs-span video to MP4 (`out/cx-agent-evals--chunk-vs-span/`) |

A new VO regen script will land in Phase 2 (planner's call on exact name and location).

## Code conventions (from `.planning/codebase/CONVENTIONS.md`)

- TypeScript strict mode, ES modules
- Path aliases: `@shared`, `@theme`, `@primitives` (mirrored in `tsconfig.json` and `remotion.config.ts`)
- ESLint 9 flat config, Prettier formatting
- No hardcoded secrets in source — `.env` for credentials (ElevenLabs API key in particular)
- Validate at definition time (e.g., `frames.ts` runtime contiguity check); use `satisfies` for type-level enforcement
- Immutable theme values (`as const`, `readonly`)
- Animations use existing easing functions from `shared/theme/easings.ts` and color tokens from `shared/theme/colors.ts`

---

*Last updated 2026-04-22 after milestone re-scope (browser-capture → chunk-vs-span shipping).*

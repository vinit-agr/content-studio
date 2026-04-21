# Content Studio

A personal-channel content production studio for Vinit's YouTube channel. The repo houses independent tools that produce visual B-roll assets stitched into talking-head technical videos.

## Project state

Planning artifacts live under `.planning/`. Always treat these as the source of truth:

| File | Purpose |
|------|---------|
| `.planning/PROJECT.md` | Project context, core value, requirements (Validated/Active/Out of Scope), constraints, key decisions |
| `.planning/REQUIREMENTS.md` | Full v1 requirements with REQ-IDs (CAP-*, DSL-*, CUR-*, CLI-*, ART-*, AGT-*, SHOT-*) and traceability to phases |
| `.planning/ROADMAP.md` | Phases, dependencies, success criteria |
| `.planning/STATE.md` | Active phase, completed phases, current focus |
| `.planning/config.json` | Workflow config (mode, granularity, parallelization, model profile, agent toggles) |
| `.planning/research/SUMMARY.md` | Research synthesis with reconciled architectural decisions |
| `.planning/research/{STACK,FEATURES,ARCHITECTURE,PITFALLS}.md` | Per-dimension research |
| `.planning/codebase/` | Brownfield codebase analysis (architecture, stack, structure, conventions, concerns) |

## Active milestone

**`tools/browser-capture/`** — a standalone module that drives Chromium through scripted or LLM-driven actions, records the tab as MP4, and ships a first reference shot of hellotars.com.

**4 phases:**
1. Capture Pipeline (driver + screenshot-loop recorder + ffmpeg encoder)
2. Session DSL + Script Runner + Cursor Compositing
3. Artifacts + CLI + hellotars Ship Gate (V1 SHIP)
4. Agent Mode + Codegen (Claude Agent SDK + codegen-to-script)

## Reconciled architectural decisions (already locked — do not relitigate without strong reason)

- **Recorder:** Screenshot-loop → `ffmpeg-static` stdin pipeline (NOT Playwright `recordVideo`). Reason: reliability + required for cursor compositing.
- **Agent runtime:** Claude Agent SDK with custom tools wrapping the shared `BrowserDriver` (NOT Stagehand). Reason: unified `Step{}` event stream + free codegen-to-script.
- **ffmpeg:** Bundled `ffmpeg-static`, not system ffmpeg. Reason: "just works" on fresh clone.
- **Workspace:** Single root `package.json` (matches existing `tools/remotion/`).
- **v1 promotions:** Cursor compositing (CUR-*) and per-keystroke typing delay (DSL-05) are v1 must-haves (not deferred polish), because clicks-with-no-cursor break B-roll integrity.

See `.planning/research/SUMMARY.md` § "Reconciled Decisions" for full rationale.

## Workflow guidance

This project uses the GSD (Get Shit Done) framework. The workflow is configured as:

- **Mode:** YOLO (auto-approve, just execute)
- **Granularity:** Coarse (4 phases, 1–3 plans each)
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

## Existing brownfield context (Validated, do not modify in current milestone)

`tools/remotion/` is the existing Remotion video composition pipeline. It is in active use for the `cx-agent-evals--chunk-vs-span` project (v01.mp4 rendered in `out/`). This milestone is purely additive and must not touch:

- `tools/remotion/`
- `shared/theme/` (unless adding new tool-specific themes)
- `shared/assets/`
- `projects/cx-agent-evals--chunk-vs-span/`
- `remotion.config.ts`

Known stub primitives (Token, Span, Cursor, MetricBar, Chunk) are tracked in `.planning/codebase/CONCERNS.md` — leave them unless they actively block work.

## Build commands (existing, unchanged by this milestone)

| Command | Purpose |
|---------|---------|
| `pnpm studio` | Launch Remotion dev studio |
| `pnpm render:chunk-vs-span` | Render the chunk-vs-span video to MP4 |

New `pnpm capture*` commands will land in Phase 3 of the current milestone.

## Code conventions (from `.planning/codebase/CONVENTIONS.md`)

- TypeScript strict mode, ES modules
- Path aliases: `@shared`, `@theme`, `@primitives` (mirrored in `tsconfig.json` and `remotion.config.ts`)
- ESLint 9 flat config, Prettier formatting
- No hardcoded secrets in source — `.env` for credentials
- Validate at definition time (e.g., `frames.ts` runtime contiguity check); use `satisfies` for type-level enforcement
- Immutable theme values (`as const`, `readonly`)

---

*Generated 2026-04-21 during project initialization. Refresh via `gsd-sdk query generate-claude-md` when project state evolves.*

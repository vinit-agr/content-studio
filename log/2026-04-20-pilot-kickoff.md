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

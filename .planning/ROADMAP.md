# Roadmap: Content Studio — Ship `chunk-vs-span` v02 to YouTube

## Overview

Take the existing pipeline-validation pilot (`out/cx-agent-evals--chunk-vs-span/v01.mp4`) from card-only stub visuals + on-screen captions to a polished, voiceover-driven, captionless v02 ready for YouTube. Two phases: first polish the in-use stub primitives (`Chunk` + `MetricBar`) and remove the on-screen caption layer, then generate the ElevenLabs VO and render the final v02. Existing finished primitives (TitleCard, Caption, Document) and theme stay as-is; unused stubs (Token, Span, Cursor) are explicitly out of scope.

## Phases

**Phase Numbering:**
- Integer phases (1, 2): Planned milestone work
- Decimal phases (1.1, 1.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Animation Polish + Caption Removal** - `Chunk` and `MetricBar` primitives lose their `data-stub` placeholders and animate properly using existing theme tokens; on-screen caption rendering disabled in `chunk-vs-span` composition
- [ ] **Phase 2: Voiceover + Final Render + Ship** - ElevenLabs stock voice generates narration MP3 from existing `script.md`; audio wired into composition via `<Audio>` synced to scene start frames; `v02.mp4` rendered and uploaded to YouTube

## Phase Details

### Phase 1: Animation Polish + Caption Removal
**Goal**: The `chunk-vs-span` composition renders without any `data-stub` markers and without on-screen captions, with `Chunk` and `MetricBar` animating in a way visually coherent with the existing finished primitives — visuals stand on their own ahead of the VO pass
**Depends on**: Nothing (first phase)
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, CAP-01, CAP-02
**Success Criteria** (what must be TRUE):
  1. `tools/remotion/src/primitives/Chunk.tsx` renders 5 colored chunks in scene 3 with proper entry animation (no `data-stub` attribute, no dashed-border placeholder), using `shared/theme/easings.ts` and existing color palette
  2. `tools/remotion/src/primitives/MetricBar.tsx` renders the chunk-recall (mint) and span-recall (warn-amber) bars in scene 5 with proper fill animation from 0 → target value (no `data-stub`, no placeholder bar)
  3. On-screen captions are disabled in the `chunk-vs-span` composition (either by removing `<Caption>` invocations from scene components or by gating them via a per-composition flag); `pnpm render:chunk-vs-span` produces an MP4 with zero on-screen text in the caption position; the `Caption` primitive itself remains intact for other videos
  4. `pnpm studio` previews the composition end-to-end; the existing `frames.ts` scene-contiguity runtime check still passes; visuals are coherent enough to read without VO or captions (final visual gate before audio)
  5. The `Caption` primitive (`tools/remotion/src/primitives/Caption.tsx`) is NOT deleted or otherwise modified beyond what's needed for `chunk-vs-span` (preserve reusability for future videos)
**Plans**: TBD
**UI hint**: yes (visual polish — primitives are React components; preview in `pnpm studio` before render)

### Phase 2: Voiceover + Final Render + Ship
**Goal**: `out/cx-agent-evals--chunk-vs-span/v02.mp4` exists with polished primitives, no captions, and ElevenLabs VO baked in — uploaded to YouTube
**Depends on**: Phase 1
**Requirements**: VO-01, VO-02, VO-03, VO-04, SHIP-01, SHIP-02, SHIP-03, SHIP-04
**Success Criteria** (what must be TRUE):
  1. `ELEVENLABS_API_KEY` loads from `.env` (gitignored); `.env.example` committed with placeholder; missing key produces a clear error before any API call
  2. Narration MP3(s) generated from `projects/cx-agent-evals--chunk-vs-span/script.md` using an ElevenLabs stock voice — file(s) live under `projects/cx-agent-evals--chunk-vs-span/audio/` (or `shared/assets/audio/cx-agent-evals--chunk-vs-span/`, planner's call); regen script committed alongside so the audio can be re-produced from the script alone
  3. VO is wired into the `chunk-vs-span` composition via Remotion `<Audio>` element(s), synced so each scene's narration starts at the scene's `start` frame from `frames.ts`; audio plays cleanly in `pnpm studio` end-to-end
  4. `pnpm render:chunk-vs-span` produces `out/cx-agent-evals--chunk-vs-span/v02.mp4` with VO baked in, polished primitives from Phase 1, and no on-screen captions; v01.mp4 is preserved for comparison
  5. v02.mp4 is uploaded manually to YouTube; a short README note (or update to `projects/cx-agent-evals--chunk-vs-span/notes.md`) records the YouTube URL, what changed v01 → v02, and any post-render observations worth keeping
**Plans**: TBD
**UI hint**: yes (final render review in `pnpm studio` before upload — audio sync visual check)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

(No parallelization opportunity — Phase 2 needs the polished primitives + caption-free composition from Phase 1 before audio sync can be verified meaningfully.)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Animation Polish + Caption Removal | 0/TBD | Not started | - |
| 2. Voiceover + Final Render + Ship | 0/TBD | Not started | - |

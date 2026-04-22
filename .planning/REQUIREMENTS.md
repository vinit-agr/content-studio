# Requirements: Content Studio — Ship `chunk-vs-span` v02 to YouTube

**Defined:** 2026-04-22 (replaces prior browser-capture milestone — see `.planning/_archive/browser-capture-milestone/`)
**Core Value:** Cut the time from "I want to explain this idea" to "a published YouTube video" by treating each video as a small, shippable project that uses the existing Remotion pipeline.

**Milestone scope:** Take the existing pipeline-validation pilot at `out/cx-agent-evals--chunk-vs-span/v01.mp4` and ship it as a polished, voiceover-driven, captionless v02 to YouTube.

## v1 Requirements

### Animation Polish

- [ ] **ANIM-01**: `Chunk` primitive (`tools/remotion/src/primitives/Chunk.tsx`) loses its `data-stub` placeholder visual and animates properly — entry, idle, and any state transitions used by scene 3 — using the existing theme tokens and easings
- [ ] **ANIM-02**: `MetricBar` primitive (`tools/remotion/src/primitives/MetricBar.tsx`) loses its `data-stub` placeholder and animates the bar fill from 0 → target value with appropriate easing, sized and colored to match the existing scene 5 layout (chunk-recall mint vs span-recall warn-amber per design notes)
- [ ] **ANIM-03**: Polished primitives are visually coherent with the existing finished primitives (TitleCard, Caption, Document) — same theme tokens, same animation feel
- [ ] **ANIM-04**: Composition still passes the existing scene-contiguity runtime check in `frames.ts`; no scene timing changes required

### Caption Removal

- [ ] **CAP-01**: On-screen caption rendering is disabled or removed from the `chunk-vs-span` composition — no caption text appears in the rendered output
- [ ] **CAP-02**: Caption removal is local to `chunk-vs-span` (or done via a flag/prop) — does NOT delete the `Caption` primitive itself, since future videos may use it

### Voiceover

- [ ] **VO-01**: ElevenLabs API key wired in via `.env` (gitignored); `.env.example` committed with placeholder
- [ ] **VO-02**: Narration MP3(s) generated from the existing `projects/cx-agent-evals--chunk-vs-span/script.md` narration text via ElevenLabs stock voice (one continuous track OR per-scene tracks — Claude's choice based on simplicity)
- [ ] **VO-03**: Generated VO file(s) committed (or `.gitignored` with a regen script — Claude's choice based on file size + reproducibility tradeoff)
- [ ] **VO-04**: VO is wired into the `chunk-vs-span` composition via Remotion's `<Audio>` element, synced so each scene's narration starts at the scene's start frame from `frames.ts`

### Render & Ship

- [ ] **SHIP-01**: `pnpm render:chunk-vs-span` produces `out/cx-agent-evals--chunk-vs-span/v02.mp4` with polished primitives, no captions, and VO baked in
- [ ] **SHIP-02**: v02.mp4 is reviewable in `pnpm studio` end-to-end (audio + video sync verified visually before render)
- [ ] **SHIP-03**: Existing v01.mp4 stays in place for comparison; v02 is the new shippable artifact
- [ ] **SHIP-04**: A short README note in `projects/cx-agent-evals--chunk-vs-span/` documents what changed between v01 and v02, and the YouTube upload status

## v2 Requirements (deferred — not in this milestone)

Tracked but not in current roadmap.

### Future videos

- **NEXT-01**: Next video idea(s) captured under `projects/<new-slug>/` when ready

### Browser-capture milestone (preserved)

- **DEFER-01**: Resume `tools/browser-capture/` work using the locked decisions, research, and roadmap in `.planning/_archive/browser-capture-milestone/` when timing is right

### Other studio tools (future)

- **STUDIO-01**: AI-generated image/video B-roll (`tools/ai-gen/`)
- **STUDIO-02**: Talking-head capture/cleanup pipeline
- **STUDIO-03**: Final video stitcher (`tools/editor/`, `tools/ffmpeg/`) — only if a future video needs multi-source compositing
- **STUDIO-04**: YouTube upload automation
- **STUDIO-05**: Word-level transcript-driven captions (Deepgram) for future videos that want on-screen text

### Other primitive polish (future)

- **PRIM-01**: Polish remaining stub primitives (Token, Span, Cursor) when a future video needs them
- **PRIM-02**: Activate scene 4 with proper Span animation when re-shipping chunk-vs-span (post-v02)

## Out of Scope

Explicitly excluded for this milestone.

| Feature | Reason |
|---------|--------|
| Word-level transcript-driven captions (Deepgram) | VO-only design — no on-screen text wanted in v02 |
| Polish of Token / Span / Cursor primitives | Not used by chunk-vs-span; defer to videos that need them |
| Span scene-4 activation | Card-only scene 4 is acceptable for v02 |
| Re-recording or revising the narration script | Script.md is final for v02 |
| Palette / typography refresh | Current mint-accent dark theme stays |
| Building a stitcher / editor / FFmpeg tool | Remotion renders the final MP4 directly |
| YouTube upload automation | Manual upload is acceptable for one video |
| New video projects beyond chunk-vs-span | Each new video earns its own milestone |
| Browser-capture tool | Deferred milestone — preserved in `_archive/` |
| AI-generated B-roll | Future milestone |
| Talking-head capture/cleanup | Future milestone |

## Traceability

Mapping populated by roadmapper.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ANIM-01 | Phase 1 | Pending |
| ANIM-02 | Phase 1 | Pending |
| ANIM-03 | Phase 1 | Pending |
| ANIM-04 | Phase 1 | Pending |
| CAP-01 | Phase 1 | Pending |
| CAP-02 | Phase 1 | Pending |
| VO-01 | Phase 2 | Pending |
| VO-02 | Phase 2 | Pending |
| VO-03 | Phase 2 | Pending |
| VO-04 | Phase 2 | Pending |
| SHIP-01 | Phase 2 | Pending |
| SHIP-02 | Phase 2 | Pending |
| SHIP-03 | Phase 2 | Pending |
| SHIP-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14 ✓
- Unmapped: 0

---
*Requirements defined: 2026-04-22*
*Last updated: 2026-04-22 after milestone re-scope*

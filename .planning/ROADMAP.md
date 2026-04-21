# Roadmap: Content Studio — `tools/browser-capture/` milestone

## Overview

`tools/browser-capture/` is a new, additive module that lives alongside the existing (Validated) `tools/remotion/` pipeline. The journey: build the capture pipeline (driver + screenshot-loop recorder + ffmpeg encoder) as the architectural backbone, layer the session DSL + script runner + cursor compositing on top so Vinit can author replayable shots, then ship the v1 ship gate (artifacts + CLI + first real hellotars.com capture). After v1 ships, add agent mode (Claude Agent SDK + codegen) so exploratory NL prompts produce committable scripts. The existing Remotion stuff is left untouched — this milestone is purely additive.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Capture Pipeline** - Driver + screenshot-loop recorder + ffmpeg encoder; Phase 0 DOM spike + ffmpeg-static smoke test folded in as prereqs
- [ ] **Phase 2: Session DSL + Script Runner + Cursor Compositing** - Typed `defineSession()` DSL, script runner, pre-flight assertions, reporters, `dismissOverlays()`, second-pass cursor compositor
- [ ] **Phase 3: Artifacts + CLI + hellotars Ship Gate** - Output-path resolution, manifest, `commander` CLI, first real hellotars.com session, README — V1 SHIP GATE
- [ ] **Phase 4: Agent Mode + Codegen** - Claude Agent SDK runner with custom browser tools, end-of-run codegen serializer, cost guardrails

## Phase Details

### Phase 1: Capture Pipeline
**Goal**: A reliable, video-grade frame-to-MP4 pipeline that can be driven by a smoke-test script — the architectural backbone everything else sits on top of
**Depends on**: Nothing (first phase)
**Requirements**: CAP-01, CAP-02, CAP-03, CAP-04, CAP-05, CAP-06, CAP-07, CUR-01
**Success Criteria** (what must be TRUE):
  1. A throwaway smoke-test script can drive Chromium through 6 step kinds (`goto`, `click`, `type`, `waitFor`, `wait`, `scroll`) via the `BrowserDriver` interface — no `playwright` import outside the driver impl
  2. The `ScreenshotLoopRecorder` streams frames to `ffmpeg-static` stdin (no WebM intermediate, no per-frame PNGs on disk) and produces a 30fps CFR H.264 MP4 that ffprobe verifies as `yuv420p` + `bt709` color tags + faststart-enabled
  3. Chromium launches with `--mute-audio --autoplay-policy=user-gesture-required --force-color-profile=srgb` and a locked 1920×1080 viewport at `deviceScaleFactor: 1` (no resize during a session)
  4. The recorder captures an `InteractionTimeline` (timestamp, x, y, event-kind) alongside frames, so the cursor compositor in Phase 2 has the data it needs
  5. Startup version-check on the bundled `ffmpeg-static` binary fails loudly with a clear message if the binary is broken; `.planning/research/shots/hellotars-com/dom-notes.md` exists from the Phase-0 spike
**Plans**: TBD
**UI hint**: no

### Phase 2: Session DSL + Script Runner + Cursor Compositing
**Goal**: An author-friendly typed DSL with a fail-fast script runner, observable reporters, and a second-pass cursor compositor that turns Phase 1's raw capture into shot-ready footage with a visible, smoothly-animated cursor
**Depends on**: Phase 1
**Requirements**: DSL-01, DSL-02, DSL-03, DSL-04, DSL-05, DSL-06, DSL-07, CUR-02, CUR-03, CLI-04, CLI-05, CLI-06
**Success Criteria** (what must be TRUE):
  1. `defineSession({ name, viewport, url, steps })` validates input via zod and supports all 6 step kinds with sane human-pacing defaults (800–1500ms per action; ~80ms + jitter per keystroke)
  2. The script runner's pre-flight assertion phase walks all selectors before `recorder.start()` and aborts with zero output (no partial MP4) if any selector resolves to 0 or >1 elements
  3. `dismissOverlays()` is a first-class DSL helper; `frameLocator()` is the path of least resistance for any third-party widget interaction (iframe-aware by default, no arbitrary `sleep`, no `networkidle` for SPAs)
  4. The encoder's second pass composites a default cursor sprite from the `InteractionTimeline`, animating between waypoints with a 400–600ms cubic-bezier ease — visible in headless captures
  5. `ConsoleReporter` shows step-by-step progress in real time; `JsonReporter` (`--json` flag) emits machine-readable output; mid-session failure deletes partial artifacts and prints the failing step + URL clearly
**Plans**: TBD
**UI hint**: no

### Phase 3: Artifacts + CLI + hellotars Ship Gate (V1 SHIP)
**Goal**: A real, runnable `pnpm capture hellotars` that produces `out/browser-capture/hellotars/v01.mp4` — usable B-roll asset, README documents the v1 capability and the v2 acceptance checklist. **This is V1.**
**Depends on**: Phase 2
**Requirements**: CLI-01, CLI-02, CLI-03, ART-01, ART-02, SHOT-01, SHOT-02, SHOT-03, SHOT-04
**Success Criteria** (what must be TRUE):
  1. `pnpm capture <session>` runs a committed session and writes the MP4 to `out/browser-capture/<session-name>/v<NN>.mp4` with auto-bumping `NN` (matches existing `out/<project>/v<NN>` convention); `pnpm capture:preview <session>` runs headful + slowMo with no recording; headless is default, `--headful` opts in
  2. A sidecar `manifest.json` lands next to every MP4 with steps executed, duration, viewport, mode (`script`), git SHA, and ffmpeg flags
  3. `tools/browser-capture/sessions/hellotars.ts` is committed and `pnpm capture hellotars` produces an MP4 that passes the "Looks Done But Isn't" 12-item checklist from PITFALLS.md (cursor visible, smooth typing, no banner occluding the widget, entry animation full, CFR 30fps, bt709 color tags, faststart)
  4. The DOM-notes spike from Phase 1 informed the hellotars selectors; a `baseline.png` snapshot of the happy-path final frame is committed for future regression checks
  5. README documents the v1 capability, how to add a new session, and the acceptance checklist for future shots
**Plans**: TBD
**UI hint**: no

### Phase 4: Agent Mode + Codegen
**Goal**: Hybrid input model complete — exploratory NL prompts run a Claude Agent SDK loop that captures live and auto-serializes the executed steps into a committable, replayable session script
**Depends on**: Phase 1 (driver + recorder + encoder); Phase 3 strongly recommended so the deterministic path is proven first
**Requirements**: AGT-01, AGT-02, AGT-03, AGT-04, AGT-05
**Success Criteria** (what must be TRUE):
  1. `pnpm capture:agent --prompt "<NL>"` runs a Claude Agent SDK loop with custom tools (`browser_goto`, `browser_click`, `browser_type`, `browser_waitFor`, `browser_scroll`) that wrap the same `BrowserDriver` script mode uses — each tool call emits a `Step{}` to the same recorder/reporter pipeline
  2. Successful agent runs auto-serialize the executed step list to `tools/browser-capture/sessions/agent-<timestamp>.ts` (committable, replayable script — re-running it produces identical output deterministically)
  3. Cost guardrails are enforced and configurable: max tool calls, max tokens, max wall-clock; defaults are conservative; exceeding any cap aborts the run and saves the partial transcript
  4. The agent runner module is dynamically imported by the CLI — script-mode startup does not pay the SDK cost (no top-level `import '@anthropic-ai/claude-agent-sdk'`)
  5. `ANTHROPIC_API_KEY` is loaded from `.env` (gitignored, `.env.example` committed); a missing key produces a clear error before any browser launch — never committed in source
**Plans**: TBD
**UI hint**: no

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

(Phase 4 is technically independently developable since it shares Phase 1's primitives but not Phase 2/3's DSL or CLI surface — `parallelization=true` in config allows it. However, the user's reliability-first constraint means the deterministic path should be proven by shipping Phase 3 before agent mode is built.)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Capture Pipeline | 0/TBD | Not started | - |
| 2. Session DSL + Script Runner + Cursor Compositing | 0/TBD | Not started | - |
| 3. Artifacts + CLI + hellotars Ship Gate | 0/TBD | Not started | - |
| 4. Agent Mode + Codegen | 0/TBD | Not started | - |

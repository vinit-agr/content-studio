# Requirements: Content Studio — `tools/browser-capture/` milestone

**Defined:** 2026-04-21
**Core Value:** Cut the time from "I want to explain this idea" to "a published YouTube video" by giving Vinit a personal library of reusable, high-quality B-roll generation tools.

**Milestone scope:** First version of `tools/browser-capture/` — a standalone, reusable module that drives Chromium through scripted or LLM-driven actions, records the tab as MP4, and ships a first reference shot of hellotars.com.

## v1 Requirements

### Capture Pipeline

- [ ] **CAP-01**: Module captures browser tab as H.264 MP4 via streaming ffmpeg pipeline (screenshot-loop → ffmpeg stdin; **no** WebM intermediate, **not** Playwright `recordVideo`)
- [ ] **CAP-02**: Default output 1080p (1920×1080) at 30fps CFR with `deviceScaleFactor: 1`
- [ ] **CAP-03**: Tab-only recording — no OS chrome, no menu bars, no notifications
- [ ] **CAP-04**: Encoder defaults bake in YouTube-friendly flags: `-c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart -color_primaries bt709 -color_trc bt709 -colorspace bt709`
- [ ] **CAP-05**: Bundled `ffmpeg-static` binary — no system ffmpeg requirement; startup version check fails loudly if binary is broken
- [ ] **CAP-06**: Locked viewport — no resize during a session
- [ ] **CAP-07**: Chromium launched with `--mute-audio`, `--autoplay-policy=user-gesture-required`, `--force-color-profile=srgb` to prevent ambient noise, autoplay surprises, and color drift

### Session DSL

- [ ] **DSL-01**: TypeScript session DSL via `defineSession({ name, viewport, url, steps })` with zod runtime validation
- [ ] **DSL-02**: Step kinds supported: `goto`, `click`, `type`, `waitFor`, `wait`, `scroll`
- [ ] **DSL-03**: Wait strategies use `waitFor` / `waitForFunction` (no arbitrary `sleep`, no `networkidle` for SPAs)
- [ ] **DSL-04**: Configurable per-action delays with sane human-pacing defaults (800–1500ms)
- [ ] **DSL-05**: Per-keystroke typing delay default (≈80ms + jitter) — text never appears instantly
- [ ] **DSL-06**: `dismissOverlays()` helper available in the DSL for cookie banners / GDPR popups
- [ ] **DSL-07**: `frameLocator()`-first style for any third-party widget interaction (iframe-aware by default)

### Cursor Realism

- [ ] **CUR-01**: Recorder captures an interaction timeline (timestamp, x, y, event-kind) alongside frames
- [ ] **CUR-02**: Encoder's second pass composites a default cursor sprite using the timeline (cursor visible in headless captures)
- [ ] **CUR-03**: Cursor animates smoothly between waypoints (cubic-bezier ease, 400–600ms per move)

### CLI & UX

- [ ] **CLI-01**: `pnpm capture <session>` runs a committed session and writes the MP4
- [ ] **CLI-02**: `pnpm capture:preview <session>` runs headful + slowMo with no recording (debug-only)
- [ ] **CLI-03**: Headless by default; `--headful` flag opts into a visible browser
- [ ] **CLI-04**: `ConsoleReporter` shows step-by-step progress; `--json` flag emits machine-readable output
- [ ] **CLI-05**: Pre-flight assertion phase validates all selectors before `recorder.start()` — fail-fast with zero output if any selector is broken
- [ ] **CLI-06**: Mid-session failure deletes partial artifacts and prints failing step + URL clearly

### Artifacts

- [ ] **ART-01**: Output written to `out/browser-capture/<session-name>/v<NN>.mp4` with auto-bumping `NN` (matches existing `out/<project>/v<NN>` convention)
- [ ] **ART-02**: Sidecar `manifest.json` per capture: steps executed, duration, viewport, mode (script|agent), model (if agent), git SHA, ffmpeg flags

### Agent Mode (hybrid input model)

- [ ] **AGT-01**: `pnpm capture:agent --prompt "<NL>"` runs a Claude Agent SDK loop with custom browser tools (`browser_goto`, `browser_click`, `browser_type`, `browser_waitFor`, `browser_scroll`) wrapping the same `BrowserDriver` script mode uses
- [ ] **AGT-02**: Successful agent runs auto-serialize the executed step list to `tools/browser-capture/sessions/agent-<timestamp>.ts` (codegen — committable, replayable script)
- [ ] **AGT-03**: Cost guardrails enforced: configurable max tool calls, max tokens, max wall-clock; defaults are conservative
- [ ] **AGT-04**: Agent runner is dynamically imported — script-mode startup doesn't pay the SDK cost
- [ ] **AGT-05**: `ANTHROPIC_API_KEY` loaded from `.env`; never committed; missing key produces a clear error before any browser launch

### Reference Shot

- [ ] **SHOT-01**: hellotars.com session committed at `tools/browser-capture/sessions/hellotars.ts` — loads page → waits for chat widget → clicks widget → interacts (click button or scroll)
- [ ] **SHOT-02**: Pre-implementation DOM spike documented at `.planning/research/shots/hellotars-com/dom-notes.md` (iframe? cross-origin? shadow root open/closed?)
- [ ] **SHOT-03**: `pnpm capture hellotars` produces `out/browser-capture/hellotars/v01.mp4` that passes the "looks acceptable as B-roll" bar (cursor visible, smooth typing, no banner occluding the widget)
- [ ] **SHOT-04**: README documents the v1 capability and the acceptance checklist for future shots

## v2 Requirements

Deferred to a later milestone. Tracked but not in current roadmap.

### Polish FX

- **POL-01**: Branded cursor sprite + click pulse / ripple effect
- **POL-02**: Bezier cursor motion with ghost-cursor-style smoothing
- **POL-03**: Click sound effects mixed in via ffmpeg post-process (sidecar metadata + NLE overlay)
- **POL-04**: Typing sound effects mixed in via ffmpeg post-process
- **POL-05**: Auto-zoom / pan post-processor (Screen Studio's signature feature)
- **POL-06**: Smooth-scroll helper (CDP-based smooth wheel)
- **POL-07**: Page-load skeleton-hiding helper (`waitForReady`)

### Authoring

- **AUTH-01**: NL → script scaffolder (`pnpm capture:scaffold "<prompt>"`)
- **AUTH-02**: Multi-take recording (record N, pick best)
- **AUTH-03**: Sidecar `events.json` substrate for v2 SFX + future editor stitching

### Other Studio Tools (future milestones)

- **STUDIO-01**: AI-generated image/video B-roll tool (`tools/ai-gen/`)
- **STUDIO-02**: AI-generated voiceover (ElevenLabs) tool
- **STUDIO-03**: Talking-head capture/cleanup pipeline
- **STUDIO-04**: Final video stitching / FFmpeg editor (`tools/editor/`, `tools/ffmpeg/`)
- **STUDIO-05**: YouTube upload automation

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-tenant / team workflows | Personal channel; one developer, one machine |
| Cloud upload / SaaS integration | Out of charter — local-first tool |
| Heavy auth orchestration (SSO, MFA) | Not needed for personal-channel B-roll |
| robots.txt / scraping etiquette | This is not a crawler; one explicit shot at a time |
| Cross-browser support (Firefox/WebKit) | Chromium only; saves ~600MB and ~3min on first install |
| In-tool caption rendering | Captions live in Remotion, NLE, or YouTube |
| Real-time streaming output | Recording for post-production; live use case absent |
| In-tool video editing | Editing happens downstream; this tool produces raw assets |
| Plugin / extension system | YAGNI for personal scope |
| GUI session authoring | DSL is text — diffable, reviewable, AI-friendly |
| Routing browser-capture MP4 into Remotion compositions | Captured MP4 is a standalone asset; Remotion stays focused on motion graphics |
| Polishing existing Remotion stub primitives (Token, Span, Cursor, MetricBar, Chunk) | Out unless they block a current shot |
| Multiple reference shots in v1 | Only hellotars.com; more sites earn their place when actual videos need them |

## Traceability

Mapping populated by roadmapper.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAP-01 | TBD | Pending |
| CAP-02 | TBD | Pending |
| CAP-03 | TBD | Pending |
| CAP-04 | TBD | Pending |
| CAP-05 | TBD | Pending |
| CAP-06 | TBD | Pending |
| CAP-07 | TBD | Pending |
| DSL-01 | TBD | Pending |
| DSL-02 | TBD | Pending |
| DSL-03 | TBD | Pending |
| DSL-04 | TBD | Pending |
| DSL-05 | TBD | Pending |
| DSL-06 | TBD | Pending |
| DSL-07 | TBD | Pending |
| CUR-01 | TBD | Pending |
| CUR-02 | TBD | Pending |
| CUR-03 | TBD | Pending |
| CLI-01 | TBD | Pending |
| CLI-02 | TBD | Pending |
| CLI-03 | TBD | Pending |
| CLI-04 | TBD | Pending |
| CLI-05 | TBD | Pending |
| CLI-06 | TBD | Pending |
| ART-01 | TBD | Pending |
| ART-02 | TBD | Pending |
| AGT-01 | TBD | Pending |
| AGT-02 | TBD | Pending |
| AGT-03 | TBD | Pending |
| AGT-04 | TBD | Pending |
| AGT-05 | TBD | Pending |
| SHOT-01 | TBD | Pending |
| SHOT-02 | TBD | Pending |
| SHOT-03 | TBD | Pending |
| SHOT-04 | TBD | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 0 (roadmapper will populate)
- Unmapped: 34 ⚠️ (expected — roadmap not yet created)

---
*Requirements defined: 2026-04-21*
*Last updated: 2026-04-21 after initial definition*

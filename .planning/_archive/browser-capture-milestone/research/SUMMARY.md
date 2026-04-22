# Project Research Summary — `tools/browser-capture/`

**Project:** Content Studio — `tools/browser-capture/` milestone
**Domain:** Browser automation + tab recording for YouTube B-roll (TS/Node, pnpm monorepo, single-developer personal channel, reliability-first)
**Researched:** 2026-04-21
**Confidence:** HIGH overall (capture pipeline, architecture, pitfalls all verified against current Playwright issues, Chromium issue tracker, and 2026 ecosystem state; agent-mode runtime MEDIUM — the boundary is locked, the vendor inside that boundary may evolve)

---

## Executive Summary

`tools/browser-capture/` is a single-developer B-roll generator: drive Chromium through a deterministic, committed script (or an LLM agent for exploratory shots), record the tab, and write a clean MP4 to `out/browser-capture/<session>/v<NN>.mp4`. The first reference shot is hellotars.com → wait for chat widget → click → interact. Polish FX (cursor highlight, click sound, typing sound) are explicitly deferred per `PROJECT.md`; v1's job is to prove the pipeline is reliable and the module is reusable for future shots.

The expert pattern in 2026 is unambiguous: **Playwright as the driver, Chromium-only, headless by default, with a clean Driver/Recorder/Encoder separation behind interfaces** so any of those three layers can be swapped without touching session scripts or runners. The single most consequential decision — and the one the four research agents disagreed on — is *how* to capture frames. Playwright's built-in `recordVideo` is two lines of code and ships today, but its hard-coded ~1 Mbit/s VP8 bitrate and accumulated-timestamp drift (Playwright issue #35776) produce footage that looks soft and reads as visibly stuttery against a 4K talking-head shot on YouTube. The screenshot-loop → ffmpeg pipeline (the `webreel` / `puppeteer-screen-recorder` pattern) is more code but is the only path that meets the user's stated reliability bar.

The dominant risks are not technical novelty — they're four well-understood traps that bite this exact category of project: (1) the recorder choice above, (2) the cursor is invisible in headless and teleports between waypoints in headful so it must be composited from a recorded interaction timeline rather than captured, (3) the hellotars.com chat widget is almost certainly iframed with shadow DOM so a 15-minute Phase-0 DevTools spike has to happen before any selector lands in code, and (4) cookie banners / geo-targeted overlays will silently occlude the shot the first time it's run from a different IP. v1 is a small, well-scoped module — but every single one of those four traps will sink it if the architecture ignores them.

---

## Reconciled Decisions (the three things the agents disagreed on)

These are decided here, with rationale, so the roadmapper and downstream phase-planners stop relitigating them.

### Decision 1: Recorder approach — **screenshot-loop → ffmpeg pipeline (webreel-style), NOT Playwright `recordVideo`**

**Conflict:** STACK.md and ARCHITECTURE.md picked Playwright's built-in `recordVideo`. PITFALLS.md (Pitfall #1) explicitly said don't — built-in recordVideo has hard-coded ~1 Mbit/s VP8, accumulated-timestamp drift on long captures (Playwright issue #35776), and CDP screencast caps around 30fps. FEATURES.md noted Playwright's recorder fps is not configurable.

**Verdict:** PITFALLS wins. v1 ships with the screenshot-loop pattern: `Page.screenshot()` in a tight loop piped to ffmpeg stdin, encoded straight to MP4 (skip the WebM intermediate entirely — Pitfall #11). Lock framerate at the ffmpeg side with `-vsync cfr -r 30`. Encode `-c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart -color_primaries bt709 -color_trc bt709 -colorspace bt709`.

**Rationale:**
1. The user's hard constraint is "reliability over speed." A capture that looks soft / stutters on YouTube is *not reliable* in the only sense that matters — it can't ship. STACK's "in-process, no external dependency at capture time" reliability argument is real but solves a different reliability problem (process boundaries) than the one the user has (output quality).
2. ARCHITECTURE.md's `Recorder` interface design means swapping is cheap if we picked wrong — but the swap cost dwarfs the cost of just picking right the first time. The webreel pattern is well-documented and has a reference implementation we can copy.
3. The two-pass model (record raw frames + interaction timeline → composite cursor in a second ffmpeg pass) is a *required* prerequisite for Pitfall #2 (cursor invisibility). Built-in recordVideo can't do this; the screenshot-loop pattern can. Picking recordVideo would force a v2 rewrite the moment cursor compositing lands.

**Keep from STACK/ARCHITECTURE:** The `Recorder` interface lives. The default impl is now `ScreenshotLoopRecorder` (webreel-style); a `PlaywrightVideoRecorder` can be retained as a debug-only impl for fast iteration during script authoring (where output quality doesn't matter).

### Decision 2: Agent-mode runtime — **Claude Agent SDK with custom tools wrapping `BrowserDriver`, NOT Stagehand**

**Conflict:** STACK.md picked Stagehand 3.2.1 (TS-first, ~50k stars, CDP-native). ARCHITECTURE.md picked Claude Agent SDK with custom tools wrapping the same `BrowserDriver` script mode uses, so codegen falls out for free.

**Verdict:** ARCHITECTURE wins. Agent mode is `@anthropic-ai/claude-agent-sdk` with custom tools (`browser_goto`, `browser_click`, `browser_type`, `browser_waitFor`, `browser_scroll`) that wrap the shared `BrowserDriver`. Each tool call emits a `Step{}` to the same recorder/reporter pipeline as script mode. After a successful agent run, executed steps are auto-serialized to `sessions/agent-<timestamp>.ts` — a committable, replayable script.

**Rationale:**
1. The architecture's whole point is one execution path with two input sources. Stagehand brings its own page model, its own action surface (`act` / `observe` / `extract`), and its own LLM provider abstraction. Putting Stagehand inside the agent runner means the agent runner doesn't share `BrowserDriver` with script mode — defeating the unification the architecture is built around.
2. The user explicitly asked for a hybrid model where exploratory captures *become* committed scripts. That's the codegen flow ARCHITECTURE.md describes: agent emits `Step{}` events → end-of-run serializer writes `sessions/agent-<ts>.ts` → next run is deterministic. With Stagehand you'd have to translate Stagehand actions back into the DSL — extra layer, extra failure mode.
3. The repo is already going to use Claude (Vinit's working environment). One LLM provider, one SDK, one set of cost/safety guardrails (Pitfall #19) is simpler than introducing a second.
4. Stagehand stays on the table as a *future* alternative `Driver` impl if vision-first action resolution becomes attractive — the interface accommodates it. Just not the v1 default.

**Keep from STACK:** All of STACK's analysis of *what not to use* (no Browser-Use Python; no MCP-as-runtime-driver; no Anthropic Computer Use direct without an SDK wrapping the loop) still applies. Just the specific Stagehand pick is overruled.

### Decision 3: ffmpeg dependency — **`ffmpeg-static` (bundled binary), NOT system ffmpeg**

**Conflict:** STACK.md said require system ffmpeg (`brew install ffmpeg`); don't bundle. ARCHITECTURE.md picked `ffmpeg-static`. PITFALLS.md mentioned `@ffmpeg-installer/ffmpeg` and deferred to STACK.

**Verdict:** ARCHITECTURE wins. Use `ffmpeg-static`.

**Rationale:**
1. Reliability-first + personal-channel scope: a single `pnpm install` on a freshly-cloned repo (or a 6-months-from-now Vinit who has nuked his Mac) has to "just work" without "oh, also brew install ffmpeg." Pitfall #8 (version drift / not installed) is the canonical instance of the dev-experience UX trap that personal-channel tools die from.
2. STACK's argument that "the repo already manages platform-specific binaries via Remotion compositor packages — don't multiply that headache" is true but inverted: if managing platform binaries is already a known pattern in this repo, doing it again with `ffmpeg-static` is *cheap*, not headache-multiplying. The pattern is paid for.
3. `ffmpeg-static` ships with libx264 and yuv420p support out of the box, which is all v1 needs. Color-space tagging (Pitfall #13) and faststart (Pitfall #11) are fully supported.
4. Add a startup version check (`ffmpeg -version` parse → minimum 6.0) that fails loudly with a clear message if anything's wrong with the bundled binary.

### Sub-decision 4: Workspace layout — **single root `package.json`, NOT pnpm workspace per tool**

**Conflict:** ARCHITECTURE.md said single root `package.json` (matches `tools/remotion/`). STACK.md suggested pnpm workspace per tool with `pnpm add -F browser-capture`.

**Verdict:** ARCHITECTURE wins. Single root `package.json`. Browser-capture's deps go alongside Remotion's. Add a TS path-alias `@capture/*` → `tools/browser-capture/src/*` in the root `tsconfig.json` (mirrors existing alias convention).

**Rationale:** Existing repo convention. None of these tools ship to npm. Workspace fragmentation is YAGNI for this scope. Revisit only if a future tool genuinely can't coexist (conflicting Node versions, conflicting deps).

---

## Complementary Signals (no conflict, but load-bearing for the roadmap)

### Promote two "deferred" features into v1

`PROJECT.md` defers all polish FX to v2. FEATURES.md and PITFALLS.md both surfaced *specific* items that should be promoted into v1 because they're either nearly free or are infrastructure other things depend on:

- **T11 — Cursor overlay (composited, not captured).** PROMOTE TO V1. PITFALLS Pitfall #2 makes this non-negotiable: in headless Chromium there is no OS cursor in the recording, period. A click happens with no visible cursor → unusable B-roll. Even in headful, automated mouse moves teleport. The fix is to record an interaction timeline (timestamp, x, y, event) alongside the frames and composite a cursor sprite in a second ffmpeg pass. v1 ships a default sprite (no styling); v2 swaps in a branded cursor + click pulse without re-recording. The two-pass architecture *must* be in v1 even if the cursor sprite is plain.
- **D5 — Per-keystroke typing delay.** PROMOTE TO V1. Cost is one line: `page.type(text, { delay: 80 + jitter })`. Without it, typed text appears instantly which reads as obviously robotic.

The roadmapper should treat these as v1, not v2. They're cheap and they cross the "looks acceptable as B-roll" threshold that defines v1 success.

### Phase-0 spike: hellotars.com chat widget DOM

PITFALLS Pitfall #5 calls for a 15-minute DevTools investigation of the chat widget *before* writing any selector code. Output: `.planning/research/shots/hellotars-com/dom-notes.md` documenting (a) is the widget iframed? (b) cross-origin? (c) shadow root open or closed? This is a gate-zero task — not a phase, but a prerequisite to Phase 2. If the widget is closed-shadow, the script needs coordinate-based fallback and that affects the DSL.

### Cursor compositing is the keystone

Multiple agents independently identified that the cursor must be composited rather than captured (FEATURES T11, ARCHITECTURE cursor-overlay note in v2 boundaries section, PITFALLS Pitfall #2). When the agents agree this strongly, the roadmap should treat the two-pass capture-then-composite architecture as v1 infrastructure, not v2 polish. The polish is the *sprite design*; the *two-pass pipeline* is a v1 must-have.

---

## Key Findings

### Recommended Stack

Playwright drives the browser; a custom `ScreenshotLoopRecorder` captures frames (not Playwright's `recordVideo`); `ffmpeg-static` encodes to MP4 in a streaming pipeline; Claude Agent SDK powers the optional agent runner. All TypeScript, all reusing the existing pnpm + ESM + TS-strict conventions of the repo. No paid cloud browsers, no Python, no MCP at runtime, no Stagehand.

**Core technologies:**
- **`playwright` 1.59.1** — browser driver + selector resolution + auto-wait actionability. Chromium only (don't install Firefox/WebKit; saves ~600MB and ~3min on first install). Used for `Page.screenshot()`, `page.click/type/waitFor`, `frameLocator()`, `Page.accessibility.snapshot()` (the latter for agent mode).
- **`ffmpeg-static`** — bundled cross-platform ffmpeg binary. Streaming pipeline: screenshot stream → ffmpeg stdin → MP4 on disk. Encoder flags: `-c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart -color_primaries bt709 -color_trc bt709 -colorspace bt709`.
- **`@anthropic-ai/claude-agent-sdk`** — agent runner only. Custom tools wrap `BrowserDriver`. Each tool call emits a `Step{}` to the same pipeline as script mode. End-of-run serializer writes `sessions/agent-<ts>.ts`. Loaded dynamically so script-mode startup doesn't pay the cost.
- **`commander`** — CLI argument parsing. De-facto Node CLI choice in 2026.
- **`zod`** — runtime validation of `Session` config shape. Matches the existing repo pattern of validate-at-definition-time (cf. `frames.ts` scene contiguity check in Remotion).
- **`dotenv`** — `.env` loader for `ANTHROPIC_API_KEY`. Lazy-validated only when agent mode runs.
- **`tsx`** (dev) — runs `.ts` shot scripts directly from CLI.

**Explicit avoids:** Puppeteer (weaker auto-wait, Chromium-only anyway), CDP `Page.startScreencast` directly (~30fps cap), `recordVideo` for shipped output (Pitfall #1), `fluent-ffmpeg` (unmaintained), Browser-Use (Python), Stagehand (doesn't fit the unified-driver architecture), MCP servers as runtime drivers (right tool, wrong layer — useful at design time only), cloud browsers (Browserbase/Browserless/Steel — out of scope for personal channel), `puppeteer-extra` stealth plugins (not needed for hellotars.com).

See **STACK.md** for full alternatives matrix and version compatibility table.

### Expected Features

The categorization below reflects the v1-promotions noted above (T11 and D5 moved up from v2).

**Must have (v1 table stakes):**
- T1 Tab-only recording (no OS chrome)
- T2 1080p output minimum (1920×1080, deviceScaleFactor 1 by default — see Pitfall #6)
- T3 Deterministic, replayable TypeScript session DSL (`defineSession({ name, viewport, url, steps })`)
- T4 Robust wait strategies (`waitFor`, `waitForFunction`, NOT arbitrary `sleep()`, NOT `networkidle` for SPAs)
- T5 Headless default; `--headful` flag for debugging only
- T6 MP4 output via streaming ffmpeg pipeline to `out/browser-capture/<session>/v<NN>.mp4` with auto-bumping `NN`
- T7 Configurable per-action delays (human-like 800–1500ms pacing)
- T8 Stable, locked viewport (no resize mid-session)
- T9 Preview / dry-run via `pnpm capture:preview <session>` (headful + slowMo, no recording)
- T10 Error reporting on mid-session failure; delete partial artifacts; clear failing-step + URL output
- **T11 Cursor compositing (PROMOTED FROM V2)** — record interaction timeline; composite sprite in second ffmpeg pass
- **D5 Per-keystroke typing delay (PROMOTED FROM V2)** — `{ delay: 80 + jitter }` everywhere typing happens

**Should have (v1.5 — add when first shot validates the approach or a real shot demands it):**
- D6 Smooth scroll helper
- D7 Page-load skeleton hiding (waitForReady helper)
- D11 NL → script scaffolder (`pnpm capture:scaffold "<prompt>"`)
- D12 Live agent mode (Claude Agent SDK runner — see Decision 2)
- D16 Sidecar `events.json` with timecodes (substrate for v2 SFX, future editor stage)

**Defer (v2+):**
- D1 Bezier cursor motion (swap default sprite for ghost-cursor-style smoothing)
- D2 Branded cursor highlight ring
- D3 Click pulse / ripple effect
- D4 Auto-zoom / pan post-processor (Screen Studio's signature feature)
- D8/D9 Click and typing sound effects (sidecar metadata + NLE overlay)
- D10 Multi-take recording

**Anti-features (permanently out — see FEATURES.md A1–A10):** multi-tenant workflows, cloud upload, heavy auth orchestration, robots.txt awareness, cross-browser support, in-tool caption rendering, real-time streaming, in-tool video editing, plugin systems, GUI authoring.

See **FEATURES.md** for the full T1–T11 / D1–D16 / A1–A10 matrix with complexity, dependencies, and competitor positioning.

### Architecture Approach

Hexagonal-lite with two peer runners feeding one capture pipeline. The CLI dispatches to either `runner/script.ts` (loads a `Session` config and walks `steps[]`) or `runner/agent.ts` (Claude Agent SDK loop with custom tools). Both runners produce the same `Step{}` event stream. The stream flows through `BrowserDriver` (action surface) and a separate `Recorder` (frame capture surface). When the recorder stops, the `FfmpegEncoder` post-processes raw frames + interaction timeline into the final MP4. The `Reporter` taps the step stream from the side via callbacks (no console.log scattered through business logic, per existing repo convention).

The structural insight that makes this work: **agent mode is just a different `Step{}` source**. The Claude Agent SDK's tool handlers translate LLM tool calls into `Step{}` events, then call the same `BrowserDriver.execute(step)` that scripts do. Codegen (NL → committable script) falls out for free as an end-of-run serialization of the executed step list.

**Major components:**
1. **CLI** (`src/cli.ts`) — `commander`-based; dispatches to runner; owns `--help` and exit codes.
2. **Script Runner** (`src/runner/script.ts`) — dynamic-imports `sessions/<name>.ts`, validates the exported `defineSession(...)` config via `zod`, walks `steps[]` against the driver.
3. **Agent Runner** (`src/runner/agent.ts`) — Claude Agent SDK loop with custom browser tools. Dynamically imported so script mode doesn't pay the SDK cost.
4. **BrowserDriver** (`src/driver/`) — interface + `PlaywrightDriver` impl. Owns the `Page` handle. The only place `playwright` is imported.
5. **Recorder** (`src/recorder/`) — interface + `ScreenshotLoopRecorder` (default, screenshot-loop → ffmpeg stdin) + `PlaywrightVideoRecorder` (debug-only, fast iteration). Records interaction timeline alongside frames.
6. **Encoder** (`src/encoder/`) — `FfmpegEncoder` wrapping `ffmpeg-static`. Streaming pipeline; second pass composites cursor sprite from timeline.
7. **Artifacts** (`src/artifacts/`) — output path resolution with `v<NN>` auto-bump, `manifest.json` writer (steps, duration, viewport, mode, model if agent, git SHA).
8. **Reporter** (`src/reporter/`) — `ConsoleReporter` (pretty step-by-step) + `JsonReporter` (`--json` for CI). Subscribes to the step event stream.
9. **Session DSL** (`src/dsl/defineSession.ts`) — typed config helper; identity at runtime, type-narrowing at authoring time.
10. **Sessions** (`tools/browser-capture/sessions/`) — committed shot scripts. First entry: `sessions/hellotars.ts`.

**File layout:** Single root `package.json`. Module under `tools/browser-capture/`. Output to repo-root `out/browser-capture/<session>/v<NN>.mp4` (matches existing convention). TS path alias `@capture/*` → `tools/browser-capture/src/*`. See **ARCHITECTURE.md** for the full directory tree.

### Critical Pitfalls

The four that *will* sink v1 if ignored. Full list in PITFALLS.md (20 pitfalls, mapped to phases).

1. **Built-in `recordVideo` is not video-grade.** ~1 Mbit/s VP8, accumulated-timestamp drift on long captures, CDP screencast capped ~30fps. **Avoid by:** using the screenshot-loop → ffmpeg pipeline as the v1 default recorder (Decision 1).
2. **Cursor invisible / teleports.** Headless has no OS cursor; even headful's automated mouse teleports. **Avoid by:** recording an interaction timeline (timestamp, x, y, event) alongside frames; compositing a cursor sprite in a second ffmpeg pass; animating cursor between waypoints with cubic-bezier ease over 400–600ms.
3. **Iframe / shadow-DOM blindness on the chat widget.** Tars's chat widget is almost certainly iframed and shadow-DOM'd. Top-frame `page.locator(...)` will silently match nothing. **Avoid by:** Phase-0 DevTools spike to document the widget's DOM shape; default `frameLocator()` for any third-party widget interaction; coordinate-based fallback documented for closed shadow roots.
4. **Cookie banners / geo-targeted overlays occlude the shot.** EU GDPR banner appears on first run from a different IP and overlaps the chat widget. **Avoid by:** always launching a fresh `browserContext` (no `storageState`); centralized `dismissOverlays()` helper after `goto`; pre-seeding consent cookies via `context.addCookies()` for known sites; pinning geolocation and timezone explicitly.

The next tier (still important, less catastrophic): HiDPI scale-factor mismatch (Pitfall #6 — pick `deviceScaleFactor: 1` as the pragmatic default), choppy frames during page-load animation (Pitfall #3 — two-phase `domcontentloaded` + readiness-assertion + 500–1000ms stabilization dwell before `recorder.start()`), color profile shift (Pitfall #13 — `--force-color-profile=srgb` + bt709 encoder tags), and ffmpeg version drift (Pitfall #8 — handled by Decision 3's bundled binary).

See **PITFALLS.md** for the full 20-pitfall inventory plus the "Looks Done But Isn't" v1 acceptance checklist (12 items the ship gate should run through).

---

## Implications for Roadmap

Six phases, with one pre-phase spike. The natural ship-to-validate cut is after Phase 4 (one working deterministic hellotars shot). Phases 5 and 6 are additive.

### Phase 0 (gate-zero spike, ~30 min): hellotars.com DOM investigation + ffmpeg-static smoke test

**Rationale:** Two prerequisites that prevent rework. (a) Open hellotars.com in DevTools, document the chat widget's DOM shape (iframe? cross-origin? shadow root open/closed?) to `.planning/research/shots/hellotars-com/dom-notes.md`. Without this, Phase 4's selector code is a guess. (b) Verify `ffmpeg-static` installs cleanly on Vinit's Mac and produces a 5-second test MP4 with the target encoder flags. Confirms Decision 3 before the encoder layer is built around it.
**Delivers:** `.planning/research/shots/hellotars-com/dom-notes.md` + a throwaway `tools/browser-capture/scratch/ffmpeg-smoke.ts` proving the binary works.
**Avoids:** Pitfall #5 (iframe/shadow-DOM blindness), Pitfall #8 (ffmpeg version drift detected before code commits to the choice).
**Research flag:** None. Pure investigation.

### Phase 1: Driver + Recorder + Encoder primitives (the capture pipeline)

**Rationale:** This is the architectural backbone. Decision 1 (screenshot-loop recorder) makes this *the* highest-risk phase — get the streaming pipeline right and everything downstream is easy; get it wrong and Phase 4 ships unacceptable footage. Building all three primitives together (driver, recorder, encoder) lets a single smoke test validate the end-to-end frame-to-MP4 path before any DSL or CLI exists.
**Delivers:** `interface BrowserDriver` + `PlaywrightDriver` impl covering 6 step kinds (`goto`, `click`, `type`, `waitFor`, `wait`, `scroll`); `interface Recorder` + `ScreenshotLoopRecorder` (frames + interaction timeline → ffmpeg stdin); `FfmpegEncoder` wrapping `ffmpeg-static`. Smoke test: load google.com, sleep 3s, click somewhere, write 30fps CFR H.264 MP4 to disk, verify with ffprobe.
**Uses:** `playwright`, `ffmpeg-static`, `node:child_process`.
**Avoids:** Pitfall #1 (recorder choice locked correctly from day one), Pitfall #11 (skip WebM intermediate, encode straight to MP4), Pitfall #12 (stream pipeline, no per-frame PNGs to disk), Pitfall #13 (color tagging baked into encoder defaults), Pitfall #16 (default headless avoids macOS TCC).
**Research flag:** **Needs research-phase.** The screenshot-loop pattern has a known reference (webreel) but the exact Playwright integration (where to attach the screenshot loop, how to share a `Page` between the driver and the recorder without contention, how to handle backpressure when ffmpeg encoding stalls) deserves a dedicated research pass before implementation. Look at `vercel-labs/webreel` and `puppeteer-screen-recorder` source.

### Phase 2: Session DSL + Script Runner + Pre-flight + Reporter

**Rationale:** With the capture pipeline proven, layer on the authoring experience. The DSL is the surface Vinit will spend the most time at; the script runner walks it; pre-flight assertions (Pitfall #4) catch broken selectors before recording starts; the reporter gives Vinit visibility into long captures. Cursor compositing pass also lands here — it's part of the encoder's "second pass" but the trigger and timeline-merging logic belong with the runner.
**Delivers:** `defineSession()` helper + `Session` / `Step` / `Manifest` types in `src/types.ts`; `runner/script.ts` that loads `sessions/<name>.ts`, validates with zod, walks `steps[]`; pre-flight assertion phase (runs all selectors before `recorder.start()`, fails fast); `dismissOverlays()` helper; `ConsoleReporter` + `JsonReporter`; cursor compositing as the encoder's second pass.
**Uses:** `zod`, `commander` (for the reporter's `--json` flag if exposed early).
**Implements:** Patterns 1, 2, 3, 4 from ARCHITECTURE.md.
**Avoids:** Pitfall #2 (cursor compositing pass), Pitfall #4 (pre-flight assertions), Pitfall #7 (`dismissOverlays()` helper), Pitfall #10 (autoplay-policy default in driver).
**Research flag:** Standard patterns. Skip research-phase. The DSL design is a short-loop iteration; cursor compositing has the webreel reference.

### Phase 3: Artifacts + CLI + first runnable session

**Rationale:** Tie everything together. The artifacts module owns output-path resolution (`v<NN>` auto-bump matching the existing `out/cx-agent-evals--chunk-vs-span/v01.mp4` convention) and manifest writing. The CLI wires `commander` to the script runner. A throwaway `sessions/google.ts` validates the full chain end-to-end before betting on hellotars.
**Delivers:** `src/artifacts/outPath.ts` + `manifest.ts`; `src/cli.ts` with `pnpm capture <session>` and `pnpm capture:preview <session>`; `tools/browser-capture/sessions/google.ts` smoke test; root `package.json` scripts.
**Uses:** `commander`, `node:fs/promises`.
**Avoids:** Pitfall #14 (default headless, document studio collision in README).
**Research flag:** Standard patterns. Skip research-phase.

### Phase 4: hellotars.com session — **V1 SHIP POINT**

**Rationale:** First real shot. Combines everything: pre-flight assertions, frameLocator usage from Phase-0 spike, dismissOverlays for any cookie banner, cursor compositing pass producing the final MP4. **This is V1.** `pnpm capture hellotars` produces `out/browser-capture/hellotars/v01.mp4` — a usable B-roll asset.
**Delivers:** `tools/browser-capture/sessions/hellotars.ts`; `.planning/research/shots/hellotars-com/baseline.png` (snapshot of the happy-path final frame for future regression checks); README documenting the v1 capability and the v2 acceptance checklist from PITFALLS.md.
**Avoids:** Validates avoidance of Pitfalls #1, #2, #3, #4, #5, #6, #7, #10, #11, #13 in one go. Run the "Looks Done But Isn't" 12-item checklist as the ship gate.
**Research flag:** Skip research-phase. By Phase 4 the patterns are all proven; this is application of them.

### Phase 5 (additive, post-V1): Agent runner + codegen

**Rationale:** Hybrid input model completion. Per Decision 2, this is `@anthropic-ai/claude-agent-sdk` with custom tools wrapping the same `BrowserDriver`. End-of-run serializer auto-writes `sessions/agent-<ts>.ts`. Can be developed and validated independently because the driver/recorder/encoder are already proven by Phase 4. Token-cost guardrails (Pitfall #19) and re-snapshot-before-action (Pitfall #20) are first-class concerns here.
**Delivers:** `src/runner/agent.ts` (dynamically loaded); `pnpm capture:agent --prompt "..."` CLI subcommand; `.env.example` with `ANTHROPIC_API_KEY`; codegen serializer that writes executed steps to `sessions/agent-<ts>.ts`; cost cap defaults (max calls, max tokens, max wall-clock).
**Uses:** `@anthropic-ai/claude-agent-sdk`, `dotenv`.
**Implements:** Pattern 4 from ARCHITECTURE.md (agent-as-tool-caller).
**Avoids:** Pitfall #17 (a11y snapshot via `page.accessibility.snapshot()`, constrained tool surface), Pitfall #18 (codegen makes runs reproducible after the fact), Pitfall #19 (hard caps), Pitfall #20 (re-snapshot guard).
**Research flag:** **Needs research-phase.** Claude Agent SDK 2026 API surface, custom tool registration shape, accessibility-snapshot patterns vs screenshot patterns, cost-cap implementation. Latest Anthropic Agent SDK docs should be re-checked at planning time.

### Phase 6 (deferred, v2+): Polish FX

**Rationale:** Per `PROJECT.md`, deferred to v2. Cursor sprite design (currently default), branded highlight ring, click pulse, smooth Bezier cursor (D1), sound-effect sidecar metadata (D8/D9), auto-zoom post-processor (D4). All build on the Phase 1–2 infrastructure — no rewrites.
**Delivers:** v2 increments. Not part of v1 roadmap.
**Research flag:** Defer entirely. Re-research at the v2 milestone.

### Phase Ordering Rationale

- **Phase 0 before Phase 1:** Decision 3 must hold (ffmpeg smoke test) before the encoder is designed around `ffmpeg-static`. Decision affecting Phase 4 (hellotars selector strategy) emerges from the DOM spike.
- **Capture pipeline before DSL (Phase 1 before 2):** The DSL's expressiveness is shaped by what the driver can do reliably. Building DSL first risks specifying actions the driver can't ergonomically support.
- **Pre-flight + reporter in Phase 2, not Phase 1:** They depend on the `Step` event shape, which only stabilizes once the driver is real.
- **Artifacts + CLI before hellotars (Phase 3 before 4):** A real shot needs the right output path on disk, otherwise Phase 4 conflates "did the capture work" with "did the path resolution work."
- **Agent mode last (Phase 5 after 4):** Agent shares all the Phase 1–3 infrastructure; building it before the deterministic path is proven would mean debugging two things at once. The user's reliability-first constraint also implies "make the boring path work first."

### Research Flags Summary

| Phase | Research-phase needed? | Why |
|-------|------------------------|-----|
| Phase 0 | No | Pure investigation, the spike *is* the research |
| Phase 1 | **Yes** | Screenshot-loop ↔ Playwright integration patterns, ffmpeg streaming pipeline implementation; check `webreel` and `puppeteer-screen-recorder` source |
| Phase 2 | No | Standard patterns: typed DSL helper, zod validation, EventEmitter-based reporter |
| Phase 3 | No | Standard patterns: commander CLI, output-path resolution, manifest serialization |
| Phase 4 | No | Application of proven patterns to one shot; the Phase 0 spike covers domain-specific research |
| Phase 5 | **Yes** | Claude Agent SDK 2026 API, accessibility-snapshot vs screenshot tradeoffs, cost-cap patterns |
| Phase 6 | Deferred | Re-research at v2 milestone |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified via Context7 against current Playwright, Stagehand, Puppeteer docs; npm versions fetched 2026-04-21; reconciled `recordVideo` recommendation overruled by PITFALLS based on Playwright issue #35776 and webreel pattern evidence |
| Features | MEDIUM-HIGH | HIGH on capture mechanics; MEDIUM on polish techniques (competitor-product features rather than canonical APIs); promotion of T11 and D5 to v1 is a defensible call but worth flagging as "first real shot validates" |
| Architecture | HIGH | Hexagonal-lite is well-precedented; component boundaries map cleanly to existing repo conventions (single root `package.json`, TS path aliases, `out/<project>/v<NN>` output convention). One genuine uncertainty (Stagehand vs Claude Agent SDK) reconciled in Decision 2 |
| Pitfalls | HIGH | All 20 pitfalls trace to Playwright/Chromium issue tracker, established community patterns (webreel, puppeteer-screen-recorder), or Vinit's stated environment (macOS Retina). Pitfall-to-phase mapping is explicit |

**Overall confidence:** **HIGH.** This is a well-trodden domain with one genuine architectural fork (recorder choice) that has been resolved in favor of reliability. The vendor-specific risks (Stagehand vs Claude Agent SDK; ffmpeg-static vs system) have been resolved with stated rationale. The remaining unknowns are concrete and bounded (Phase 1 needs a research-phase on streaming-pipeline integration; Phase 5 needs a research-phase on the latest Agent SDK API).

### Gaps to Address

- **Streaming-pipeline backpressure:** What happens when the ffmpeg encoder stalls? The screenshot loop must either drop frames (acceptable — produces frame-duplication, smooth) or block (unacceptable — produces clock drift in the page, breaks timing). Phase 1 research must answer this with a concrete pattern, not a TODO.
- **Cursor compositing math:** Where exactly do x/y coordinates come from? The driver's `mouse.move(x, y)` is in viewport coordinates, but the encoder needs frame-buffer coordinates. With `deviceScaleFactor: 1` they're the same; with deviceScaleFactor: 2 they're not. Confirm the assumption (Decision: viewport pixels = frame pixels with DPR=1) holds before Phase 2 cursor compositing lands.
- **Agent SDK API drift:** `@anthropic-ai/claude-agent-sdk` is recent (TS SDK shipped 2025); Phase 5's research-phase should re-verify the custom-tool registration shape and the system-prompt-vs-tool-description pattern that's working as of planning time.
- **hellotars.com chat widget:** Closed shadow roots are a hard blocker for selector-based interaction. Phase 0's spike must explicitly determine open vs closed; if closed, Phase 4 needs coordinate-based click code which has its own brittleness profile.
- **Promoting T11/D5 to v1:** Decision is made above, but the roadmapper should sanity-check this against project velocity. If Phase 2's cursor-compositing scope blows out, T11 falls back to v1.5 with the keystone *infrastructure* (interaction timeline + two-pass encoder) staying in v1.

---

## Sources

### Primary (HIGH confidence)
- Context7 verified: `/microsoft/playwright`, `/puppeteer/puppeteer`, `/browserbase/stagehand`, `/microsoft/playwright-mcp`
- npm registry (fetched 2026-04-21): playwright@1.59.1, puppeteer@24.42.0, @browserbasehq/stagehand@3.2.1, @playwright/mcp@0.0.70, @anthropic-ai/sdk@0.90.0, ffmpeg-static@5.3.0
- Playwright official docs: [Videos](https://playwright.dev/docs/videos), [Auto-waiting / actionability](https://playwright.dev/docs/actionability), [Network](https://playwright.dev/docs/network), [Emulation](https://playwright.dev/docs/emulation)
- Anthropic official docs: [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview), [Computer use tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)
- Existing repo `.planning/codebase/`: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, CONCERNS.md, STACK.md (brownfield reference for tool conventions, security posture, output-path pattern)
- Existing repo `.planning/PROJECT.md` (milestone scope, constraints, key decisions)

### Secondary (MEDIUM confidence)
- Playwright issue tracker: [#35776 unstable video frame rate](https://github.com/microsoft/playwright/issues/35776), [#8683 tuning video performance](https://github.com/microsoft/playwright/issues/8683), [#10855 better video quality](https://github.com/microsoft/playwright/issues/10855), [#12056 configure video quality](https://github.com/microsoft/playwright/issues/12056), [#36628 deviceScaleFactor edge cases](https://github.com/microsoft/playwright/issues/36628), [#38433 traces not cleaned up](https://github.com/microsoft/playwright/issues/38433), [#3107 cookie EU law popup](https://github.com/microsoft/playwright/issues/3107)
- Reference implementations (webreel pattern): [vercel-labs/webreel](https://github.com/vercel-labs/webreel), [puppeteer-screen-recorder](https://www.npmjs.com/package/puppeteer-screen-recorder), [Browserless: high quality Puppeteer screencasts](https://www.browserless.io/blog/puppeteer-screencasts)
- Cursor compositing references: [ghost-cursor-playwright](https://github.com/reaz1995/ghost-cursor-playwright), [Screen Studio cursor guide](https://screen.studio/guide/cursor), [Cursorful (open source Screen Studio alt)](https://cursorful.com/), [Recordly](https://github.com/WizardofTryout/recordly)
- 2026 ecosystem comparisons: [Playwright vs Puppeteer 2026 (BrowserStack)](https://www.browserstack.com/guide/playwright-vs-puppeteer), [Stagehand vs Browser Use vs Playwright (NxCode)](https://www.nxcode.io/resources/news/stagehand-vs-browser-use-vs-playwright-ai-browser-automation-2026), [Stagehand vs Browser Use (Skyvern, Feb 2026)](https://www.skyvern.com/blog/browser-use-vs-stagehand-which-is-better/)
- ffmpeg WebM→MP4 patterns: [Shotstack](https://shotstack.io/learn/webm-to-mp4/), [OTTVerse](https://ottverse.com/convert-webm-to-mp4-with-ffmpeg/), [addpipe blog](https://blog.addpipe.com/converting-webm-to-mp4-with-ffmpeg/)
- Color tagging for YouTube: [Blackmagic Forum: Fixing Gamma Shifts on YouTube](https://forum.blackmagicdesign.com/viewtopic.php?f=21&t=151863), [Oliver Norred: Force sRGB on Chrome](https://olivernorred.com/blog/life-tip-force-srgb-color-profile-on-chrome/)
- Iframes / shadow DOM: [Automate The Planet: Playwright IFrame and Shadow DOM Automation](https://www.automatetheplanet.com/playwright-tutorial-iframe-and-shadow-dom-automation/), [Playwright issue #1375 native shadow DOM](https://github.com/microsoft/playwright/issues/1375), [issue #23047 force-open closed shadow roots](https://github.com/microsoft/playwright/issues/23047)
- Chromium screencast frame rate: [Chromium issue 40934921](https://issues.chromium.org/issues/40934921), [Chromium auto-throttled screen capture design doc](https://www.chromium.org/developers/design-documents/auto-throttled-screen-capture-and-mirroring/)

### Tertiary (LOW confidence — single source / inferred)
- Magnitude reliability claims (vision-first, BSL-licensed): [Show HN: Magnitude](https://news.ycombinator.com/item?id=44390005) — not selected, noted for future re-evaluation
- Justin Abrahms — Generating demo videos with Playwright (Feb 2026): single-author blog, useful as practical pattern reference but not a canonical source

Full source inventories live in the underlying research files — see `STACK.md`, `FEATURES.md`, `ARCHITECTURE.md`, `PITFALLS.md`.

---

*Research synthesis for: `tools/browser-capture/` v1 milestone*
*Synthesized: 2026-04-21*
*Ready for roadmap: yes — proceed to requirements definition (Step 7) and roadmapper (Step 8)*

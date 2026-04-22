# Feature Research

**Domain:** Browser-capture for B-roll (personal-channel YouTube videos)
**Researched:** 2026-04-21
**Confidence:** MEDIUM-HIGH (HIGH on capture mechanics; MEDIUM on polish techniques because they're competitor-product features rather than canonical APIs)

## Context

This module produces standalone MP4s of "a real person browsing a tab where things happen," dropped into talking-head technical videos as B-roll. The first reference shot is hellotars.com → wait for chat widget → click → interact. The bar is "looks acceptable in a YouTube edit at 1080p," not "indistinguishable from Screen Studio." Polish FX (cursor highlight, click sounds, typing sounds) are explicitly deferred per `PROJECT.md`.

The categorization below is opinionated for that scope. "Table stakes" means *for v1 to feel acceptable as B-roll* — not for a generic screen-recording product.

## Feature Landscape

### Table Stakes (Required for v1 to look acceptable)

Missing any of these and the captured MP4 either won't be usable in an edit, or will look obviously like an automation script.

| # | Feature | Why Expected | Complexity | Dependencies | Notes |
|---|---------|--------------|------------|--------------|-------|
| T1 | **Tab-only recording (not full screen)** | Captures need to look like a clean browser viewport, no OS chrome, no other apps | LOW | Playwright `recordVideo` (built-in) | Playwright's `BrowserContext.recordVideo` records the page surface only. No display server gymnastics needed. |
| T2 | **1080p output minimum (1920×1080 or higher)** | YouTube delivers at 1080p+; sub-1080p footage looks soft against talking-head 4K | LOW | Set `viewport: {1920, 1080}` + `deviceScaleFactor: 2` for crispness | Playwright defaults to scaling down to 800×800; must explicitly override `recordVideo.size`. Use 2× DPI for HiDPI sharpness. |
| T3 | **Deterministic, replayable script format** | A committed script must produce the same recording on re-run; explicitly stated constraint in `PROJECT.md` | LOW | TypeScript file under `tools/browser-capture/sessions/` | TypeScript (not YAML/JSON) — matches existing repo conventions, gives type-checked actions, and lets the author drop into raw Playwright when needed. |
| T4 | **Robust wait strategies (not arbitrary `sleep()`)** | The reference shot waits for a chat widget to mount; brittle waits = re-shoots; reliability > speed per project constraint | MEDIUM | Playwright `waitFor`, `waitForSelector`, `waitForFunction` | Auto-waiting on locator actions handles most cases. Add explicit `expect(locator).toBeVisible()` for things like the chat widget. Avoid `networkidle` for SPA-heavy targets. |
| T5 | **Headless OR headful, both work** | `PROJECT.md` constraint: don't overthink display servers | LOW | Playwright (both modes built-in) | Headless Chromium produces video identical to headful for `recordVideo`. Headful useful for live debugging during script authoring. |
| T6 | **MP4 output to `out/browser-capture/<session>/v<NN>.mp4`** | Stated requirement in `PROJECT.md`; matches existing `out/` convention from Remotion | MEDIUM | ffmpeg (for WebM→MP4 conversion) | Playwright records to WebM (VP8/VP9). H.264 MP4 is the YouTube-native format. ffmpeg one-liner: `-c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -movflags +faststart`. |
| T7 | **Configurable per-action delays (human-like pacing)** | Bot-speed clicks (instant, no hover pause) read as obviously robotic on camera | LOW | Playwright `page.waitForTimeout()` between actions; or a `pause(ms)` action in the DSL | Without this, the chat-widget shot would: load → instantly click → look like a script. With 800–1500ms pauses around interactions, it reads as "person browsing." |
| T8 | **Stable viewport sizing** | Resizing mid-capture causes layout reflow visible in the output | LOW | Set viewport in `browser.newContext()` once | Lock viewport at session start. Don't allow resize actions in v1. |
| T9 | **Session preview / dry-run via `pnpm studio`-like dev loop** | Iterating on a script without rendering full video each time | MEDIUM | Playwright headful + `--ui` mode, OR a custom `pnpm capture:preview <session>` that runs without `recordVideo` | The dev loop matters because authoring a shot is iterative. Headful + `slowMo: 250` is the cheapest version. |
| T10 | **Error reporting when a session fails mid-capture** | Silent failures = corrupted MP4s in the `out/` directory; you only notice in the edit | LOW | try/catch around session steps; delete partial WebM on failure | Print which step failed + selector + page URL. Don't leave a half-recorded WebM that looks complete. |
| T11 | **No-cursor-baked-into-viewport at 0,0 issue** | Playwright's `recordVideo` shows the *page* but the OS cursor isn't in the recording at all by default in headless mode — viewers see clicks happen with no visible mouse | MEDIUM | Either: (a) run headful and rely on OS cursor, OR (b) inject a CSS cursor overlay via `page.addInitScript()` that follows `mousemove` events | This is the single biggest "looks weird" issue if not addressed. A real person browsing has a visible cursor. The injected-overlay approach is what tools like Screen Studio do — record the page without the OS cursor, then composite a cursor on top. For v1 a simple injected `<div>` cursor that follows pointer events is enough. |

### Differentiators (Make captures noticeably nicer — mostly v2)

These elevate "acceptable B-roll" to "polished B-roll." Per `PROJECT.md`, polish FX are explicitly deferred to v2. Listed here so the v1 architecture doesn't preclude them.

| # | Feature | Value Proposition | Complexity | Dependencies | v1 / v2 |
|---|---------|-------------------|------------|--------------|---------|
| D1 | **Smooth (Bezier) cursor motion vs. teleporting** | Default Playwright `page.mouse.move(x, y)` jumps instantly. Real cursors curve, accelerate, decelerate. Bezier paths read as human. | MEDIUM | `ghost-cursor-playwright` or `human-cursor` (npm); both use Bezier curves with randomized control points | **v2** for the dedicated lib; **v1** can do a poor-man's version via `page.mouse.move(x, y, { steps: 25 })` which interpolates linearly across N steps. Surprisingly OK for short distances. |
| D2 | **Cursor highlight ring / spotlight** | Helps viewers track focus in B-roll played at small size | MEDIUM | Custom CSS via `page.addInitScript()` injecting a glowing `div` that tracks pointer | **v2.** Build on top of T11 (the cursor overlay must already exist). |
| D3 | **Click ripple / pulse effect** | Visual confirmation that "a click happened here" — important when audio is muted in the edit | LOW | CSS keyframe animation triggered on `mousedown` via injected script | **v2.** Cheap to add once T11 cursor overlay exists. ~30 lines of CSS + JS. |
| D4 | **Auto-zoom / pan to focal regions** | Screen Studio's signature feature. Crops the frame around the active interaction so viewers see the chat widget at full size, not a tiny corner of the viewport | HIGH | Post-processing: ffmpeg `crop` + `scale` filters keyed off action timestamps; OR record action timeline metadata and have a separate compositor read it | **v2 or v3.** Doing this *during* capture is hard. Doing it as a post-process on a captured WebM + an action-timeline JSON is tractable. Out of scope for now. |
| D5 | **Typing visualization (per-keystroke pacing)** | Default `page.type(text)` types instantly. Real typing has 50–150ms per keystroke with variation. Looks like a person. | LOW | `page.type(text, { delay: 80 })` is built into Playwright; randomize delay per keystroke for realism | **v1 candidate.** Cheapest possible polish — just pass `{ delay: 80 + jitter }` everywhere. Worth promoting from v2 to v1 because the cost is one line. |
| D6 | **Scroll smoothing (cinematic ease-in-out)** | `page.mouse.wheel(0, 500)` is jerky; CSS `scroll-behavior: smooth` gives nicer arcs | LOW | Either `element.scrollIntoView({ behavior: 'smooth' })` via `page.evaluate`, or CDP `Input.synthesizeScrollGesture` | **v1 candidate** if reference shot needs scrolling. The hellotars.com shot may not need this in v1 (load → click widget → interact). Add when first shot demands it. |
| D7 | **Page-load skeleton hiding (avoid flash-of-unstyled-content)** | First 200–500ms of a page load is often unstyled HTML, then layout shifts. Looks janky in B-roll. | MEDIUM | Wait for a known "page is ready" signal (specific element visible, web font loaded) before starting recording | **v1 candidate.** Solution: don't start the visible portion of the recording until `page.waitForLoadState('domcontentloaded')` *and* a target element is visible. Optionally trim leading frames in post. |
| D8 | **Click sound effects** | Mechanical/soft click SFX in the edit timeline | LOW (audio asset) + MEDIUM (timing metadata) | Action-timeline JSON written alongside MP4; SFX added in NLE | **v2.** Output a sidecar `events.json` with frame-accurate timestamps for clicks/keystrokes. Editor adds SFX manually or via FFmpeg overlay. |
| D9 | **Typing sound effects** | Ditto for keyboard SFX | LOW + MEDIUM | Same sidecar metadata pattern as D8 | **v2.** |
| D10 | **Multi-take support (record N takes, pick best)** | If a site has flaky timing, run the script 3× and keep the cleanest take | LOW | Script runs N times, outputs `v01-take1.mp4`, `v01-take2.mp4`, ... | **v2.** Only earns its place if a target site proves flaky in practice. |
| D11 | **NL → script generation (one-shot, write-time)** | "Write a session that loads hellotars.com, waits for the chat widget, clicks it" → outputs TypeScript file | MEDIUM | LLM API (Anthropic/OpenAI) + a few shot examples of session DSL | **v1.5 candidate.** Useful because authoring sessions is the bottleneck. Could be a separate `pnpm capture:scaffold "<NL prompt>"` command. Per `PROJECT.md` this is part of the hybrid model. |
| D12 | **Live agent mode (NL drives actions at runtime)** | Exploratory captures: "browse around the docs and find the pricing page, then click through it" | HIGH | Stagehand (TypeScript-native, CDP-based) or Browser-Use (Python) | **v1 alongside scripted mode**, per `PROJECT.md`'s hybrid requirement. **Stagehand** is the right pick: TS-first, mixes AI with code, ~50k stars, production-ready. Browser-Use is Python and would force a separate runtime. |
| D13 | **Showactions overlay (Playwright's built-in annotation)** | Playwright 1.51+ has a `showActions` option in `recordVideo` that overlays action titles ("click [data-widget]") on the recording | LOW | Built-in: `recordVideo: { showActions: { duration: 500, position: 'top-right' } }` | **v1 candidate but probably skip.** Useful for *debugging* captures, not for shipping B-roll. Don't ship videos with selector overlays in them. |
| D14 | **Caption / annotation overlays (project-controlled)** | Designer-controlled text over the video ("Watch the chat widget appear ↓") | MEDIUM | Out-of-band: rendered in Remotion or NLE on top of the captured MP4 | **Anti-feature for browser-capture itself.** Belongs in Remotion compositions or the editor stage, not in the capture tool. The MP4 is a clean asset; annotations are an edit-time concern. |
| D15 | **Transparent background / chroma key** | Composite the browser onto a custom background in Remotion | HIGH | Browser doesn't natively render transparent. Requires green-screen viewport + ffmpeg chroma key, OR per-frame PNG capture with alpha | **v3+.** Mostly unnecessary for talking-head B-roll. Defer indefinitely. |
| D16 | **Timecode / frame metadata sidecar** | Per-frame timestamp data so a future stitcher can sync to other tracks | LOW | Write `metadata.json` alongside MP4 with fps, duration, action timeline | **v1.5 candidate.** Cheap, future-proofs integration with a future `tools/editor/` or `tools/ffmpeg/` module. |

### Anti-Features (Explicitly avoid — overscope risk)

These are commonly requested or "obvious" but actively wrong for a personal-channel B-roll tool. Including them creates SaaS-shaped complexity for zero personal-channel value.

| # | Feature | Why Tempting | Why Wrong For This Project | What To Do Instead |
|---|---------|--------------|---------------------------|--------------------|
| A1 | **Multi-tenant / team workflows** | "What if other people use this?" | Personal channel scope; one user, one machine; no auth, no roles, no project sharing | Single-machine, file-based sessions in the repo |
| A2 | **Cloud upload / SaaS hosting** | Browserbase/Steel.dev model | Adds external dependency, runtime cost, latency, debugging complexity. Local Chromium is faster and free. | Run Playwright locally. If a site needs a real browser fingerprint, that's a future problem. |
| A3 | **Heavy auth flow handling** (OAuth helpers, CAPTCHA solvers, session vaults) | "What if I need to record a logged-in dashboard?" | The reference shot is a public site. Even if a future shot needs auth, Playwright `storageState` (one file, JSON) is enough. | Use Playwright's `storageState: 'auth.json'` saved manually one time. Don't build auth orchestration. |
| A4 | **Rate-limit-respecting crawler / robots.txt awareness** | This isn't a scraper. We're capturing 1 minute of one tab. | Adds zero value, adds policy & dependency surface | Don't crawl. One session = one URL or hand-authored navigation flow. |
| A5 | **Cross-browser support (Firefox + WebKit recording)** | Playwright supports it; tempting to "be thorough" | Personal channel only renders to YouTube; one browser is fine. Firefox `recordVideo` has bugs (deviceScaleFactor ignored). | Chromium only. Document this as an explicit choice. |
| A6 | **Built-in caption / annotation rendering** | "Wouldn't it be nice to type captions in the script and have them burnt in?" | Couples the capture tool to rendering decisions that belong in Remotion or the editor. Hard to iterate on caption design once burnt in. | Output clean MP4 + sidecar metadata. Do annotations in Remotion or NLE. |
| A7 | **Real-time streaming output (RTMP, etc.)** | Trendy tech | YouTube uploads are async. We never need a live feed. | Render to file, upload via the YouTube web UI. |
| A8 | **In-tool video editor (cuts, trims, concatenations)** | "I might want to trim the start" | A separate `tools/ffmpeg/` or `tools/editor/` milestone owns this. Listed as future work in `PROJECT.md`. | Trim/cut in the editor stage. Capture stays single-purpose. |
| A9 | **Plugin / extension system** | Architectural temptation for "extensibility" | Personal-channel scope means no plugin authors exist. Adds API surface to maintain. | If a new shot needs a new capability, add it directly to the module. |
| A10 | **GUI for authoring sessions** | "Wouldn't a record-and-playback GUI be nice?" | Authoring as code matches `PROJECT.md` constraints (TypeScript, deterministic, replayable). A GUI generates messy artifacts. | NL → script (D11) is the closest acceptable thing. |

## Feature Dependencies

```
T1 (tab-only recording) ──┐
T2 (1080p + DPI)         ──┼──> T6 (MP4 output)
T8 (stable viewport)     ──┘            │
                                         │
T11 (cursor overlay) ─────────────────> D2 (cursor highlight)
                  │                  └─> D3 (click ripple)
                  └──────────────────> D1 (smooth Bezier cursor)

T4 (wait strategies) ─────────────────> T9 (preview/dry-run)
                  └───────────────────> T10 (error reporting)

T3 (script DSL) ──────────────────────> D11 (NL → script)
              └───────────────────────> D12 (live agent mode)

T6 (MP4 output) ─────enhances───────> D8 (click SFX), D9 (typing SFX)
                                      via D16 (timecode sidecar)

D4 (auto-zoom) ─────requires─────────> D16 (action timeline metadata)
```

### Dependency Notes

- **T11 (cursor overlay) is the keystone polish dependency.** Without it, D1/D2/D3 (Bezier motion, highlight, ripple) have nothing to attach to. Build the overlay infrastructure in v1 even if the polish FX themselves are v2.
- **T6 (MP4 output) requires ffmpeg.** Playwright records WebM natively; H.264 MP4 conversion is a post-step. ffmpeg is already a "expected to exist" dep in the broader content-studio context (future `tools/ffmpeg/`).
- **D16 (timecode sidecar) is the integration substrate** for future audio polish (D8, D9), auto-zoom (D4), and downstream stitching. Cheap to add in v1.5; pays off later.
- **D11 (NL → script) and D12 (live agent) both depend on T3 (script DSL).** The DSL must be expressive enough that an LLM can target it and a human can read what was generated.
- **D1 (Bezier cursor) and T11 (cursor overlay) are coupled but separable.** T11 is "render *some* cursor"; D1 is "move it nicely." v1 ships T11 with default Playwright `mouse.move({ steps: 25 })`. v2 swaps in ghost-cursor.

## MVP Definition

### Launch With (v1 — reference shot ships)

The minimum to record hellotars.com → wait for chat widget → click → interact and have a usable B-roll MP4.

- [ ] **T1** Tab-only recording via Playwright `recordVideo`
- [ ] **T2** 1920×1080 viewport, deviceScaleFactor 2 for crispness
- [ ] **T3** TypeScript session DSL (sessions live in `tools/browser-capture/sessions/<name>.ts`)
- [ ] **T4** Wait strategies built into the DSL (waitForVisible, waitForFunction)
- [ ] **T5** Headless default; `--headful` flag for debugging
- [ ] **T6** MP4 output via ffmpeg post-conversion (H.264, CRF 18, faststart)
- [ ] **T7** Configurable per-action delays (`pause(ms)`, `withDelay(ms)` in DSL)
- [ ] **T8** Locked viewport for the session
- [ ] **T9** `pnpm capture:preview <session>` — runs headful with `slowMo`, no recording
- [ ] **T10** Try/catch around steps; delete partial WebM on failure; log failing step + URL
- [ ] **T11** Injected cursor overlay (custom CSS `<div>` tracking pointer events) — required so clicks are visible
- [ ] **D5** `page.type(text, { delay: 80 + jitter })` everywhere typing happens — one-line polish, ship it

### Add After Validation (v1.5 — once first shot is published)

Add when a real shot demands it or when authoring friction shows up.

- [ ] **D6** Smooth scroll helper in DSL — when first shot needs scrolling
- [ ] **D7** Page-load skeleton hiding — when a target site has visible FOUC
- [ ] **D11** NL → script scaffolder (`pnpm capture:scaffold "<prompt>"`) — when authoring 3+ shots feels slow
- [ ] **D16** Sidecar `events.json` with timecodes — when starting on `tools/editor/`
- [ ] **D12** Live agent mode (Stagehand-based) — when a one-off exploratory capture is needed and writing a script feels like overkill

### Future Consideration (v2+)

- [ ] **D1** Bezier cursor motion (ghost-cursor-playwright)
- [ ] **D2** Cursor highlight ring (CSS overlay)
- [ ] **D3** Click ripple effect (CSS keyframes)
- [ ] **D4** Auto-zoom / pan post-processor (reads action timeline → ffmpeg crop)
- [ ] **D8 / D9** Click and typing SFX (sidecar metadata + NLE overlay)
- [ ] **D10** Multi-take recording

### Permanently Out of Scope

- All of A1–A10 (anti-features)
- Cross-browser recording (Chromium only)
- Browser-capture as a SaaS / hosted tool
- Real-time streaming output

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| T1 Tab-only recording | HIGH | LOW | P1 |
| T2 1080p + HiDPI | HIGH | LOW | P1 |
| T3 TS session DSL | HIGH | LOW | P1 |
| T4 Wait strategies | HIGH | MEDIUM | P1 |
| T6 MP4 output | HIGH | MEDIUM | P1 |
| T7 Configurable delays | HIGH | LOW | P1 |
| T9 Preview / dry-run | MEDIUM | MEDIUM | P1 (DX) |
| T10 Error reporting | MEDIUM | LOW | P1 |
| T11 Cursor overlay | HIGH | MEDIUM | P1 |
| D5 Typing delay | MEDIUM | LOW | P1 (cheap polish) |
| D6 Smooth scroll | MEDIUM | LOW | P2 |
| D7 Skeleton hiding | MEDIUM | MEDIUM | P2 |
| D11 NL → script | MEDIUM | MEDIUM | P2 |
| D12 Live agent mode | MEDIUM | HIGH | P2 |
| D16 Timecode sidecar | LOW (now) / HIGH (later) | LOW | P2 |
| D1 Bezier cursor | MEDIUM | MEDIUM | P3 |
| D2 Cursor highlight | MEDIUM | MEDIUM | P3 |
| D3 Click ripple | MEDIUM | LOW | P3 |
| D4 Auto-zoom | HIGH | HIGH | P3 |
| D8/D9 Click/typing SFX | MEDIUM | MEDIUM | P3 |
| D10 Multi-take | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for v1 reference shot
- P2: Should have, add when first shot validates the approach (v1.5)
- P3: Polish / nice-to-have, future consideration (v2+)

## Competitor / Reference Tool Analysis

The closest "competitors" aren't direct — they're either pure browser-automation libs (no polish) or pure desktop screen recorders (no automation). The opportunity is the intersection.

| Feature | Playwright (raw) | Screen Studio | Cursorful | Stagehand | This Project (v1) |
|---------|------------------|---------------|-----------|-----------|-------------------|
| Tab-only recording | Yes (`recordVideo`) | No (records OS) | Crops desktop | Via Playwright | Yes |
| Smooth cursor | No (instant `mouse.move`) | Yes (smoothed) | Yes | No | Step-interpolated (v1); Bezier (v2) |
| Cursor highlight | No | Yes | Yes | No | v2 |
| Click ripple | No | Yes | Yes | No | v2 |
| Auto-zoom | No | Yes (signature) | Yes | No | v3 |
| Scriptable / replayable | Yes (Playwright) | No (manual recording) | No | Yes | Yes |
| NL agent mode | No | No | No | Yes (`agent` primitive) | v1.5 (Stagehand-backed) |
| MP4 output | WebM (needs ffmpeg) | MP4 native | MP4 | N/A | MP4 (post-convert) |
| Headless / CI-friendly | Yes | No | No | Yes | Yes |
| Cost | Free (OSS) | $229 one-time | Free | Free OSS + LLM cost | Free (local) |

**Strategic positioning for this project:** Hit Playwright's reliability/scriptability + a credible subset of Screen Studio's polish (T11 cursor overlay in v1; D1/D2/D3 in v2), running locally with no SaaS dependency. Don't try to match Screen Studio's auto-zoom (D4) — that's a post-processor problem owned by a future `tools/editor/`.

## Quality Gate Checklist

- [x] Categories clear (Table Stakes T1–T11; Differentiators D1–D16; Anti-features A1–A10)
- [x] Complexity noted per feature (LOW/MEDIUM/HIGH columns)
- [x] Dependencies identified (per-feature `Dependencies` column + cross-feature graph)
- [x] Polish features (cursor/sounds) explicitly tagged v1/v1.5/v2 with rationale (D1, D2, D3, D8, D9 all flagged v2 with reasoning; D5 promoted to v1 because cost is one line)

## Sources

**Playwright video recording (HIGH confidence — Context7 + official docs):**
- [Playwright Videos documentation](https://playwright.dev/docs/videos)
- [Playwright recordVideo API params (Context7 /microsoft/playwright)](https://github.com/microsoft/playwright/blob/main/docs/src/videos.md) — confirms `size`, `dir`, and `showActions` (1.51+) options
- [Playwright Emulation / deviceScaleFactor docs](https://playwright.dev/docs/emulation)
- [Issue #17217: feature request to add fps to recordVideo](https://github.com/microsoft/playwright/issues/17217) — confirms fps is *not* configurable in built-in recorder; third-party libs needed if fps control matters
- [Issue #10855: video quality limitations discussion](https://github.com/microsoft/playwright/issues/10855)

**CDP / alternative high-quality recording (MEDIUM confidence — community projects):**
- [headless-screen-recorder using HeadlessExperimental.beginFrame](https://github.com/brianbaso/headless-screen-recorder) — higher-fidelity recording approach if Playwright's built-in proves insufficient
- [Chrome DevTools Protocol Page domain](https://chromedevtools.github.io/devtools-protocol/tot/Page/) — `startScreencast` reference

**Cursor / polish (MEDIUM confidence — verified across multiple sources):**
- [ghost-cursor (npm)](https://www.npmjs.com/package/ghost-cursor) and [ghost-cursor on GitHub](https://github.com/Xetera/ghost-cursor) — Bezier-curve human cursor for Puppeteer
- [ghost-cursor-playwright](https://github.com/reaz1995/ghost-cursor-playwright) and [ghost-cursor-play](https://github.com/bn-l/ghost-cursor-play) — Playwright forks
- [human-cursor](https://github.com/CloverLabsAI/human-cursor) — alt Playwright Bezier cursor lib
- [Screen Studio cursor guide](https://screen.studio/guide/cursor) — reference for what "good cursor polish" looks like
- [Cursorful (open source Screen Studio alternative)](https://cursorful.com/) — confirms the inject-overlay-not-bake-OS-cursor pattern
- [Recordly (open source Screen Studio alternative)](https://github.com/WizardofTryout/recordly) — reference implementation of cursor overlay technique

**Wait strategies / reliability (HIGH confidence — official docs):**
- [Playwright Auto-waiting (actionability)](https://playwright.dev/docs/actionability)
- [Playwright Network docs](https://playwright.dev/docs/network)
- [BrowserStack: avoiding flaky Playwright tests](https://betterstack.com/community/guides/testing/avoid-flaky-playwright-tests/)

**ffmpeg WebM → MP4 (HIGH confidence):**
- [Shotstack: WebM to MP4 with ffmpeg](https://shotstack.io/learn/webm-to-mp4/)
- [OTTVerse: Converting WebM to MP4 with FFmpeg](https://ottverse.com/convert-webm-to-mp4-with-ffmpeg/)

**Live agent mode comparisons (MEDIUM confidence — competitor product pages):**
- [Stagehand on GitHub](https://github.com/browserbase/stagehand) — TypeScript-first; v3 is CDP-native
- [Stagehand vs Browser Use vs Playwright (NxCode)](https://www.nxcode.io/resources/news/stagehand-vs-browser-use-vs-playwright-ai-browser-automation-2026)
- [Stagehand vs Browser Use (Skyvern blog)](https://www.skyvern.com/blog/browser-use-vs-stagehand-which-is-better/)
- [11 Best AI Browser Agents in 2026 (Firecrawl blog)](https://www.firecrawl.dev/blog/best-browser-agents)

**Smooth scroll / CDP scroll gestures (MEDIUM confidence):**
- [Issue #3269: Mouse smooth scroll discussion](https://github.com/microsoft/playwright/issues/3269)
- [Scroll a page with DevTools Protocol](https://astro-notion-xi.vercel.app/posts/page-scroll-with-cdp)

---
*Feature research for: browser-capture B-roll tool*
*Researched: 2026-04-21*

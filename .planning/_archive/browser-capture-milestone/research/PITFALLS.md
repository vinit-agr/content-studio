# Pitfalls Research — `tools/browser-capture/`

**Domain:** Browser-driven screen recording for YouTube B-roll (single-shot reliability over throughput)
**Researched:** 2026-04-21
**Confidence:** HIGH for capture-pipeline and selector pitfalls (multiple authoritative sources, including current Chromium / Playwright issues); MEDIUM for agent-mode pitfalls (newer ecosystem, fewer post-mortems); MEDIUM for color/HiDPI claims (verified against Chromium issue tracker, but exact reproduction depends on Vinit's macOS hardware).

This document is written in the same shape as `.planning/codebase/CONCERNS.md` — issue → files/components → impact → fix approach — so the roadmap can map each pitfall to a phase and a verification step.

---

## Critical Pitfalls

These are the ones that, if missed in v1, will cause Vinit to scrap the recording and re-shoot it manually. The user explicitly chose reliability over speed; everything in this section is reliability-relevant.

### Pitfall 1: Built-in `Page.screencast` / Playwright video recording is not video-grade

**What goes wrong:**
Playwright's built-in `recordVideo` and Puppeteer's `Page.startScreencast` (CDP) are designed for *test debugging* and silently degrade quality in ways that look catastrophic on a YouTube cut: hard-coded ~1 Mbit/s VP8 bitrate, frame-duplication-based timing that drifts on long recordings (accumulated rounding error → unstable FPS), and a CDP screencast pipeline that taps out around 30fps even though Chrome renders at 60fps internally.

**Why it happens:**
These APIs were never built to produce a master file for editing. The Playwright team has publicly declined to expose bitrate/quality controls (issues #8683, #10855, #12056 over multiple years). On Chromium, `Page.screencastFrame` historically didn't even respect the `screencastFrameAck` backpressure, leading to dropped frames under any real CPU load.

**Warning signs:**
- Final MP4 looks soft / blocky compared to native Chrome window in the same viewport
- Frame counter visibly stutters during fast scrolls or chat-widget transitions
- ffprobe reports "vfr" (variable frame rate) on what was supposed to be 30/60 fps CFR
- File feels too small (a 60s 1080p capture under 5 MB is a quality red flag, not a win)

**Prevention strategy:**
- Do not use Playwright's built-in `recordVideo` for shipped B-roll. Use it only for debugging the script itself.
- Use a screenshot-loop → ffmpeg pipeline (the `puppeteer-screen-recorder` / `webreel` model: Page.captureScreenshot in a tight loop, piped to ffmpeg with `-r 30 -vsync cfr`). This pattern is what Vercel's `webreel` and `puppeteer-screen-recorder` chose precisely because the CDP screencast was too lossy.
- Lock the framerate at the ffmpeg side with `-vsync cfr -r 30` so timing drift in the capture loop becomes frame duplication (smooth) rather than clock drift (sync wobble in editor).
- Set explicit codec params: `-c:v libx264 -pix_fmt yuv420p -crf 18 -preset slow -movflags +faststart`. CRF 18 is visually lossless for screen content; preset slow trades speed for size, which matches "reliability over speed."

**Phase to address:** Phase 1 (capture pipeline) — this is the architectural choice that determines whether v1 is salvageable. Locking it in early prevents a v2 rewrite.

**Verification:** ffprobe must report constant 30 fps, yuv420p, H.264 high profile; visual A/B against a manual QuickTime recording of the same flow.

---

### Pitfall 2: Cursor is invisible / teleports in the recording

**What goes wrong:**
Headless Chromium does not render an OS cursor — there is nothing to capture. Even in headful mode, automation moves the *logical* mouse position via `Input.dispatchMouseEvent`; the OS cursor sprite is not part of the page and is not present in the screencast bitmap. Result: viewer sees a button click "happen" with no visual cause. If you do composite a fake cursor from `mouse.move()` calls, the default behavior is to teleport instantly between coordinates, which reads as broken.

**Why it happens:**
CDP's mouse events are application-level, not OS-level. Capturing the real OS cursor requires `ScreenCaptureKit` / display-server capture, which is a totally different code path from the page screencast. This is why both `webreel` and `puppeteer-screen-recorder` composite a cursor sprite per-frame from a recorded interaction timeline rather than relying on the OS pointer.

**Warning signs:**
- First playback shows clicks but no pointer
- Pointer "jumps" between targets instead of gliding
- Hover-revealed UI (chat-widget tooltips, button hover states) never appears in the recording even though the script clicks them

**Prevention strategy:**
- Maintain an explicit `InteractionTimeline` (timestamp, x, y, event type) recorded *alongside* the frame loop. Composite a cursor sprite onto each frame in a second ffmpeg pass. This is the `webreel` two-pass model and it is the correct architecture.
- For the click on hellotars.com's chat widget, animate cursor motion between waypoints using an easing curve (e.g. cubic-bezier ease-in-out over 400–600ms). 30fps × 500ms = 15 interpolated positions; that is what reads as "natural" on YouTube.
- Trigger an explicit `page.hover()` *before* `page.click()` so any hover-state UI has time to appear in the frame buffer. Add a 150–300ms dwell.
- For v2 polish (deferred per PROJECT.md), the cursor sprite can be replaced with a branded pointer + click-pulse FX. Architect the timeline now so v2 only swaps the sprite.

**Phase to address:** Phase 1 (capture pipeline must record the timeline) + Phase 2 (cursor compositing pass). Splitting record and composite into two passes also enables re-rendering cursor changes without re-running the browser — important for iteration speed on YouTube edits.

**Verification:** Manual review of v01 MP4 — every click in the script must show a cursor arriving at the target before the click and lingering briefly after.

---

### Pitfall 3: Choppy frames during page-load animation (the moment that matters most)

**What goes wrong:**
The most visually interesting part of any web demo is the first 1–3 seconds: hero animations playing, fonts swapping in, the chat widget bouncing in. This is exactly when the main thread is most contended (parsing HTML, executing JS, decoding images). A naïve "navigate → start recording" sequence captures dropped frames precisely during the money shot. The chat widget's entry animation may be cut in half if recording starts too late, or you record 2 seconds of blank page if it starts too early.

**Why it happens:**
- `page.goto()` with default `waitUntil: 'load'` returns when stylesheets and images finish — but JS-driven entry animations and font-display swaps happen *after* that.
- `networkidle` is unreliable: pages with persistent WebSocket connections (chat widgets often have one!) never go idle; pages with analytics beacons every few seconds also never settle.
- The screencast capture loop competes for the same CPU as the page render. Starting capture during peak layout work guarantees dropped frames.

**Warning signs:**
- Chat widget appears already-on-screen (entry animation cut off)
- First half-second of MP4 shows white flash / FOIT (Flash Of Invisible Text)
- ffprobe shows frame durations of 60–100ms when target is 33ms (30fps)

**Prevention strategy:**
- Two-phase load: (1) `page.goto(url, { waitUntil: 'domcontentloaded' })` to start, (2) a domain-specific *readiness assertion* (e.g. `expect(page.frameLocator('iframe[src*=tars]').getByRole('button', { name: /chat/i })).toBeVisible()`) before starting recording.
- Add a short stabilization dwell (500–1000ms) after readiness, before `recorder.start()`, so font swap and any one-off entry animations finish.
- For shots where the entry animation IS the content (e.g. chat widget bouncing in), reverse the order: navigate, *then* start recorder, *then* trigger the animation manually if possible (e.g., scroll into view) so the recorder is already running and warmed.
- Pin the page's `prefers-reduced-motion` to `'no-preference'` explicitly via `context.setMediaPreference()` so a CI runner with reduced-motion default doesn't accidentally suppress the animation you came to film.

**Phase to address:** Phase 1 (recorder lifecycle API), Phase 2 (per-shot script patterns: the `waitForReady()` helper).

**Verification:** Re-record the hellotars.com shot 5 times in a row; every output must show the chat widget's full entry animation.

---

### Pitfall 4: Selector flake against a live, third-party site

**What goes wrong:**
Unlike test automation against your own app, B-roll captures hellotars.com — a site Vinit doesn't fully control via this repo's deploy cycle. A copy change ("Chat" → "Talk to us"), an A/B test, or a CSS class rename silently breaks the committed script overnight. The recording succeeds (no error), but it captures the wrong thing — or worse, errors mid-recording and produces a half-second corrupted MP4 that wastes Vinit's time before he notices.

**Why it happens:**
- Text-based selectors (`getByText('Chat')`) break on copy changes
- CSS-class selectors break on framework upgrades that hash class names
- `nth-child` / structural selectors break when marketing adds a banner above the widget
- Chat widgets are typically iframed and shadow-DOM'd (open or closed). Top-frame selectors silently never match.

**Warning signs:**
- Script succeeded but no click was registered (cursor moved to (0,0) or to an unrelated coordinate)
- Recording shows the page loaded but the click never landed
- Intermittent failures correlated with day of week (A/B test cohort rotation)
- Errors of the form "strict mode violation: locator resolved to N elements"

**Prevention strategy:**
- Use Playwright's `frameLocator` API for the chat widget specifically — assume it's iframed. Verify with DevTools first. Hellotars.com's widget should be inspected once and the selector pattern documented in the shot script.
- Prefer role-based selectors (`getByRole('button', { name: /chat/i })`) with case-insensitive regex over exact text. Survives small copy changes.
- For shadow DOM: Playwright pierces *open* shadow roots automatically; closed shadow roots cannot be reached at all. If the widget uses closed shadow DOM, fall back to coordinate-based clicks via screenshot landmarks (CV-light), and document the limitation.
- Each shot script must include a **pre-flight assertion phase** that runs all selectors *before* `recorder.start()` and fails fast with a clear error. A failed assertion produces a 0-byte MP4 (or none) instead of a half-recording. The shot script's `pre-flight` block is a first-class concept.
- Snapshot the "happy path" once and commit a screenshot to `.planning/research/shots/hellotars-com/baseline.png`. Diff against it as a sanity check (manual for v1; visual-regression tooling for v2).

**Phase to address:** Phase 2 (shot-script schema must enforce pre-flight assertions); Phase 3 (per-shot baseline screenshots).

**Verification:** Deliberately break a selector in the script and confirm the recording aborts before the MP4 is created.

---

### Pitfall 5: Iframe and shadow-DOM blindness for chat widgets

**What goes wrong:**
The hellotars.com chat widget is, by Tars's own architecture, almost certainly an iframe with internal shadow DOM. Standard `page.locator('button.chat-launcher')` will find nothing — the selector resolves against the top-frame DOM, which doesn't contain the widget's internals. The script appears to "click" but actually clicks empty page background; the recording shows nothing happening.

**Why it happens:**
Chat widgets are designed to be sandboxed from the host page. That sandboxing is achieved via iframes (style isolation, security) and shadow DOM (DOM isolation). Both mechanisms are invisible to a developer who hasn't explicitly accounted for them. Playwright pierces open shadow roots transparently but *not* iframes — you must use `frameLocator()`. If the widget uses closed shadow roots, even Playwright cannot reach inside.

**Warning signs:**
- DevTools "Inspect" on the chat button shows `#shadow-root` or an `<iframe>` ancestor
- `page.locator(...).count()` returns 0 even though the element is visible on screen
- "Element not found" errors on what is plainly a visible UI element

**Prevention strategy:**
- Phase-1 spike: Open hellotars.com in DevTools, inspect the widget, document its DOM structure (top-frame iframe? cross-origin? shadow root open or closed?) in `.planning/research/shots/hellotars-com/dom-notes.md`. This single 15-minute investigation prevents the entire pitfall.
- Adopt `frameLocator()` as the default for any third-party widget interaction; the shot-script API should make this the path of least resistance, not an opt-in.
- If the widget is closed-shadow, fall back to coordinate-based click using `page.mouse.click(x, y)` with x/y derived from a `boundingBox()` of the *iframe element itself* plus a known internal offset. Document the offset; commit a screenshot for sanity.
- For the cross-origin iframe case, ensure the browser context isn't blocking it (some bot-protection setups block third-party iframes by default).

**Phase to address:** Phase 0 (research spike on hellotars.com widget), Phase 2 (shot-script API).

**Verification:** First green run of the hellotars shot proves it; baseline screenshot in `.planning/research/shots/` is the long-term proof.

---

### Pitfall 6: HiDPI / Retina scale-factor mismatch (2x capture, 1x output, or vice versa)

**What goes wrong:**
Vinit's Mac is almost certainly a Retina display (deviceScaleFactor 2). If the browser context uses `deviceScaleFactor: 2` (the default for "Desktop Chrome HiDPI" presets) but the recording target is 1920×1080, two failure modes appear: (a) the captured frame is 3840×2160 and gets downscaled to 1080p on encode → soft text; (b) the viewport is 1920×1080 logical / 3840×2160 physical, but the screencast captures at the logical resolution → blurry on Retina playback. The site itself also serves different image assets at @1x vs @2x — recording at the wrong scale captures the wrong assets.

**Why it happens:**
Two coordinate systems collide: CSS pixels (logical), device pixels (physical), and the recording resolution (chosen separately). Playwright's "Desktop Chrome HiDPI" preset notably has a known issue (#36628 family) where deviceScaleFactor isn't always applied consistently. Headless Chromium also has its own quirks — `--force-device-scale-factor` can clip the viewport.

**Warning signs:**
- Final MP4 has visibly soft text vs. a screenshot taken in the same browser
- Image assets in the MP4 look pixelated even though the site looks crisp in DevTools
- The MP4's stored resolution doesn't match what Vinit configured (e.g. configured 1920×1080, file is 1280×720 or 3840×2160)
- `ffprobe -show_streams` shows non-square pixel aspect ratio

**Prevention strategy:**
- Pick **one** authoritative target: 1920×1080 @ deviceScaleFactor 1, OR 1920×1080 @ deviceScaleFactor 2 with downscale to 1920×1080 in ffmpeg using a high-quality scaler (`-vf scale=1920:1080:flags=lanczos`).
- The pragmatic default for YouTube 1080p B-roll: viewport `{ width: 1920, height: 1080 }`, `deviceScaleFactor: 1`. This guarantees @1x assets are loaded and captured. Trade-off: text may look slightly less crisp than @2x downscaled, but it's deterministic and matches the final delivery surface (YouTube re-encodes everything anyway).
- For text-heavy shots, capture at 2x and downscale: viewport 1920×1080, `deviceScaleFactor: 2`, capture at 3840×2160, encode with lanczos downscale. This produces visibly sharper text on a Retina playback monitor.
- Hard-code the resolution in the shot config; do not rely on Playwright device presets, which silently disagree with each other across versions.
- ffprobe the output and assert resolution + 1:1 SAR in the post-render check.

**Phase to address:** Phase 1 (recorder API: explicit resolution + DPR settings, no presets); Phase 2 (output validation step).

**Verification:** Render hellotars.com shot, ffprobe `width=1920 height=1080 sample_aspect_ratio=1:1`, visual review of text crispness on Vinit's Retina monitor.

---

### Pitfall 7: Cookie banners / unscripted popups occlude the shot

**What goes wrong:**
hellotars.com may serve a GDPR cookie banner to traffic from EU IPs but not US IPs. CI runs from a US data center, Vinit runs locally from India — different banners appear in different runs. The first time a banner is filmed in the production shot is when it appears on Vinit's first screen-share. Worse: the banner overlaps the chat widget, the script clicks it instead of the widget, and the recording is unusable.

**Why it happens:**
- Geo-targeted consent UI is invisible on first development, and only appears in the field
- A/B tests rotate banner variants; what worked yesterday breaks today
- "First-visit only" banners disappear after one run on Vinit's machine, hiding the bug from him while breaking it for fresh contexts

**Warning signs:**
- First run of the day looks different from subsequent runs (cookie / localStorage caching)
- Click target lands on the wrong element
- Recording shows an unexpected banner across the bottom

**Prevention strategy:**
- Always launch a fresh `browserContext` (no `storageState`) per recording, so what Vinit sees in dev matches what gets captured. This is more important for B-roll than for tests.
- Build a centralized `dismissOverlays()` helper invoked after `page.goto()` and before any other interaction. It probes a curated list of known banner patterns (cookie, GDPR, "subscribe to newsletter", live-chat agent prompts) and dismisses any that appear. Each pattern is a `page.locator(...).click({ trial: false }).catch(() => {})` — soft fail per pattern.
- For hellotars.com specifically: pre-set the cookie consent value via `context.addCookies([...])` *before* navigating, so the banner never appears. This is the most reliable approach. The cookie names/values must be documented in `.planning/research/shots/hellotars-com/`.
- Pin geolocation and timezone via Playwright context options so EU/US/IN behavior differences are reproducible.

**Phase to address:** Phase 2 (overlay-dismiss helper as a built-in shot-script primitive).

**Verification:** Run the hellotars shot from a fresh `~/.cache/playwright` (or equivalent) — banner-free output should be reproducible.

---

### Pitfall 8: ffmpeg version drift / not installed

**What goes wrong:**
Vinit's Mac may have ffmpeg from Homebrew (one version), the repo's CI runner has a different version (Ubuntu apt provides ancient ffmpeg), and a teammate cloning the repo in 6 months has none. The capture script silently writes a corrupt MP4, or fails with a cryptic "Unrecognized option '-movflags'" error from a 2018-era ffmpeg.

**Why it happens:**
ffmpeg is a system-level dependency, not an npm package. Versions across distros vary by years. Codec support (H.264, libx264) requires the *non-free* build on some distros. On macOS, `ffmpeg` may not even be installed by default.

**Warning signs:**
- Output MP4 has zero duration but non-zero size
- Cryptic ffmpeg errors mentioning "encoder not found" or unknown options
- "ffmpeg: command not found" on a fresh clone

**Prevention strategy:**
- Use `@ffmpeg-installer/ffmpeg` or `ffmpeg-static` npm package — bundles a known-good static ffmpeg binary per platform. This is what `webreel` does (downloads & caches under `~/.webreel`). Removes the system-dependency footgun entirely.
- Pin a minimum version and assert it at startup: `ffmpeg -version` → parse → bail with a clear error if < 6.0.
- Document the chosen approach in the module README so future-Vinit and any contributor knows where ffmpeg comes from.

**Phase to address:** Phase 1 (dependency choice for capture pipeline). This is a small thing that tanks reliability if missed.

**Verification:** `pnpm browser-capture:hellotars` runs to completion on a Mac with no system ffmpeg installed.

---

### Pitfall 9: Anti-bot detection mid-shot

**What goes wrong:**
hellotars.com itself probably doesn't have aggressive bot protection (it's Tars's marketing site; it wants traffic), but: (a) Cloudflare's "Under Attack Mode" can be turned on by ops without coordinating with Vinit; (b) the chat widget's backend may detect the Playwright user agent and refuse to render the conversation; (c) future shots against other sites (competitors, third parties) will absolutely hit Cloudflare/reCAPTCHA. Recording a Cloudflare interstitial is not the B-roll Vinit wanted.

**Why it happens:**
Default Playwright/Puppeteer user agents include identifiers like "HeadlessChrome". CDP exposes `navigator.webdriver === true`. Bot detectors fingerprint these.

**Warning signs:**
- Recording shows a Cloudflare challenge page instead of the site
- Chat widget never loads or shows a generic error
- HTTP 403 / 429 visible in network log
- Different content captured than what appears in a normal Chrome window

**Prevention strategy:**
- For hellotars.com (Vinit's own employer's site): not a concern in v1.
- Architecturally allow swapping in `playwright-extra` + `puppeteer-extra-plugin-stealth` (or `rebrowser-playwright`) for shots that need it. Don't bake it in for v1, but don't make it impossible to add either.
- Use `headless: 'new'` (the new Chromium headless) which is closer to headful behavior than the legacy headless. In macOS, headful is fine — Vinit has a Mac, not a server farm.
- Override the user agent to a real desktop Chrome string per shot config.
- Document this as a "if a future shot fails this way, reach for stealth" note rather than a v1 blocker.

**Phase to address:** Phase 2 — only if v1 hits this; otherwise document as known future risk and move on.

**Verification:** v1 hellotars shot runs in default headful Chromium and captures the real site.

---

### Pitfall 10: Auto-playing media interferes with capture

**What goes wrong:**
If hellotars.com's hero or any future shot's site has an auto-playing video, three things go wrong: (a) audio plays during a silent capture, polluting any future v2 sound-FX work; (b) video decoding contends with the screencast loop for CPU, dropping frames; (c) the auto-play video's first frame is unpredictable and may differ between runs, making the capture non-reproducible.

**Why it happens:**
HTML5 video auto-plays in most modern browsers when muted; many marketing sites use it for hero animations. Headless Chromium is not always honest about media playback policies.

**Warning signs:**
- CPU spike right after `page.goto()` even before recording starts
- Different first-frame in different runs
- Audio in the captured WebM/MP4 from an unexpected source

**Prevention strategy:**
- Launch context with `--autoplay-policy=user-gesture-required` Chromium flag for any shot where auto-play media is undesired. Add as default for v1.
- Run a `page.evaluate(() => { document.querySelectorAll('video,audio').forEach(v => { v.pause(); v.muted = true; }); })` after navigation as belt-and-suspenders.
- Mute the browser context entirely (`--mute-audio`) since v1 outputs no audio anyway.

**Phase to address:** Phase 1 (recorder defaults).

**Verification:** ffprobe the v01 output — no audio stream should be present in v1.

---

## Moderate Pitfalls

These are real but lower-impact than the critical ones. They cause iteration friction, not shot-failure.

### Pitfall 11: WebM → MP4 conversion loses duration metadata

**What goes wrong:**
If the capture pipeline writes WebM first (Chromium's native VP8/VP9 output) and converts to MP4 in a second pass, ffmpeg may lose duration metadata or timecode. The MP4 plays correctly but reports 00:00 duration in editors / YouTube's preview, breaking thumbnail picking and chapter markers.

**Prevention:** Skip the intermediate WebM entirely — encode straight to MP4 from the screenshot stream as `webreel` and `puppeteer-screen-recorder` do. If WebM is unavoidable, use `ffmpeg -i in.webm -map_metadata 0 -movflags +faststart -c:v libx264 -crf 18 out.mp4` and assert `ffprobe -show_entries format=duration` matches expected post-encode.

**Phase to address:** Phase 1 (encode pipeline architecture).

---

### Pitfall 12: File size explosion on long recordings

**What goes wrong:**
Naïve PNG-frame-loop capture writes ~100KB/frame × 60fps × 60s = 360 MB of intermediate frames per minute. Disk fills mid-recording; the script crashes with EIO.

**Prevention:** Pipe screenshots directly to ffmpeg stdin as a stream — never write per-frame PNGs to disk. ffmpeg encodes on the fly; intermediate is bytes in memory, not files. `webreel` does this; copy the pattern. For genuinely long recordings, split into N-second chunks and concat with `ffmpeg -f concat`.

**Phase to address:** Phase 1.

---

### Pitfall 13: Color profile shift between Chromium and final MP4

**What goes wrong:**
Chromium tags screenshots with the display's color profile (Display P3 on Vinit's Mac). ffmpeg may strip or misinterpret the tag, encoding a video that displays slightly desaturated on YouTube vs. the live site.

**Prevention:** Force Chrome to use sRGB explicitly: launch with `--force-color-profile=srgb`. Encode MP4 with `-pix_fmt yuv420p` and tag with rec.709 color primaries: `-color_primaries bt709 -color_trc bt709 -colorspace bt709`. This is the YouTube-canonical color space; matches what YouTube expects on upload and prevents the "Chromium gamma shift" issue documented in YouTube/Chrome forums.

**Phase to address:** Phase 1 (encoder config) + Phase 2 (verification with a known-color test card shot).

---

### Pitfall 14: Hot-reload / studio dev server collision

**What goes wrong:**
`pnpm studio` (Remotion preview) opens a Chromium window. If `pnpm browser-capture` is run in parallel, both compete for ports, focus, or CPU. On macOS, focus-stealing breaks any headful capture.

**Prevention:** browser-capture launches its own browser context with explicit ports (`--remote-debugging-port=0` for ephemeral) and headless mode by default. Document in the README that headful capture should not be run concurrently with `pnpm studio`.

**Phase to address:** Phase 1 (default to headless), Phase 2 (README note).

---

### Pitfall 15: Time-of-day / locale dependencies

**What goes wrong:**
Hellotars.com may show different greetings ("Good morning"), different hero copy on weekends, or different chat-agent availability. The committed shot reproduces differently at different times.

**Prevention:** Pin `context.setLocale('en-US')`, `context.setTimezone('America/New_York')`, and (if hostility-tolerant) override `Date.now()` via `page.addInitScript()` to a fixed wall-clock for shots where time-display matters. For most shots this is overkill; document as an opt-in.

**Phase to address:** Phase 2 — opt-in shot config.

---

### Pitfall 16: Permission prompts on macOS

**What goes wrong:**
First time Vinit runs the tool, macOS may pop a "Chrome wants to record your screen" dialog (TCC). The dialog is *itself* captured in the MP4, and clicking through it on the first run differs from subsequent runs — non-reproducible.

**Prevention:** Headless Chromium does not trigger TCC screen-recording prompts because it uses CDP `Page.captureScreenshot`, not OS-level capture. Default to headless for v1; this sidesteps TCC entirely. If headful is needed later, document the one-time TCC grant in the README so Vinit grants it before the first real shot.

**Phase to address:** Phase 1 (default headless), README.

---

## Agent-Mode Pitfalls

These apply only to the agent mode (LLM-driven runtime planning). They do NOT apply to committed deterministic scripts — which is intentionally why the hybrid model exists.

### Pitfall 17: Hallucinated selectors

**What goes wrong:** LLM proposes `page.locator('.chat-widget-launcher')` because that *sounds* right. Element doesn't exist. Action fails or, worse, matches an unintended element.

**Prevention:**
- Feed the LLM an *accessibility snapshot* (`page.accessibility.snapshot()` or Playwright's `aria-snapshot()`), not raw DOM and not a screenshot. This is the lesson `agent-browser` learned: structured semantic tree beats screenshots-with-pixel-coordinates by a wide margin.
- Constrain the action surface: provide a tool API (`click(role, name)`, `type(role, name, text)`) instead of letting the LLM emit raw selectors.
- After every action, re-snapshot and verify the expected post-condition before proceeding.

**Phase to address:** Phase 3 (agent mode) — defer if Phase 1+2 deliver the hellotars.com shot reliably; agent mode is for *exploratory* captures only.

---

### Pitfall 18: Non-determinism across runs

**What goes wrong:** Same NL prompt → different action sequence on each run → recordings of different lengths and content. Cannot ship.

**Prevention:** Agent mode is for *generating* a script, not for shipping a recording directly. Once a satisfying capture is produced, the agent dumps the actual action trace as a deterministic shot script and that committed script is what re-runs. Treat agent mode as "scaffold a script for me," not "record my B-roll."

**Phase to address:** Phase 3 (architectural — agent emits a serialized script as a side effect of every successful run).

---

### Pitfall 19: Cost runaway from chained tool calls

**What goes wrong:** LLM gets stuck retrying failed clicks; tokens balloon; bill arrives.

**Prevention:** Hard caps on (a) total LLM calls per shot, (b) total tokens, (c) wall-clock time. On exceeding any cap, abort with the partial transcript saved. Use a small/cheap model (Haiku-class) for routine "what do I click next" loops; reserve large model for plan-revision only.

**Phase to address:** Phase 3.

---

### Pitfall 20: Action-vs-observation lag (acting on stale snapshot)

**What goes wrong:** LLM observes snapshot at T0, decides action, by T1 (after 800ms of LLM latency) the page has changed (animation completed, new content loaded). LLM acts on stale state.

**Prevention:** Re-snapshot immediately before executing each action. If the snapshot has materially changed, re-plan. This is a 5-line guard but prevents 80% of agent-mode brittleness.

**Phase to address:** Phase 3.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Use Playwright's built-in `recordVideo` for v1 | Two lines of code, ships today | Quality is below YouTube-acceptable; will need rebuild | Never for shipped B-roll. OK for debugging the script itself. |
| Hard-code hellotars.com selectors inline in module code | Ship the demo | Selector brittleness leaks into core; can't add a second shot without refactor | Never — push selectors into per-shot config from day one. |
| Skip the pre-flight assertion phase ("the script worked yesterday") | Faster iteration | Silent failures produce 0-byte MP4s; Vinit notices days later | Only if every shot is followed by a manual visual review (which is the v1 reality) |
| Single-pass capture with no separate cursor compositing | Simpler architecture | Can't iterate on cursor styling without re-running browser; v2 polish requires rewrite | Never — split record/composite into two passes from v1, even if v1's compositor is a no-op |
| Use system ffmpeg | One less dependency | Breaks on fresh clone, breaks in CI, version skew | Only if the README is loud and a startup version-check exits clearly when ffmpeg is missing/old |
| Skip headless and demand headful | Cursor "just works" via OS pointer (no it doesn't, see Pitfall 2) | Can't run in CI; macOS TCC prompts; focus-stealing | Never — the cursor problem is solved by compositing, not by going headful |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| ffmpeg | Assume system install present | Bundle via `ffmpeg-static` or `@ffmpeg-installer/ffmpeg`; assert version on start |
| Chromium / Playwright | Use device presets like "Desktop Chrome HiDPI" | Set viewport, deviceScaleFactor, userAgent explicitly; presets disagree across versions (issue #36628 family) |
| hellotars.com chat widget | Top-frame DOM selector | `frameLocator()` with role-based inner selector; document widget DOM shape per shot |
| Cookie banners | Click them at runtime | Pre-seed consent cookies via `context.addCookies()` before `goto()` |
| Color/gamma | Use Chromium's default color management | `--force-color-profile=srgb`; encode with bt709 primaries to match YouTube |
| Auto-play media | Hope it doesn't play | `--autoplay-policy=user-gesture-required` + `--mute-audio` + post-load `pause()` |
| `pnpm studio` (Remotion) | Run capture in parallel | Default capture to headless; document the conflict in README |
| LLM API keys (agent mode) | `.env` not enforced | Mirror existing repo convention (CONCERNS.md §Security): no keys in source; `.env` excluded; pre-commit secret scan |

---

## Performance Traps

For a personal-channel B-roll tool, "scale" means "how long is the shot" and "how many shots are queued." Not 10k users. Scoped accordingly.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| PNG frames written to disk between capture and encode | Disk fills, EIO, tmp full | Pipe screenshots → ffmpeg stdin (stream) | At ~60s @ 60fps |
| Single-context for many shots in one process | Memory leak (Playwright #15400, #6319) | New context per shot; close explicitly; consider new process per shot | At 10+ shots in one run |
| `recordVideo` retained after shot completes | Disk fills with stale traces (#38433) | Delete intermediate artifacts in `finally`; never use `retain-on-failure` style for B-roll | Any long capture |
| CDP screencast at 60fps with everyNthFrame=1 | Throttled; frames drop; CPU pegged | Use screenshot-loop pattern, not CDP screencast, for high-fps capture | Always — CDP screencast caps ~30fps regardless |
| Encoding on the same machine as the capture during the capture | CPU contention causes capture frame drops | Use ffmpeg `-preset slow` only on the *post-process* pass; capture pass uses `-preset ultrafast` to a temp file, then re-encode | Long shots (>30s) on a busy laptop |

---

## Security Mistakes

Mostly low-risk for a personal-channel tool, but worth flagging because the existing CONCERNS.md sets a clean security posture for the repo and we should preserve it.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Commit a `storageState.json` containing live auth cookies for a logged-in shot | Session token in git; account compromise | `.gitignore` `*.storage-state.json` from day one; if a shot needs auth, load from `.env` at runtime |
| Hardcode LLM API key for agent mode | Key leak | Mirror existing repo pattern (no secrets in source per CONCERNS.md); `.env` only; pre-commit hook (already on the docket per CONCERNS.md §Security) catches |
| Capture sites with sensitive data visible (internal dashboards, customer data) | PII in MP4 → YouTube | Per-shot opt-in flag `containsSensitive: false` is required to be set; tool refuses to record domains on a denylist (`*.internal.tars.io` etc.) |
| Run agent mode with no domain allowlist | LLM navigates to arbitrary URLs based on prompt; cost / safety surprises | Per-shot allowlist of navigable hostnames; agent cannot leave them |

---

## UX Pitfalls

"UX" for this tool means *Vinit's* developer experience using it — not end-user UX of a SaaS product.

| Pitfall | Impact on Vinit | Better Approach |
|---------|-----------------|-----------------|
| Silent failure (script "works", produces 5-byte MP4) | Wastes Vinit's time; he discovers it during edit | Mandatory post-render validation: ffprobe output meets duration/resolution/codec spec; fail loudly if not |
| Output filenames overwrite previous good takes | Lost work; "did I save v01 or did this overwrite it?" | Auto-increment v01 → v02 → v03 like the existing Remotion `out/` convention; never overwrite |
| Long capture, no progress indication | Vinit doesn't know if it hung or is working | Stream `[T+12.4s / 30s] frame 372` to stderr |
| Error messages reference Playwright internals | "Locator strict mode violation: 2 elements" — opaque | Wrap errors with shot-script context: "Pre-flight failed: chat widget selector matched 2 elements; expected 1. See .planning/research/shots/hellotars-com/dom-notes.md" |
| Recording requires multi-step manual setup (`pnpm install`, install ffmpeg, grant permission) | Hard to re-onboard after a 6-month gap | One-command `pnpm browser-capture:hellotars` does everything; ffmpeg bundled; headless avoids permission |

---

## "Looks Done But Isn't" Checklist

Use this as the v1 acceptance gate. Each item has bitten projects in this domain.

- [ ] **Cursor visible:** Inspect every click frame — pointer must be there *before* the click and persist briefly *after*. Easy to ship without it because the script "succeeds."
- [ ] **Entry animation full:** Chat widget bounce-in is captured in full (not cut off, not pre-completed). Re-record 5 times to verify.
- [ ] **No occluders:** No cookie banner, no GDPR popup, no chat-agent prompt visible in any frame of v01. Run from fresh context to confirm.
- [ ] **Resolution matches config:** `ffprobe v01.mp4` reports the configured width × height with 1:1 SAR. Soft text means scale-factor mismatch — investigate before shipping.
- [ ] **Constant frame rate:** `ffprobe -show_streams` reports `r_frame_rate=30/1` (or 60/1) and `avg_frame_rate` matches. VFR will desync in any future audio mix.
- [ ] **Color space tagged:** `ffprobe` reports `color_primaries=bt709 color_transfer=bt709 color_space=bt709`. Untagged = unpredictable on YouTube.
- [ ] **Faststart enabled:** `ffprobe` shows the `moov` atom at the start of the file (or use `mediainfo`). Without this, scrubbing in editors is sluggish.
- [ ] **Pre-flight assertions present:** Every shot script has a `preflight` block that runs all key selectors before `recorder.start()`. A missing element produces a clear error, not a half-recording.
- [ ] **Reproducible:** Run the same shot 3 times in a row → 3 visually-equivalent MP4s. If they differ, find the source of nondeterminism (geo, time, network) before shipping.
- [ ] **Output path follows convention:** `out/browser-capture/<session-name>/v01.mp4` matches existing Remotion `out/` pattern. Don't invent a new one.
- [ ] **No leaked artifacts:** No PNG frames left in `tmp/`, no `~/.cache/playwright/traces/` growth, no orphaned Chromium processes (`pgrep -f Chromium`).
- [ ] **Module is reusable:** A second shot can be added by writing a new shot config + script *without touching the module's source*. PROJECT.md "Active" list explicitly requires this.

---

## Recovery Strategies

When despite prevention, things go wrong on a shot day.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cursor missing in v01 | LOW | The cursor compositing pass (Pitfall 2) consumes the InteractionTimeline + raw video. Re-run *only* the composite pass; no need to re-run the browser. This is exactly why webreel's two-pass model exists. |
| Selector broke (site change) | MEDIUM | Use Playwright's codegen (`pnpm exec playwright codegen hellotars.com`) to regenerate selectors interactively; update shot config; re-run. ~10 min. |
| Cookie banner appeared mid-shot | LOW | Add the banner pattern to `dismissOverlays()`; clear `~/.playwright-cache`; re-run. |
| Wrong resolution / soft text | LOW | Update shot config DPR/viewport; re-run capture (cheap). Don't try to fix in post — re-capture. |
| ffmpeg version too old on Vinit's mac | LOW | If using `ffmpeg-static`: should never happen. If using system ffmpeg: `brew upgrade ffmpeg`. |
| Agent mode hallucinated and burned tokens | MEDIUM | The cost cap (Pitfall 19) terminated it. Inspect the partial transcript, identify the failing step, write a deterministic script for the remaining steps. |
| Half-recording (script crashed mid-flow) | LOW (if pre-flight is in place) → HIGH (if not) | Pre-flight catches most. If a runtime crash still happens, add the failure point to pre-flight; re-run. |
| Final MP4 looks great in QuickTime, looks wrong on YouTube | MEDIUM | Color tagging or pixel format is wrong. Re-encode with explicit bt709 + yuv420p. Verify with a YouTube unlisted upload before publishing. |

---

## Pitfall-to-Phase Mapping

This is the table the roadmap uses to assign verifications.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Built-in recordVideo not video-grade | Phase 1 (capture pipeline architecture) | ffprobe: 30 fps CFR, H.264, yuv420p, CRF≤20 |
| 2. Cursor invisible / teleports | Phase 1 (timeline) + Phase 2 (compositor) | Manual visual review of every click frame |
| 3. Choppy frames during page load | Phase 1 (recorder lifecycle) + Phase 2 (waitForReady) | Repeat hellotars shot 5×; entry animation full each time |
| 4. Selector flake against live site | Phase 2 (shot-script schema with pre-flight) | Deliberately break a selector; tool aborts cleanly |
| 5. Iframe / shadow-DOM blindness | Phase 0 (research spike) + Phase 2 (frameLocator-first API) | First green hellotars run |
| 6. HiDPI / scale-factor mismatch | Phase 1 (explicit res+DPR) + Phase 2 (output validation) | ffprobe SAR=1:1; visual text crispness on Retina |
| 7. Cookie banners / popups | Phase 2 (dismissOverlays helper, cookie pre-seed) | Run from fresh context; no banner in output |
| 8. ffmpeg version drift / not installed | Phase 1 (bundled ffmpeg) | Run on Mac with no system ffmpeg |
| 9. Anti-bot detection | Phase 2 (only if hit; else document) | hellotars v1 captures real site, not Cloudflare page |
| 10. Auto-playing media | Phase 1 (default flags) | ffprobe: no audio stream in v01 |
| 11. WebM→MP4 metadata loss | Phase 1 (encode straight to MP4) | ffprobe duration matches expected |
| 12. File size / disk exhaustion | Phase 1 (stream pipeline) | 60s capture leaves < 50MB on disk total |
| 13. Color profile shift | Phase 1 (encoder config) + Phase 2 (test card shot) | Color test card matches reference |
| 14. Studio dev server collision | Phase 1 (default headless) + README | Document; not auto-tested |
| 15. Time/locale dependencies | Phase 2 (opt-in shot config) | Run hellotars at 3am and 3pm; visually equivalent |
| 16. macOS permission prompts | Phase 1 (default headless) | First run on a fresh Mac succeeds without prompts |
| 17. Hallucinated selectors (agent) | Phase 3 (a11y snapshot, constrained tools) | Agent run produces correct click on hellotars 9/10 times |
| 18. Agent non-determinism | Phase 3 (emit deterministic script) | Re-run emitted script 3× → identical output |
| 19. Agent cost runaway | Phase 3 (hard caps) | Stress test: prompt agent with impossible task; aborts at cap |
| 20. Stale-snapshot lag | Phase 3 (re-snapshot before action) | Verified by 17's success rate |

---

## Sources

- Playwright video recording quality issues — choppy frames and unstable FPS:
  - [GitHub Issue #35776: Unstable video frame rate due to accumulated timestamp errors](https://github.com/microsoft/playwright/issues/35776)
  - [GitHub Issue #8683: Tuning video performance](https://github.com/microsoft/playwright/issues/8683)
  - [GitHub Issue #10855: Better video quality](https://github.com/microsoft/playwright/issues/10855)
  - [GitHub Issue #12056: Configure video quality](https://github.com/microsoft/playwright/issues/12056)
  - [GitHub Issue #11103: Video recordings longer than test execution](https://github.com/microsoft/playwright/issues/11103)
  - [GitHub Issue #36685: webkit@docker video recording regression in 1.54.x](https://github.com/microsoft/playwright/issues/36685)
- Cursor visibility in headless capture and the screenshot-loop pattern:
  - [Puppeteer Issue #374: show cursor on headless: false](https://github.com/puppeteer/puppeteer/issues/374)
  - [Browserless: How to Create High Quality Puppeteer Screencasts With Audio](https://www.browserless.io/blog/puppeteer-screencasts)
  - [Screenshotone: Puppeteer Record Video — page.screencast() vs puppeteer-screen-recorder](https://screenshotone.com/blog/how-to-record-videos-with-puppeteer/)
  - [puppeteer-screen-recorder on npm](https://www.npmjs.com/package/puppeteer-screen-recorder)
- Webreel architecture (two-pass capture + composite pattern):
  - [vercel-labs/webreel on GitHub](https://github.com/vercel-labs/webreel)
  - [DeepWiki: vercel-labs/webreel](https://deepwiki.com/vercel-labs/webreel)
  - [Vibe Sparking AI: WebReel — Stop Re-Recording Your Demo Videos](https://www.vibesparking.com/en/blog/awesome-tools/2026-03-04-vercel-webreel-scripted-browser-demo-videos/)
- CDP screencast frame rate ceiling and screencastFrameAck:
  - [Chromium Issue 40934921: Page.screencastFrame causes huge…](https://issues.chromium.org/issues/40934921)
  - [Chromium: Auto-Throttled Screen Capture and Mirroring design doc](https://www.chromium.org/developers/design-documents/auto-throttled-screen-capture-and-mirroring/)
  - [Browserless Issue #214: /screencast low frame rate](https://github.com/browserless/chrome/issues/214)
  - [Anchen Li: How to do video recording on headless chrome](https://medium.com/@anchen.li/how-to-do-video-recording-on-headless-chrome-966e10b1221)
- Iframes & shadow DOM in Playwright:
  - [Automate The Planet: Playwright IFrame and Shadow DOM Automation](https://www.automatetheplanet.com/playwright-tutorial-iframe-and-shadow-dom-automation/)
  - [Playwright Issue #1375: Native shadow DOM support](https://github.com/microsoft/playwright/issues/1375)
  - [Playwright Issue #23047: Allow forcing open closed shadow DOM roots](https://github.com/microsoft/playwright/issues/23047)
  - [Helpshift Engineering: Playwright's Playbook — Conquering ShadowDOM Elements](https://medium.com/helpshift-engineering/playwrights-playbook-conquering-shadowdom-elements-with-ease-35b65bfb8008)
- Cookie banners / popup reliability:
  - [Playwright Issue #3107: How to remove cookie EU law popup](https://github.com/microsoft/playwright/issues/3107)
  - [Scrapfly: How to click on cookie popups in Playwright](https://scrapfly.io/blog/answers/how-to-click-on-modal-alerts-like-cookie-pop-up-in-playwright)
  - [Testleaf: Playwright Pop-Up Handling — 7 Recipes + AI Debugging](https://www.testleaf.com/blog/playwright-ai-assisted-pop-up-handling-recipes/)
- HiDPI / deviceScaleFactor:
  - [Playwright Issue #36628: deviceScaleFactor doesn't work with firefox (deviceScaleFactor edge cases)](https://github.com/microsoft/playwright/issues/36628)
  - [WebScraping.AI: How do I configure viewport size and resolution in Headless Chromium?](https://webscraping.ai/faq/headless-chromium/how-do-i-configure-viewport-size-and-resolution-in-headless-chromium)
  - [vercel-labs/agent-browser Issue #255: deviceScaleFactor not applied](https://github.com/vercel-labs/agent-browser/issues/255)
- Disk space / memory under long recording:
  - [Playwright Issue #38433: Traces not cleaned up; disk space issues](https://github.com/microsoft/playwright/issues/38433)
  - [Playwright Issue #15400: Memory leak suspicion](https://github.com/microsoft/playwright/issues/15400)
  - [Playwright Issue #6319: Memory increases when same context is used](https://github.com/microsoft/playwright/issues/6319)
- ffmpeg WebM → MP4 conversion and color tagging:
  - [OTTVerse: Converting WebM to MP4 with FFmpeg](https://ottverse.com/convert-webm-to-mp4-with-ffmpeg/)
  - [Shotstack: How to convert WebM to MP4 with FFmpeg](https://shotstack.io/learn/webm-to-mp4/)
  - [Blackmagic Forum: Fixing Gamma Shifts When Delivering to Web (YouTube)](https://forum.blackmagicdesign.com/viewtopic.php?f=21&t=151863)
  - [Oliver Norred: Force sRGB color profile on Chrome](https://olivernorred.com/blog/life-tip-force-srgb-color-profile-on-chrome/)
- LLM browser-agent reliability:
  - [Browser-Use Issue #2264: Screenshot Error](https://github.com/browser-use/browser-use/issues/2264)
  - [vercel-labs/agent-browser repo and changelog](https://github.com/vercel-labs/agent-browser)
  - [Anything-LLM Issue #2208: Agent webscraping hallucinating](https://github.com/Mintplex-Labs/anything-llm/issues/2208)
  - [Fireworks AI: Building an open-source Browser Agent](https://fireworks.ai/blog/opensource-browser-agent)
- Wait strategies (page load):
  - [BrowserStack: Understanding Playwright waitForLoadState](https://www.browserstack.com/guide/playwright-waitforloadstate)
  - [BrowserStack: Understanding Puppeteer waitUntil](https://www.browserstack.com/guide/puppeteer-waituntil)
- prefers-reduced-motion handling:
  - [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- macOS TCC and screen recording permissions:
  - [Apple Support: Control access to screen and system audio recording on Mac](https://support.apple.com/guide/mac-help/control-access-screen-system-audio-recording-mchld6aa7d23/mac)
  - [DataJAR: Understanding Privacy Preference Policy Controls in macOS](https://datajar.co.uk/understanding-privacy-preference-policy-controls/)
- Existing repo conventions referenced:
  - `/Users/vinit/Tars/Content-Creation/content-studio/.planning/PROJECT.md` (milestone scope: reliability > speed; hellotars.com first shot)
  - `/Users/vinit/Tars/Content-Creation/content-studio/.planning/codebase/CONCERNS.md` (security posture, output-path conventions, the brownfield style this document mirrors)

---
*Pitfalls research for: tools/browser-capture/ — first version, hellotars.com reference shot*
*Researched: 2026-04-21*

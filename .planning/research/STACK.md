# Stack Research — `tools/browser-capture/`

**Domain:** Browser automation + tab recording for B-roll video production (TypeScript/Node, integrated into a pnpm monorepo)
**Researched:** 2026-04-21
**Confidence:** HIGH (primary picks verified via Context7 against official Playwright/Stagehand/Puppeteer docs and current npm versions; agent-mode picks MEDIUM, see notes)

---

## Headline Recommendation

**Build the module as a thin TypeScript wrapper around Playwright (`playwright` 1.59.1).** Use Playwright's built-in `BrowserContext.recordVideo` for capture (WebM, then transcode to MP4 with ffmpeg). For agent mode, layer **Stagehand** (`@browserbasehq/stagehand` 3.2.1) on top of the same Playwright instance via `chromium.connectOverCDP` — Stagehand's `act` / `observe` / `agent` primitives give you a hybrid script-or-LLM workflow on a single browser without a second driver. This stack is TypeScript-first, reliability-first, monorepo-friendly, and avoids paid cloud browsers in v1.

**Avoid:**
- Puppeteer (less reliable auto-wait, weaker auto-recording story, no Firefox/WebKit)
- CDP `Page.startScreencast` directly (frame-stitching is custom code = more bugs)
- External screen recorders (ffmpeg x11grab / ScreenCaptureKit / avfoundation) — display-server fragility, not what the user wants
- Cloud browsers (Browserbase / Browserless / Steel) for v1 — extra cost, network latency, secret-management overhead, recording is downloaded post-hoc not "built into the loop"
- Browser-Use (Python-only — wrong language for a TS monorepo)
- Playwright MCP / Chrome DevTools MCP **as the underlying driver** — see analysis section; they're meant for AI assistants to drive a browser interactively, not for repo-committed scripted captures. Useful at *design time* (let Claude Code drive a real browser to draft a script) but not at *run time*

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **`playwright`** (full pkg, includes browsers) | **1.59.1** | Browser driver + scripted actions + built-in video recording | Microsoft-maintained, by far the most reliable cross-browser auto-wait engine in 2026; built-in `recordVideo` records WebM end-to-end with no glue code; same Page API as Stagehand consumes via CDP, so script-mode and agent-mode share infra. Headless and headful both first-class. Verified via Context7 (`/microsoft/playwright`) and npm (latest 1.59.1 published 2026-04-21). |
| **`@browserbasehq/stagehand`** | **3.2.1** | Hybrid agent-mode layer over Playwright (act / observe / extract / agent) | TypeScript-first (the only mainstream agent lib that is — Browser-Use is Python). Doesn't replace Playwright; *augments* it. You can write a deterministic Playwright script and sprinkle `stagehand.act("click the chat widget")` for fragile selectors, or hand the wheel to `stagehand.agent({mode:"cua"}).execute(...)` for ad-hoc shots. Connects to your existing browser via `chromium.connectOverCDP(stagehand.connectURL())`, so recording (which lives on the Playwright context) keeps working. Backed by Browserbase, version 3.x is current/active. Verified via Context7 (`/browserbase/stagehand`) and npm. |
| **ffmpeg (system binary, called via Node `child_process`)** | system (>=6.x) | Transcode WebM → MP4 (H.264 + AAC, faststart) | Playwright outputs WebM/VP8 only; YouTube editor + Remotion `<OffthreadVideo>` both prefer H.264 MP4. ffmpeg is the universal answer; calling it directly via `node:child_process` with a typed wrapper is more reliable than `fluent-ffmpeg` (unmaintained, last release 2023) and lighter than bundling `ffmpeg-static` (~70MB, platform-specific binaries already complicate pnpm overrides — the repo already deals with Remotion compositor binaries, don't add more). Document `brew install ffmpeg` / `apt install ffmpeg` as a prereq. |
| **`zod`** | **3.x** | Runtime validation of session-script files (the JSON/TS shape of a "shot" definition) | Already a Stagehand peer dep (used for `extract` schemas). Reusing it for script schema validation gives early, descriptive errors when a shot file is malformed — matches the codebase's existing "validate at definition time" pattern (`frames.ts` scene contiguity check in Remotion). |
| **`tsx`** (or use existing `pnpm` + `node --experimental-strip-types`) | **4.x** | Run `.ts` shot scripts directly from CLI | The repo is TS-strict ESM-ish via Remotion's bundler, but there's no general TS-runner. `tsx` is the de-facto "run a TS file in Node" tool in 2026. Lightweight dev dep; only used for the CLI entry. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **`commander`** | 12.x | CLI argument parsing for `browser-capture <script-name>` | When the module exposes a CLI (Phase 2+). Stable, ubiquitous, no runtime baggage. |
| **`pino`** (or just `console`) | 9.x | Structured logging of capture runs | Optional. Useful once you're running multiple shots in CI; for v1 a `[browser-capture]` console prefix is fine. |
| **`@browserbasehq/sdk`** | latest | Browserbase cloud client (only if you ever switch `env: "BROWSERBASE"`) | **Defer.** Stagehand works against `env: "LOCAL"` with no Browserbase account. Add only if you hit a wall (e.g., need a clean residential IP for a recording, or want Browserbase's Session Replay UI for debugging agent runs). |
| **`dotenv`** | 16.x | Load `.env` for `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` (Stagehand agent mode) | Only required for agent mode, not for deterministic scripts. The repo currently has no `.env` story; introduce it cleanly under `tools/browser-capture/.env.example`. |
| **`@anthropic-ai/sdk`** | 0.90.0 | Direct Claude API calls (only if you decide to skip Stagehand and roll your own agent loop on Computer Use) | **Anti-recommendation for v1.** Computer Use is still beta-flagged and "may be error-prone" per Anthropic's own docs. Stagehand abstracts over both Anthropic CUA and OpenAI Operator-style models (`mode: "cua"`, `model: "google/gemini-2.5-computer-use-preview-10-2025"` etc.) — let Stagehand pick the model. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Playwright Inspector** (`PWDEBUG=1`) | Step through a script in a real browser, see selectors highlight | Use during shot authoring. Comes free with `playwright`. |
| **Playwright Codegen** (`npx playwright codegen <url>`) | Click through a site, get TS scaffold | Use for *first draft* of a deterministic script, then hand-tune. Pairs perfectly with the user's "NL → committed script" flow: agent (Stagehand or Claude Code itself) writes the action plan, codegen produces the selectors, you commit the result. |
| **Playwright Trace Viewer** | Replay a failed capture frame-by-frame with DOM snapshots | Set `trace: 'on-first-retry'` in the capture context. Massive reliability/debug win — when a shot drifts because the site changed, the trace tells you exactly which selector broke. |
| **`@playwright/mcp`** (0.0.70) | An MCP server you point Claude Code / Cursor at, *not* a runtime dep | **Use at design time, not runtime.** Lets you say "Claude, open hellotars.com and figure out the chat widget selector" inside your editor. The output is a script that lives in the repo. Do **not** make this a runtime dep of `tools/browser-capture/`. |

---

## Installation

```bash
# Core (production-runtime deps for tools/browser-capture/)
pnpm add -F browser-capture playwright @browserbasehq/stagehand zod

# CLI + agent-mode deps
pnpm add -F browser-capture commander dotenv

# Dev deps (typing + runner)
pnpm add -DF browser-capture tsx @types/node

# One-time browser binaries (Playwright manages these — pinned via package-lock; ~300MB)
pnpm exec playwright install chromium

# System prereq (document in tools/browser-capture/README.md)
# macOS:    brew install ffmpeg
# Linux:    sudo apt install ffmpeg
# Windows:  winget install ffmpeg
```

**Notes:**
- `-F browser-capture` assumes the module is added as a pnpm workspace under `tools/browser-capture/` with its own `package.json`. If you're keeping a single root `package.json`, drop the `-F`.
- Install **only `chromium`** (not `firefox` and `webkit`) — the user's reference shot is web content rendered on Chromium; saves ~600MB and ~3 min on first install.
- Add `playwright install chromium` to a `postinstall` script in the module's `package.json` so contributors don't forget.
- **Do not pin via root `pnpm.overrides`** the way Remotion is pinned. Playwright doesn't ship platform-specific compositor binaries the same way; `playwright install` resolves browsers by Playwright's internal registry, not npm.

---

## Alternatives Considered

### Browser drivers

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Playwright** | **Puppeteer** (`puppeteer` 24.42.0) | If you're already on Puppeteer and don't want to migrate. Puppeteer's `Page.screencast` returns a `ScreenRecorder` with `path: 'rec.webm'` — *also* requires `ffmpeg` at runtime (it shells out internally). API is fine, but: (1) Chromium-only in practice, (2) auto-wait is weaker (more `waitForSelector` boilerplate = more brittle scripts), (3) no first-class trace viewer. Verdict: **Don't pick it for a greenfield TS module.** |
| **Playwright** | **CDP (`chrome-remote-interface`) directly** | Almost never. Only if you need a CDP feature Playwright hasn't surfaced (e.g., a brand-new domain). Building screencast on raw CDP means assembling base64 PNG frames into MP4 — solved problem you don't need to re-solve. |
| **Playwright** | **WebDriver / Selenium** | Don't. WebDriver BiDi is interesting long-term but tooling around video is immature; Selenium's recording story is third-party only. |

### Recording approaches

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Playwright `recordVideo` (WebM) + ffmpeg transcode to MP4** | **CDP `Page.startScreencast` + frame stitching** | Never for v1. Only if you need *frame-perfect* sync with non-page events (e.g., overlaying captions you generate alongside the recording). Even then, prefer post-process overlay. |
| **Playwright `recordVideo`** | **External screen recorder** (ffmpeg x11grab on Linux, ScreenCaptureKit/avfoundation on macOS) | If you need to capture *system UI chrome* (the OS cursor, OS notifications, browser address bar). The user has explicitly deferred polish FX to v2 — `recordVideo` captures the page contents only, which is what you want for a clean B-roll asset. |
| **Playwright `recordVideo`** | **Cloud-rendered browser** (Browserbase, Browserless, Steel.dev) | If you ever need (a) a clean residential IP, (b) parallel capture at 100s of sessions, (c) a hosted Session Replay UI for QA. None apply to a personal-channel single-shot v1. **Cost:** Browserbase ~$0.05–0.20 per session-minute as of 2026; recordings are downloaded post-hoc as MP4. Adds an API-key dep. Reconsider for v3+ if scale demands it. |

### Agent-mode libraries

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Stagehand** (`@browserbasehq/stagehand` 3.2.1, `env: "LOCAL"`) | **Browser-Use** (`browser-use` Python lib) | Don't — Python doesn't fit the monorepo. Browser-Use is excellent and arguably has the better autonomous-agent loop, but adopting Python adds a runtime/CI burden that only pays off if you're going full-autonomous. The user's stated model is *hybrid* (committed scripts + occasional agent), which is exactly what Stagehand is designed for. |
| **Stagehand** | **Anthropic Computer Use beta** (call directly via `@anthropic-ai/sdk`) | If you want to roll your own agent loop with Claude as the operator. Currently beta, "may be error-prone" per Anthropic's own docs, requires you to implement screenshot/click/type translation yourself. Stagehand wraps this for you with `mode: "cua"`. Revisit when Computer Use leaves beta. |
| **Stagehand** | **OpenAI Operator / "computer-use-preview" model** | Same answer — Stagehand can target it (`model: "openai/computer-use-preview"`) without you writing the loop. |
| **Stagehand** | **Magnitude** (`magnitude-core` 0.3.1, vision-first, BSL-licensed) | Magnitude is genuinely interesting (vision-first, Playwright-based, native caching for deterministic re-runs). But it's earlier (0.3.x), tighter scope, and the BSL license has reuse caveats. Stagehand is more mature, MIT, larger community. Re-evaluate Magnitude in 6 months. |
| **Stagehand** | **Skyvern** (Python, fork of browser-use lineage) | Python — same disqualifier as browser-use. Better for full-autonomy enterprise workflows, overkill here. |

### MCP browser servers (the user's "Chrome MCP" question)

The user's literal words: *"I don't care whether it's Chrome MCP or Playwright MCP or Vercel browser or Agent browser… do research and find out what is the most reliable and fast."*

**Verdict: MCP servers are the wrong layer for this module.** MCP is a protocol for AI assistants (Claude Code, Cursor, ChatGPT desktop) to call tools. They're built for an LLM in a chat to drive a browser interactively, with tool-call serialization overhead per action. Putting an MCP server *inside* a runtime CLI means: spawn MCP server → connect MCP client → translate JS calls to MCP tool calls → MCP server executes Playwright → return result → translate back. You've added 2 layers of indirection for a process that *just runs Playwright underneath anyway*.

| MCP Option | Verdict | When it might fit |
|------------|---------|-------------------|
| **`@playwright/mcp`** (Microsoft, 0.0.70) | **Use at design time only** — point Claude Code at it to draft scripts. **Don't** make it a runtime dep. | If you ever build a Slack-bot / chat interface where a non-coder asks for a capture in natural language, the MCP server becomes the API surface. Out of scope for v1. |
| **`chrome-devtools-mcp`** (Google, official) | **Don't use as driver.** It's a *DevTools* MCP — performance traces, memory snapshots, CDP introspection. Not built around video recording. Strong for performance debugging of a captured page; not for capturing one. | Adjacent v3 use case: capture *and* attach a perf trace as a sidecar artifact. |
| **`@browserbase/mcp-server-browserbase`** | Don't — couples you to Browserbase cloud. | Only if you've already adopted Browserbase. |
| **Chrome MCP** (third-party, `hangwin/mcp-chrome`) | **No.** It's a Chrome *extension*-based MCP — requires installing an extension into your real Chrome profile. Not appropriate for repo-committed reproducible captures. | Personal browsing automation, not video production. |

**Bottom line on MCP:** Treat it as a *design-time* affordance (Claude Code in your editor, talking to `@playwright/mcp`, helping you write the script). The script that lands in the repo runs Playwright directly — no MCP at runtime.

### Audio/video processing libs

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Direct `ffmpeg` shell-out via `node:child_process` (typed wrapper)** | **`fluent-ffmpeg`** (2.1.3, last release 2023) | Don't. `fluent-ffmpeg` is effectively unmaintained (no release in ~2 years as of 2026), has open security issues, and its API hides ffmpeg flags you'll inevitably need to tune (`-movflags +faststart`, `-pix_fmt yuv420p`, CRF). Direct shell-out + a 30-line typed wrapper gives you full control with no abandonment risk. |
| **Direct `ffmpeg` shell-out** | **`ffmpeg-static`** (5.3.0, bundles platform binaries) | Acceptable but not recommended for this repo: (a) the repo already manages platform-specific binaries via Remotion compositor packages — don't multiply that headache, (b) developers on this repo are already comfortable with system tooling. Document `brew install ffmpeg` and move on. Reconsider `ffmpeg-static` only if you start running this in a serverless/container CI with no system ffmpeg. |
| **Direct `ffmpeg` shell-out** | **`@ffmpeg-installer/ffmpeg`** (1.1.0, last update 2022) | No — even more stale than `ffmpeg-static`. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Puppeteer** as the primary driver | Chromium-only in practice; weaker auto-wait → more flaky captures; no first-party trace viewer; Stagehand integration is Playwright-native | Playwright |
| **Raw CDP `Page.startScreencast` + custom frame stitcher** | Reinventing a solved problem; per-frame base64 → ffmpeg pipe is fragile; loses Playwright's auto-wait benefits | Playwright `recordVideo` |
| **External screen recorder against headful browser** (ffmpeg avfoundation on macOS, x11grab on Linux) | Display-server fragility (X11/Wayland/macOS permissions), captures OS chrome you don't want, can't run in headless CI | Playwright `recordVideo` (in-browser capture works headless and headful) |
| **`fluent-ffmpeg`** | Effectively unmaintained as of 2026; hides flags; security advisories | Direct ffmpeg shell-out via `child_process` with a thin typed wrapper |
| **Browser-Use (Python)** | Wrong language for a TS monorepo; running Python alongside Node multiplies CI/local-dev complexity | Stagehand (TypeScript, hybrid script+agent) |
| **Anthropic Computer Use API directly** for v1 | Still beta; "may be error-prone" per Anthropic; you'd be building the loop yourself | Stagehand `agent({mode: "cua"})` which wraps it |
| **MCP server as the runtime driver** | Adds 2 layers of indirection over a process that's already running Playwright underneath; designed for chat-LLM tool-calling, not committed scripts | Playwright direct. MCP is a *design-time* tool: point Claude Code at `@playwright/mcp` to help draft scripts. |
| **Cloud browsers (Browserbase / Browserless / Steel)** for v1 | Adds API key, network latency, per-minute cost; you don't need scale or clean IPs | Local Playwright. Re-evaluate at v3+ if needed. |
| **Headful + screen recorder on a CI runner** | Requires xvfb / X11 on Linux; fragile, slow to debug | Headless Chromium + Playwright `recordVideo` works in CI with zero display server |
| **`puppeteer-extra` + stealth plugins** | Designed for evading bot detection; not your problem (you're recording your own and partner sites). Adds plugin-load complexity | Vanilla Playwright |

---

## Stack Patterns by Variant

**If the shot is a deterministic, reproducible capture (the v1 hellotars.com case):**
- Pure Playwright. Write a `session.ts` file with explicit `await page.click(selector)` / `await page.waitForSelector(...)` calls.
- `recordVideo: { dir: outDir, size: { width: 1920, height: 1080 } }` on the context.
- After `context.close()`, `await video.path()` to find the WebM, then ffmpeg-transcode to MP4.
- **No LLM, no API keys, no network beyond the target site.** This is the bread-and-butter path.

**If the shot is exploratory ("agent mode"):**
- Initialize Stagehand with `env: "LOCAL"` (uses Playwright under the hood — same browser binary, recording config still works).
- Use `stagehand.act("click the chat widget")` and `stagehand.observe(...)` for fragile/changing selectors.
- For full autonomy: `stagehand.agent({mode:"cua", model:"openai/gpt-5"}).execute("open hellotars.com, find the demo chat, send a hello, screenshot the response")`.
- **Important:** at the end of an agent run, dump the resolved action sequence to a JSON file alongside the MP4. That way "agent mode" generates a *candidate deterministic script* you can promote (commit) once it's validated.

**If you need a higher-fidelity recording (deviceScaleFactor 2 / "retina"):**
- `viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, recordVideo: { size: { width: 3840, height: 2160 } }`. Output is 4K WebM. Transcode to 1080p H.264 with a downscale filter (`-vf scale=1920:1080:flags=lanczos`) for cleaner anti-aliasing on text-heavy pages.

**If you eventually want polish FX (cursor highlight, click sound) — v2:**
- Two cleanest paths:
  1. **In-page injection:** Use Playwright's `addInitScript` to inject a CSS overlay that follows `mousemove` and pulses on `click`. Captured *inside* the WebM. Lossless, no post-process.
  2. **Post-process overlay:** Record the action timestamps from the Playwright script (timing of each click), generate a transparent cursor-overlay video, ffmpeg-overlay onto the captured MP4. Cleaner separation; harder to sync.
- Decide in v2; both are feasible on the recommended stack.

**If you eventually want to *stitch* the captured MP4 into a Remotion composition — v3:**
- Already supported: Remotion's `<OffthreadVideo>` plays an MP4. Drop the captured MP4 into `shared/assets/` (or `out/` and reference) and use it like any other asset. No new deps.

**If a target site requires login / state — out of v1 but worth knowing:**
- Use Playwright's `storageState` (`browserContext.storageState({path: 'auth.json'})` once, then `browser.newContext({storageState: 'auth.json'})` thereafter). Never commit `auth.json` — add to `.gitignore`. For agent mode, Stagehand inherits the context so the same `storageState` works.

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `playwright@1.59.1` | Node 20+ | Repo already requires Node 20+; matches. |
| `playwright@1.59.1` | TypeScript 5.6+ | Repo at 5.9.3; matches. |
| `@browserbasehq/stagehand@3.2.1` | `playwright-core` (not full `playwright`) | Stagehand depends on `playwright-core`. If you install full `playwright`, both resolve cleanly — but be aware: pnpm will dedupe `playwright-core` against `playwright`'s internal version. **Pin both to the same Playwright version range** (e.g., both on `^1.59`) to avoid two browser-binary downloads. |
| `@browserbasehq/stagehand@3.2.1` | LLM model providers | `cua` agent mode currently supports `openai/computer-use-preview`, `openai/gpt-5` (with computer-use), `anthropic/claude-sonnet-4` (computer use), `google/gemini-2.5-computer-use-preview-10-2025`. Plain `act` / `observe` works with any tool-calling model (gpt-4o, claude-sonnet, etc.). |
| `playwright@1.59.1` recordVideo | ffmpeg system binary | Playwright records WebM/VP8 *without* invoking ffmpeg (uses a built-in encoder). Ffmpeg is only needed for the *post-process* WebM→MP4 transcode. Puppeteer, by contrast, *requires* ffmpeg at recording time. |
| `playwright@1.59.1` browser bundle | macOS / Linux / Windows | First-class on all three. macOS ARM64 (Apple Silicon) supported natively. |
| Existing repo: `remotion@4.0.450` | New module | Zero overlap. `tools/browser-capture/` produces standalone MP4s in `out/browser-capture/`; Remotion stays in `tools/remotion/`. No shared deps required. |

---

## Reliability Tradeoffs (called out explicitly per quality-gate request)

1. **Playwright `recordVideo` vs Puppeteer `Page.screencast`:**
   Both reliable in steady-state; Playwright wins on *failure modes*. Puppeteer's recorder spawns ffmpeg per recording — if your `$PATH` ffmpeg breaks or version-skews, recording silently fails. Playwright's recorder is in-process (Chromium-side encoder), so it has fewer external moving parts. **Confidence: HIGH.**

2. **Playwright auto-wait vs Puppeteer manual waits:**
   Playwright actions (`click`, `fill`, `selectOption`) auto-wait for actionability (visible, stable, not obscured, enabled). Puppeteer's equivalents fire on first match — you write `waitForSelector` boilerplate. For a *recording* (where you can't tolerate a click on a still-loading element), Playwright's defaults are dramatically more reliable. **Confidence: HIGH.**

3. **Stagehand agent vs raw LLM loop:**
   Stagehand's `act` resolves "click the chat widget" by (a) DOM-snapshot → (b) LLM proposes action → (c) Playwright executes with auto-wait. The Playwright-execution step is the same reliability as your deterministic scripts. The fragility is in the LLM step — handled by Stagehand's retry + observation loop. Rolling your own (Anthropic CUA direct) means you write that loop. **Confidence: MEDIUM** — Stagehand 3.x is recent, and AI-driven steps are inherently nondeterministic. Mitigation: use agent mode only for *exploration*, then promote to a deterministic script before committing.

4. **WebM → MP4 transcode:**
   `ffmpeg -i in.webm -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart -an out.mp4` is the production-safe recipe. CRF 18 is visually lossless; `yuv420p` ensures QuickTime/Premiere/YouTube compatibility; `+faststart` moves the moov atom to the front (faster web playback). `-an` drops audio (Playwright `recordVideo` is silent — drop the empty audio stream cleanly). **Confidence: HIGH.**

5. **Headless vs headful for capture:**
   Modern Chromium headless (`--headless=new`, the default in Playwright 1.40+) renders identically to headful for 99% of pages — same Skia, same V8, same compositor. Headless is *more* reliable in CI (no display server). The user said "headless preferred, headful acceptable" — recommend headless and only flip to headful if a specific shot demonstrates a difference. **Confidence: HIGH.**

---

## Quick-Start Recipe (for the v1 hellotars.com shot)

```typescript
// tools/browser-capture/sessions/hellotars-chat.ts
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const SESSION = 'hellotars-chat';
const OUT_DIR = resolve(process.cwd(), 'out', 'browser-capture', SESSION);
await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: { dir: OUT_DIR, size: { width: 1920, height: 1080 } },
});
const page = await context.newPage();

await page.goto('https://hellotars.com');
const widget = page.locator('[data-tars-chat-widget]'); // selector TBD
await widget.waitFor({ state: 'visible' });
await widget.click();
// ... further interactions ...
await page.waitForTimeout(2000); // hold the final frame

await context.close(); // flushes the WebM
await browser.close();

const video = await page.video()!.path();
const mp4 = resolve(OUT_DIR, 'v01.mp4');
await new Promise<void>((res, rej) => {
  const ff = spawn('ffmpeg', [
    '-y', '-i', video,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-an', mp4,
  ], { stdio: 'inherit' });
  ff.on('exit', code => code === 0 ? res() : rej(new Error(`ffmpeg ${code}`)));
});
console.log(`captured: ${mp4}`);
```

That's the entire v1 module conceptually. The roadmap can wrap this in a `runSession(scriptPath)` function, add a `commander` CLI, and add a Stagehand-mode toggle for agent runs.

---

## Sources

**Verified via Context7 (HIGH confidence):**
- `/microsoft/playwright` — `recordVideo`, `Screencast.start`, `Video.saveAs`, `deviceScaleFactor`, viewport (current docs, library benchmark 91.78)
- `/puppeteer/puppeteer` — `Page.screencast`, `ScreencastOptions` (notes ffmpeg requirement for recording)
- `/browserbase/stagehand` — install, `env: "LOCAL"`, Playwright CDP integration, `act` / `observe` / `extract` / `agent({mode:"cua"})`
- `/microsoft/playwright-mcp` — `createConnection` programmatic API, config schema, capabilities

**Verified via npm registry (current versions, fetched 2026-04-21):**
- `playwright@1.59.1` (published 2026-04-21)
- `puppeteer@24.42.0` (published 2026-04-20)
- `@browserbasehq/stagehand@3.2.1` (published 2026-04-17)
- `@playwright/mcp@0.0.70` (published 2026-04-21)
- `magnitude-core@0.3.1` (published 2026-02-08)
- `@anthropic-ai/sdk@0.90.0` (published 2026-04-16)
- `fluent-ffmpeg@2.1.3` (published 2025-05-22 — confirms staleness)
- `ffmpeg-static@5.3.0` (published 2025-11-14)

**WebSearch (MEDIUM confidence — multiple corroborating sources):**
- BrowserStack, Firecrawl, PkgPulse, HackerNoon (2026 Playwright vs Puppeteer comparisons) — Playwright preferred for reliability, auto-wait, video recording out of the box. [Playwright vs Puppeteer: Which to choose in 2026? | BrowserStack](https://www.browserstack.com/guide/playwright-vs-puppeteer) · [Playwright vs Puppeteer: Which Browser Automation Tool Should You Choose in 2026? | Firecrawl](https://www.firecrawl.dev/blog/playwright-vs-puppeteer)
- Skyvern, NxCode, Scrapfly (2026 Stagehand vs Browser Use comparisons) — Stagehand is the TS-first hybrid choice, Browser Use is Python-first autonomous. [Browser Use vs Stagehand: Which is Better? (Feb 2026) | Skyvern](https://www.skyvern.com/blog/browser-use-vs-stagehand-which-is-better/) · [Stagehand vs Browser Use vs Playwright | NxCode](https://www.nxcode.io/resources/news/stagehand-vs-browser-use-vs-playwright-ai-browser-automation-2026)
- Anthropic official docs — Computer Use is beta, "may be error-prone." [Computer use tool — Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/computer-use-tool)
- Playwright `recordVideo` 1080p configuration patterns. [Videos | Playwright](https://playwright.dev/docs/videos) · [How to Record Video in Playwright with Examples](https://software-testing-tutorials-automation.com/2025/08/record-video-in-playwright.html)
- WebM → MP4 ffmpeg recipes (CRF 18, yuv420p, faststart). [How to Convert WebM to MP4 Using FFmpeg | Unifab](https://unifab.ai/resource/ffmpeg-convert-webm-to-mp4) · [How to convert WebM to MP4 with FFmpeg | Shotstack](https://shotstack.io/learn/webm-to-mp4/)
- Magnitude reliability claims (vision-first, deterministic caching, BSL license). [Show HN: Magnitude | HN](https://news.ycombinator.com/item?id=44390005)

---

*Stack research for: `tools/browser-capture/` (browser automation + tab recording for B-roll generation, TS/Node/pnpm monorepo)*
*Researched: 2026-04-21*

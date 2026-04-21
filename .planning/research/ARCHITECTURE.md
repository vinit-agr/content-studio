# Architecture Research

**Domain:** Browser-capture tool — drives a real browser, records the tab, writes MP4. Hybrid input model (committed deterministic scripts + LLM-driven agent mode). Lives at `tools/browser-capture/` alongside `tools/remotion/` in a multi-tool monorepo.
**Researched:** 2026-04-21
**Confidence:** HIGH for module decomposition, file layout, and data flow (verified against existing repo conventions + Playwright docs via Context7 + 2026 ecosystem state). MEDIUM for agent layer (Stagehand `act`/`observe`/`agent` is the strongest 2026 fit but exact API surface evolves; the boundary is what matters, not the vendor). HIGH for build order (driven by the obvious dependency chain).

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLI Surface                                │
│  pnpm capture <session>            pnpm capture:agent --prompt "..." │
│  └─ src/cli.ts (commander)         └─ src/cli.ts (commander)         │
├─────────────────────────────────────────────────────────────────────┤
│                          Mode Dispatcher                             │
│  ┌────────────────────────┐         ┌─────────────────────────┐     │
│  │ Script Runner          │         │ Agent Runner            │     │
│  │ - loads sessions/X.ts  │         │ - Claude Agent SDK loop │     │
│  │ - executes step list   │         │ - emits same Step{}     │     │
│  └───────────┬────────────┘         └────────────┬────────────┘     │
│              │   both produce a stream of Step{} │                   │
├──────────────┴───────────────────────────────────┴──────────────────┤
│                       Driver Layer (interface)                       │
│   BrowserDriver { goto, click, type, waitFor, screenshot, ... }      │
│   ┌──────────────────────────────────┐                               │
│   │ PlaywrightDriver (default impl)  │  ← swappable behind interface │
│   └──────────────────────────────────┘                               │
├─────────────────────────────────────────────────────────────────────┤
│                       Recorder Layer (interface)                     │
│   Recorder { start, stop, file() }                                   │
│   ┌──────────────────────────────────┐                               │
│   │ PlaywrightRecorder (recordVideo) │  → writes raw .webm           │
│   └──────────────────────────────────┘                               │
├─────────────────────────────────────────────────────────────────────┤
│                      Encoder Layer (post-process)                    │
│   FfmpegEncoder.toMp4(webmPath, mp4Path) → H.264 + faststart         │
├─────────────────────────────────────────────────────────────────────┤
│                       Output / Artifact Layer                        │
│   resolveOutPath(session) → out/browser-capture/<session>/v<NN>.mp4  │
│   writeManifest(session, steps, durationMs, ...)                     │
├─────────────────────────────────────────────────────────────────────┤
│                          Reporter (logging)                          │
│   Pretty step-by-step console output, optional JSON for CI           │
└─────────────────────────────────────────────────────────────────────┘
```

The dispatcher chooses script vs agent runner. Both produce the same `Step{}` stream that flows through driver → recorder. Encoding and artifact-writing happen after `recorder.stop()`. Reporter taps the step stream from the side.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **CLI** (`src/cli.ts`) | Parse argv, validate, dispatch to runner. Owns `--help`, exit codes. | `commander` v13 (TypeScript-native, ESM-friendly, ~35M weekly downloads, the de-facto Node CLI choice in 2026) |
| **Script Runner** (`src/runner/script.ts`) | Dynamic-import `sessions/<name>.ts`, validate it exports a `defineSession(...)` config, execute its `steps[]` against the driver, emit progress events | Pure TS function, no framework dependency |
| **Agent Runner** (`src/runner/agent.ts`) | Run Claude Agent SDK loop. Custom tools wrap the same `BrowserDriver` methods. Each tool call emits a `Step{}` so the recorder + reporter behave identically to script mode | `@anthropic-ai/claude-agent-sdk` (TypeScript) with custom tools — chosen over Stagehand-only because we already commit to Claude in the rest of the repo and want the agent loop owned, not abstracted |
| **Session DSL** (`sessions/<name>.ts`) | Declarative-flavored TypeScript. Each session exports `defineSession({ name, viewport, steps })`. Steps are typed objects, not imperative async code (so they're inspectable, replayable, and a future `agent → script.ts` codegen has a stable target) | Plain TS module; no YAML/JSON to keep editor support, refactoring, and type safety |
| **Driver** (`src/driver/`) | Abstract browser actions behind an interface so Playwright is swappable (CDP-direct, Puppeteer, Stagehand wrapper) without touching scripts or runners | `interface BrowserDriver` + `PlaywrightDriver` impl |
| **Recorder** (`src/recorder/`) | Start/stop video capture for the current page/context. Owns lifecycle (`recordVideo` requires `await context.close()` to flush; `Page.screencast.start/stop` gives precise control — we'll use `recordVideo` v1, keep `screencast` as future option) | `PlaywrightRecorder` using `browser.newContext({ recordVideo: { dir, size } })` |
| **Encoder** (`src/encoder/`) | Post-process WebM → MP4 H.264 with `-movflags faststart`. Lives outside the recorder so encoder can change without touching capture | `child_process.spawn` against `ffmpeg-static`-bundled binary; thin promise wrapper |
| **Artifacts** (`src/artifacts/`) | Resolve output paths (`out/browser-capture/<session>/v<NN>.mp4` with auto-bumping `NN`), write `manifest.json` with run metadata (steps executed, duration, viewport, git SHA, agent vs script mode, seed, LLM model if agent) | Pure functions over `node:fs/promises` |
| **Reporter** (`src/reporter/`) | Format step events as readable console output (with colors, durations); fall back to JSON for `--json` flag (CI/log capture) | Tiny custom logger; no `winston`/`pino` weight needed |
| **Config** (`src/config.ts`) | Resolve env (`.env` for `ANTHROPIC_API_KEY`), per-session config (in-script), defaults (viewport, fps, codec) | Plain TS module with `dotenv` |

## Recommended Project Structure

```
tools/browser-capture/
├── README.md                       # Quick start, sessions list, env vars
├── package.json                    # Tool-local: only if we go multi-package; v1 = single root pkg
├── tsconfig.json                   # extends ../../tsconfig.base.json; adds @capture/* alias
├── src/
│   ├── cli.ts                      # Entry point. `commander` parses; dispatches to runner.
│   ├── config.ts                   # Defaults + .env loader (ANTHROPIC_API_KEY, paths)
│   ├── types.ts                    # Step, Session, Manifest, RunResult types
│   ├── driver/
│   │   ├── index.ts                # Barrel: exports interface + default impl factory
│   │   ├── BrowserDriver.ts        # `interface BrowserDriver` + Step shape
│   │   └── PlaywrightDriver.ts     # Concrete impl (chromium.launch + page actions)
│   ├── recorder/
│   │   ├── index.ts
│   │   ├── Recorder.ts             # `interface Recorder { start, stop, rawPath }`
│   │   └── PlaywrightRecorder.ts   # Wraps newContext({ recordVideo }) lifecycle
│   ├── encoder/
│   │   ├── index.ts
│   │   └── FfmpegEncoder.ts        # webm → mp4 (H.264, faststart) via ffmpeg-static
│   ├── runner/
│   │   ├── index.ts
│   │   ├── script.ts               # Loads sessions/<name>.ts, executes steps[]
│   │   └── agent.ts                # Claude Agent SDK loop with custom browser tools
│   ├── artifacts/
│   │   ├── index.ts
│   │   ├── outPath.ts              # Resolves out/browser-capture/<session>/v<NN>.mp4
│   │   └── manifest.ts             # Writes manifest.json next to the mp4
│   ├── reporter/
│   │   ├── index.ts
│   │   ├── ConsoleReporter.ts      # Pretty step-by-step output
│   │   └── JsonReporter.ts         # --json for machine consumption
│   └── dsl/
│       ├── index.ts
│       └── defineSession.ts        # `defineSession(...)` helper + type-narrowing
├── sessions/                       # COMMITTED scripts (deterministic shots)
│   ├── hellotars.ts                # First reference shot
│   └── README.md                   # How to add a new session
└── out/                            # Symlink/convention only — actual writes go to repo-root out/
```

Two extra notes on layout:

1. **`out/` stays at the repo root** (`out/browser-capture/<session>/v<NN>.mp4`) per `PROJECT.md` and the existing `out/cx-agent-evals--chunk-vs-span/v01.mp4` pattern. The tool resolves to that path via `node:path` from CWD; no symlink needed.
2. **`sessions/` lives inside `tools/browser-capture/`, not under `projects/`.** `projects/<source-repo>--<slug>/` is for tool-agnostic narrative docs (script.md, storyboard.md). A browser-capture session is an executable artifact, so it belongs with the tool. A `projects/X/notes.md` can reference the session by name.

### Structure Rationale

- **`src/driver/` vs `src/recorder/` split:** Both happen to be Playwright-backed in v1, but they answer different questions ("how do I act on the page" vs "how do I capture frames"). Splitting them now makes it cheap to switch later — e.g., move recording to OS-level (`ffmpeg avfoundation` screen capture) without touching scripts, or swap the driver to CDP-direct for performance without losing video.
- **`runner/script.ts` and `runner/agent.ts` peer-equal:** Same input contract (a `Session` config or NL prompt), same output contract (a stream of `Step{}` events plus a final `RunResult`). Neither calls the other. The CLI picks one.
- **`dsl/defineSession.ts` as a helper:** Mirrors how `Vite`/`Vitest`/`Astro` ship `defineConfig()` — the function is identity at runtime, but its types narrow inputs so authoring sessions gets full IntelliSense.
- **`encoder/` separate from `recorder/`:** Recording produces WebM (Playwright's only format). MP4 conversion is a different concern with a different binary (`ffmpeg`) and different failure modes. Keeping them separate means a recorder swap doesn't drag the encoder along.
- **`reporter/` not threaded through every layer:** Driver/recorder/runner all write to a thin event bus (`EventEmitter` or even just a passed-in callback). Reporter subscribes. This avoids polluting business logic with `console.log` calls (matches the codebase convention in `CONVENTIONS.md` of "no active console.log calls in source code").

## Architectural Patterns

### Pattern 1: Driver / Runner Separation (Hexagonal-lite)

**What:** Browser interaction lives behind an interface (`BrowserDriver`). Both runners (script and agent) consume this interface, never `playwright` directly.
**When to use:** Whenever there's a real chance the underlying tool changes — and for browser automation, that's basically a certainty over a 12-month horizon (Playwright vs Puppeteer vs CDP-direct vs hosted Browserbase all have valid reasons to swap in).
**Trade-offs:** Adds one indirection layer. Worth it because it (a) makes agent and script modes share a single tool surface, (b) enables a fake driver in tests, (c) future-proofs the swap.

**Example:**
```typescript
// src/driver/BrowserDriver.ts
export type Step =
  | { kind: 'goto'; url: string }
  | { kind: 'click'; selector: string }
  | { kind: 'type'; selector: string; text: string }
  | { kind: 'waitFor'; selector: string; timeoutMs?: number }
  | { kind: 'wait'; ms: number }
  | { kind: 'scroll'; selector?: string; deltaY: number };

export interface BrowserDriver {
  execute(step: Step): Promise<void>;
  screenshot(): Promise<Buffer>;
  page(): unknown; // escape hatch for advanced steps; keep typed in impls
}
```

### Pattern 2: Session-as-Data (DSL)

**What:** A session script is a typed config object, not a chain of imperative `await driver.click(...)` calls. The runner walks the array.
**When to use:** When you need the same script to be (a) human-authored, (b) machine-generated by the agent, (c) inspected for codegen, (d) re-runnable deterministically. All four apply here.
**Trade-offs:** Less expressive than imperative TS (you can't drop a `for` loop in the middle of a session). Mitigated by allowing a `kind: 'eval'` step with a typed callback for true escape hatches. The win — agent-mode can dump its tool-call log as a `Session` and you get a committed script for free — is large.

**Example:**
```typescript
// sessions/hellotars.ts
import { defineSession } from '../src/dsl';

export default defineSession({
  name: 'hellotars',
  viewport: { width: 1280, height: 800 },
  url: 'https://hellotars.com',
  steps: [
    { kind: 'goto', url: 'https://hellotars.com' },
    { kind: 'waitFor', selector: '[data-testid="chat-widget"]', timeoutMs: 10_000 },
    { kind: 'wait', ms: 500 },
    { kind: 'click', selector: '[data-testid="chat-widget"]' },
    { kind: 'wait', ms: 1500 },
    { kind: 'scroll', deltaY: 600 },
    { kind: 'wait', ms: 1000 },
  ],
});
```

### Pattern 3: Lifecycle-Owned Recording

**What:** The recorder owns its own lifecycle and exposes only `start()` / `stop()` / `rawPath()`. Internally, it knows that Playwright's `recordVideo` only flushes when the *context* (not the page) is closed, and it handles that quirk so callers don't have to.
**When to use:** Any time the underlying capture API has non-obvious teardown semantics (Playwright `recordVideo` is the canonical example — the file isn't on disk until `await context.close()`).
**Trade-offs:** None really; this is just good encapsulation. Without it, every script-runner refactor risks corrupting the WebM.

**Example:**
```typescript
// src/recorder/PlaywrightRecorder.ts
export class PlaywrightRecorder implements Recorder {
  private context?: BrowserContext;
  private rawDir = path.join(os.tmpdir(), `bc-${randomUUID()}`);

  async start(browser: Browser, viewport: { width: number; height: number }) {
    this.context = await browser.newContext({
      viewport,
      recordVideo: { dir: this.rawDir, size: viewport },
    });
    return this.context.newPage();
  }

  async stop(): Promise<string> {
    if (!this.context) throw new Error('Recorder.stop() before start()');
    await this.context.close(); // critical: flushes WebM
    const files = await fs.readdir(this.rawDir);
    const webm = files.find((f) => f.endsWith('.webm'));
    if (!webm) throw new Error(`No .webm produced in ${this.rawDir}`);
    return path.join(this.rawDir, webm);
  }
}
```

### Pattern 4: Agent-as-Tool-Caller (uniform with script mode)

**What:** Agent mode is just a different `Step{}` source. The Claude Agent SDK loop is given custom tools (`browser_goto`, `browser_click`, etc.) that wrap the same `BrowserDriver` methods. Each tool call emits a `Step{}` to the same recorder/reporter pipeline. After the run, the dispatcher can serialize the executed steps into a `sessions/<name>.ts` file — this is how NL-to-script codegen works without a separate code-generator subsystem.
**When to use:** Whenever you have two input modes (deterministic + exploratory) but want one execution path.
**Trade-offs:** The agent loop is the slowest part (LLM round-trips between every action); script mode stays fast. That's fine — agent mode is for exploration, not production captures.

**Example:**
```typescript
// src/runner/agent.ts (sketch)
const result = await query({
  prompt: nlPrompt,
  options: {
    customTools: [
      { name: 'browser_goto', description: '...', input_schema: { ... },
        handler: async ({ url }) => { await driver.execute({ kind: 'goto', url }); return { ok: true }; } },
      { name: 'browser_click', /* ... */ },
      // ...
    ],
  },
});
// After loop: agent.executedSteps → write to sessions/<name>.ts
```

## Data Flow

### Script Mode

```
$ pnpm capture hellotars
        │
        ▼
[ src/cli.ts (commander) parses argv ]
        │
        ▼
[ resolves session: import('./sessions/hellotars.ts') → Session config ]
        │
        ▼
[ artifacts/outPath.ts → out/browser-capture/hellotars/v03.mp4 (next free NN) ]
        │
        ▼
[ PlaywrightDriver.launch() → browser handle ]
        │
        ▼
[ PlaywrightRecorder.start(browser, viewport) → page handle, raw .webm dir ]
        │
        ▼
┌───────────────────────────────────────────────────┐
│ for step of session.steps:                         │
│   reporter.emit({ type: 'step:start', step })      │
│   await driver.execute(step)                       │
│   reporter.emit({ type: 'step:done',  step, ms })  │
└───────────────────────────────────────────────────┘
        │
        ▼
[ PlaywrightRecorder.stop() → context.close() flushes .webm; returns rawPath ]
        │
        ▼
[ FfmpegEncoder.toMp4(rawPath, outPath) ]
        │
        ▼
[ artifacts/manifest.ts writes out/browser-capture/hellotars/v03.manifest.json ]
        │
        ▼
[ reporter.emit({ type: 'done', outPath, durationMs }) ]
        │
        ▼
[ exit 0 ]
```

### Agent Mode

```
$ pnpm capture:agent --prompt "Open hellotars.com, find the chat widget, click it, scroll a bit"
        │
        ▼
[ src/cli.ts parses argv; loads ANTHROPIC_API_KEY from .env ]
        │
        ▼
[ artifacts/outPath.ts → out/browser-capture/agent-<timestamp>/v01.mp4 ]
        │
        ▼
[ PlaywrightDriver.launch() ]
        │
        ▼
[ PlaywrightRecorder.start(...) ]
        │
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Claude Agent SDK loop:                                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. Send prompt + page state (DOM snapshot or screenshot)   │  │
│  │ 2. Claude returns tool_call (browser_click, etc.)          │  │
│  │ 3. Tool handler:                                            │  │
│  │    a. translate to Step{}                                   │  │
│  │    b. await driver.execute(step)                            │  │
│  │    c. push step to executedSteps[]                          │  │
│  │    d. reporter.emit('step:done', step)                      │  │
│  │    e. capture new page state, return as tool_result         │  │
│  │ 4. Repeat until Claude returns final message                │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
        │
        ▼
[ PlaywrightRecorder.stop() → rawPath ]
        │
        ▼
[ FfmpegEncoder.toMp4(rawPath, outPath) ]
        │
        ▼
[ Optional: artifacts/codegen.ts → sessions/agent-<timestamp>.ts (committable) ]
        │
        ▼
[ manifest.json includes: prompt, model, executedSteps, tokenUsage ]
        │
        ▼
[ exit 0 ]
```

### Where NL → script generation lives

**Two valid options. Recommendation: option B for v1.**

- **Option A: Claude Code (write-time).** User asks Claude Code "write me a session for hellotars.com that…", Claude writes `sessions/hellotars.ts` directly, user runs `pnpm capture hellotars`. No agent code in the tool. **Pro:** zero runtime LLM dependency in the tool; cheaper. **Con:** doesn't satisfy the "agent mode" requirement in `PROJECT.md` for ad-hoc/exploratory captures where you want the LLM watching the actual page state.
- **Option B (recommended): Module's own subcommand.** `pnpm capture:agent --prompt "..."` runs the agent loop inside the tool. After a successful run, it auto-writes the executed steps to `sessions/agent-<timestamp>.ts` so the exploratory capture becomes a committable, replayable script. This unifies "exploration" and "script generation" into one path. **Pro:** matches the "hybrid input model" requirement exactly; codegen falls out for free. **Con:** tool ships with `@anthropic-ai/claude-agent-sdk` as a runtime dep and needs `ANTHROPIC_API_KEY` in `.env`.

Option B also leaves option A available — Claude Code can still hand-write `sessions/*.ts` files because the DSL is just typed TypeScript.

## Boundaries with Existing Tools

### `tools/browser-capture/` ↔ `tools/remotion/`

**Confirmed: zero coupling.** No shared imports. No shared runtime. Browser-capture writes MP4 files; if a future Remotion composition wants to embed one, it uses Remotion's `<OffthreadVideo>` against the file path. That's it. `PROJECT.md` line 65 makes this explicit ("No Remotion dependency in browser-capture").

### Shared utilities

- **For v1: tool-local.** Everything browser-capture needs (path resolution, manifest writing, ffmpeg invocation) is tool-specific. Don't pre-emptively hoist anything to `shared/`.
- **For v2+: hoist on the second use.** When a third tool (`tools/ffmpeg/`, `tools/editor/`) needs ffmpeg invocation, lift `FfmpegEncoder` to `shared/ffmpeg/` and have both consumers depend on it. Same rule for any other utility.

### Theme / styling inheritance

- **v1: none.** A bare browser capture doesn't render anything we control — it captures whatever the target site renders.
- **v2 (cursor highlight, click sound, typing sound — explicitly deferred per `PROJECT.md`):** *yes, inherit.* When we add a cursor overlay or click-pulse, those visuals should pull colors from `shared/theme/` so a "channel-branded cursor highlight" is consistent across browser-capture and Remotion. Concretely: `shared/theme/colors.ts` already exposes brand colors; the v2 cursor overlay imports `accent` for the highlight ring. This is the only point of theme contact and it doesn't pull React into browser-capture (cursor overlay is injected as page CSS via `page.addStyleTag`, not as a React component).

### pnpm workspace setup

**Recommendation: stay single-package for v1.** The current `package.json` is one root manifest; `tools/remotion/` doesn't have its own. Browser-capture follows the same pattern: dependencies (`playwright`, `@anthropic-ai/claude-agent-sdk`, `ffmpeg-static`, `commander`, `dotenv`) go in the root `package.json`; scripts (`capture`, `capture:agent`, `capture:install-browsers`) go in the root `scripts` block.

Why not a workspace?
- pnpm workspaces help when you need separately-versioned, independently-publishable packages. We don't (none of these tools ship to npm).
- A workspace adds friction to cross-tool refactors and to the existing `tsconfig.json` path-alias setup.
- If a future tool genuinely needs isolation (different Node version, conflicting deps), revisit then. **YAGNI applies.**

The TS path-alias addition is the only config change: add `@capture/*` → `tools/browser-capture/src/*` in `tsconfig.json`. (No webpack alias needed — this tool doesn't go through Remotion's webpack.)

## Build Order (Natural Cut-Points)

The dependency graph dictates the order. There's one obvious "ship a working v1" cut after step 5; everything after is polish.

1. **Driver shell + Playwright impl** — `interface BrowserDriver` and `PlaywrightDriver` covering the 6 step kinds (`goto`, `click`, `type`, `waitFor`, `wait`, `scroll`). Smoke-test from a throwaway script. *Cut: nothing user-facing yet, but the foundation is testable.*

2. **Recorder + Encoder** — `PlaywrightRecorder` (recordVideo, context-close-flush quirk handled), `FfmpegEncoder` (webm → mp4 H.264 faststart). Smoke-test: load google.com, sleep 3s, write MP4. *Cut: you can verify recording works end-to-end before adding script semantics.*

3. **Session DSL + Script Runner** — `defineSession`, `Session` types, `runner/script.ts` walking `steps[]`. *Cut: you can author and run a session, but no CLI yet (drive it from a temporary `tools/browser-capture/dev.ts`).*

4. **Artifacts + Reporter** — output path resolution with `v<NN>` auto-bump, manifest writer, console reporter with step timing. *Cut: outputs land in the right place with metadata.*

5. **CLI + first hellotars session + `pnpm capture` script** — wire it all together with `commander`, write `sessions/hellotars.ts`, add the npm script. **THIS IS V1.** Run `pnpm capture hellotars` → produces `out/browser-capture/hellotars/v01.mp4`. Done.

6. **Agent runner + `pnpm capture:agent`** — Claude Agent SDK loop with custom tools, codegen of executed steps to `sessions/agent-<ts>.ts`. *Cut: hybrid input model complete.*

7. **(v2, deferred per `PROJECT.md`)** Polish FX: cursor highlight overlay (theme-aware), click-pulse animation, typing sound, screencast API for precise start/stop windows.

The natural ship-to-validate point is after step 5 (one working deterministic shot). Step 6 (agent) is additive — it can be developed and validated independently because the driver/recorder/encoder it shares are already proven by step 5.

## Configuration & Secrets

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Per-session config (viewport, URL, steps) | **In-script.** `defineSession({ viewport, url, steps })` colocates everything. | One file per session = atomic refactors, easy diffs, no cross-file lookups when reviewing what a shot does. |
| Tool-wide defaults (default viewport, fps, codec, ffmpeg quality) | `src/config.ts` exports a `DEFAULTS` const; sessions can override per-key. | Mirrors `frames.ts` pattern in the existing Remotion tool — one immutable const for defaults, per-instance overrides via spread. |
| `ANTHROPIC_API_KEY` (agent mode) | `.env` at repo root, loaded via `dotenv` in `src/config.ts`. Gitignored. Validate presence only when agent mode runs. | Matches `PROJECT.md` line 67 ("never committed in source"). Lazy validation lets script mode work without an API key configured. |
| Other LLM provider keys (future) | Same `.env` pattern; `config.ts` exports a `getCredentials(provider)` helper. | Future-proof without over-building. |
| `ffmpeg` dependency | **`ffmpeg-static`** (bundled binary). | Reliability requirement (`PROJECT.md`: "Reliability over speed"). System ffmpeg means "works on Vinit's Mac" doesn't guarantee "works on the next collaborator's machine or CI." `ffmpeg-static` ships H.264 in the bundled build, which is all v1 needs. The downside (heavier `node_modules`, can't trivially cross-platform package without purging) is irrelevant for a personal-channel tool that runs from a dev machine. |
| Playwright browser binaries | `playwright install chromium` post-install. Add `"capture:install-browsers": "playwright install chromium"` to `package.json` scripts; document in README. | Playwright doesn't bundle browsers — they're a separate ~150MB download. Explicit install step keeps `pnpm install` fast for users who never run `capture`. |

## Scaling Considerations

This is a personal-channel tool; "scaling" means "more sessions" and "longer captures," not "more concurrent users."

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1–10 sessions | Current architecture is fine. Sessions live as TS files; output as MP4s. |
| 10–50 sessions | Add `sessions/` subdirectories by project (e.g., `sessions/cx-agent-evals/...`). Add `pnpm capture:list` to enumerate available sessions. |
| 50+ sessions or captures > 5 min | Consider switching from `recordVideo` to `Page.screencast.start/stop` for precise windows (skip the loading scaffold). Consider running multiple captures in parallel via `Promise.all` over `BrowserContext` instances. |
| Captures that need to be exactly frame-aligned with Remotion comps | Move from `recordVideo` (variable framerate WebM) to deterministic frame-by-frame capture via CDP `Page.screencastFrame` + ffmpeg image2 → MP4. This is a bigger rewrite; only justified if the editing pipeline actually needs it. |

### Scaling priorities (what breaks first)

1. **Session reliability under site changes.** A committed script breaks when hellotars.com restructures its DOM. Mitigation: prefer `data-testid` selectors when the site has them; otherwise prefer text-based locators (`page.getByText`); fall back to robust accessibility-tree selectors. Worth investing in *before* you have 10 sessions.
2. **Long captures eating disk.** Raw WebM in `os.tmpdir()` should be deleted after MP4 conversion succeeds. The encoder layer should handle this in a `finally`.
3. **Agent mode token cost.** Each step is an LLM round-trip. For a 10-action capture, that's ~10 calls × ~2K tokens each. Mitigation: agent mode is for *exploration*, not bulk runs — codegen the result to a script and re-run from the script after.

## Anti-Patterns

### Anti-Pattern 1: Letting `playwright` leak through the runner

**What people do:** Pass the `Page` object directly into the runner or session steps so authors can call `page.click(...)` inline.
**Why it's wrong:** Couples sessions to Playwright forever. Loses the data-driven session shape that lets agent mode codegen scripts. Forces every refactor of the underlying driver to touch every session file.
**Do this instead:** Sessions speak `Step{}`. Runners speak `BrowserDriver`. Driver impls own the `Page`. The escape hatch (`kind: 'eval'` with a typed callback) exists, but it's the exception, and even it shouldn't expose `page` directly — pass a narrowed `DriverContext` interface.

### Anti-Pattern 2: Skipping `await context.close()` and writing the MP4 from a half-flushed buffer

**What people do:** Try to read `page.video().path()` while the browser is still open, get a half-written WebM, hand it to ffmpeg, and produce a corrupt MP4.
**Why it's wrong:** Playwright's `recordVideo` *only flushes the file when the BrowserContext closes.* The `page.video()` promise resolves at close time, not action time. Symptoms: MP4 with wrong duration, missing tail seconds, or "moov atom not found" errors.
**Do this instead:** The recorder owns this lifecycle (Pattern 3 above). `Recorder.stop()` is the only thing that closes the context, and it returns the WebM path only after `await context.close()` completes. Encoder runs after stop. Always.

### Anti-Pattern 3: One giant runner that does both modes

**What people do:** Write a single `runner.ts` with an `if (mode === 'agent')` branch. Both modes share a top-level `for` loop.
**Why it's wrong:** Script mode is "execute this list, fail fast." Agent mode is "loop, decide, execute, observe, repeat." They have fundamentally different control structures. Sharing the loop forces one mode to compromise.
**Do this instead:** Two runners. They share the *driver* (action surface) and the *recorder* (capture surface), not the *control flow.* The CLI dispatches.

### Anti-Pattern 4: Embedding ffmpeg invocation inside the recorder

**What people do:** "The recorder produces an MP4." So they jam ffmpeg into the recorder lifecycle.
**Why it's wrong:** Conflates two different failure surfaces. Capture failures are "the page didn't load" (transient, retryable). Encoding failures are "ffmpeg can't find a codec" (config). When they're in the same module, error messages get muddy and retry logic gets complicated.
**Do this instead:** Recorder produces a raw artifact (WebM). Encoder consumes the raw artifact and produces the deliverable (MP4). Two separate operations, two separate error domains.

### Anti-Pattern 5: Per-tool `package.json` with vendored Playwright

**What people do:** Make `tools/browser-capture/` a sub-package and re-vendor `playwright` there for "isolation."
**Why it's wrong:** Doubles install size, fragments the lockfile, and the existing repo doesn't do this for `tools/remotion/`. Premature workspace-ification.
**Do this instead:** Single root `package.json`. Browser-capture's deps go alongside Remotion's. If a real isolation need emerges (conflicting Node versions, can't-coexist deps), revisit.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Anthropic API (Claude)** | `@anthropic-ai/claude-agent-sdk` for agent mode. Custom tools wrap `BrowserDriver`. | Only loaded when agent mode runs (`runner/agent.ts` is dynamically imported by the CLI to keep script-mode startup fast and avoid requiring `ANTHROPIC_API_KEY` for script-only users). |
| **Target websites** | `playwright.chromium.launch()` → `page.goto()`. Treat as "untrusted external" — no assumptions about DOM stability. | First reference shot is hellotars.com per `PROJECT.md`. Use `data-testid` if available; otherwise text-based locators. |
| **ffmpeg** | `child_process.spawn(ffmpegStatic, [...])`. Streamed stderr → reporter. | Bundled via `ffmpeg-static`; no system dependency. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| CLI → Runner | Direct function call (`runScript(session, options)` or `runAgent(prompt, options)`) | Runners are dynamically imported so agent SDK isn't loaded for script runs. |
| Runner → Driver | Through `BrowserDriver` interface only | Runner never imports `playwright` directly. |
| Runner → Recorder | Driver and recorder both receive the same `Browser` handle from the CLI; they don't talk to each other | Decouples them so swapping one doesn't affect the other. |
| Runner → Reporter | EventEmitter or callback (`reporter.emit({ type, payload })`) | One-way; reporter never controls the runner. |
| Encoder → Artifacts | Encoder returns the MP4 path; artifacts module handles renaming/manifest | Keeps encoder dumb (it knows webm-in, mp4-out, nothing about the project's naming convention). |
| Browser-capture ↔ `tools/remotion/` | **No direct boundary.** Communication is via filesystem (the MP4 file). | If future Remotion comps embed captures, they use `<OffthreadVideo src="out/browser-capture/.../v01.mp4" />`. |
| Browser-capture ↔ `shared/theme/` | **None in v1.** Single import point in v2 (`@theme/colors` for cursor overlay accent color). | Stay zero-import for v1 to keep boundaries clean. |

## Sources

### Authoritative (HIGH confidence)
- [Playwright Videos documentation (Context7 / playwright.dev)](https://playwright.dev/docs/videos) — `recordVideo` lifecycle, context-close-to-flush requirement, default WebM/VP8 output, video-size defaults, `page.video().path()` and `Video.saveAs()`, `Page.screencast.start/stop` API.
- [Playwright Release Notes](https://playwright.dev/docs/release-notes) — Confirmed Screencast API addition for precise start/stop control.
- [Anthropic Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — Agent loop semantics (prompt → tool_call → tool_result → repeat), TypeScript SDK availability (Node 18+), custom tool registration.
- [Anthropic Claude Agent SDK TypeScript GitHub](https://github.com/anthropics/claude-agent-sdk-typescript) — Package and changelog confirming the API surface.
- Existing repo `.planning/codebase/` (ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md) — Confirms `tools/<purpose>/` pattern, single root `package.json`, path-alias convention, no console-log convention, output-path convention (`out/<project>/v<NN>.<ext>`), TypeScript strict mode.

### Strong-secondary (MEDIUM confidence)
- [ffmpeg-static npm package](https://www.npmjs.com/package/ffmpeg-static) — Bundled cross-platform ffmpeg binary; H.264 support sufficient for v1.
- [Building CLI apps with TypeScript in 2026](https://hackers.pub/@hongminhee/2026/typescript-cli-2026) — Confirms `commander` v13 as the de-facto choice for typed Node CLIs.
- [Stagehand vs Browser Use vs Playwright comparison (2026)](https://www.nxcode.io/resources/news/stagehand-vs-browser-use-vs-playwright-ai-browser-automation-2026) — Validates the "deterministic primitives + agent loop" split that informs the runner separation pattern; Stagehand v3 caching mirrors our codegen-from-agent idea.
- [Justin Abrahms — Generating demo videos with Playwright (Feb 2026)](https://justin.abrah.ms/blog/2026-02-12-generating-demo-videos-with-playwright.html) — Practical WebM → MP4 conversion pattern used in production.
- [Converting WebM to MP4 with FFmpeg](https://blog.addpipe.com/converting-webm-to-mp4-with-ffmpeg/) — `-movflags faststart -profile:v high` flags for streamable H.264.

### Ecosystem context
- [11 Best AI Browser Agents in 2026 (Firecrawl)](https://www.firecrawl.dev/blog/best-browser-agents)
- [Browser Use vs Stagehand (Skyvern, Feb 2026)](https://www.skyvern.com/blog/browser-use-vs-stagehand-which-is-better/)
- [Playwright MCP](https://playwright.dev/docs/getting-started-mcp) — Alternative path (run agent through MCP rather than Agent SDK custom tools); rejected for v1 because it adds an out-of-process server and makes step-event capture harder.

---
*Architecture research for: browser-capture tool*
*Researched: 2026-04-21*

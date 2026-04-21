# Codebase Concerns

**Analysis Date:** 2026-04-21

## Tech Debt

**Stub Primitives — rendering incomplete components visually:**
- Issue: Five primitives (Token, Span, Cursor, MetricBar, Chunk) are marked with `data-stub` attributes and implement only placeholder visuals. Specifically:
  - `Token` (`tools/remotion/src/primitives/Token.tsx:17`) — dashed border around text; per-token reveal animation deferred
  - `Span` (`tools/remotion/src/primitives/Span.tsx:18`) — inline highlight stub; animation sync deferred
  - `Cursor` (`tools/remotion/src/primitives/Cursor.tsx:18`) — blinking cursor placeholder; beat sync deferred
  - `MetricBar` (`tools/remotion/src/primitives/MetricBar.tsx:22`) — horizontal bar stub; fill animation deferred
  - `Chunk` (`tools/remotion/src/primitives/Chunk.tsx:2`) — shows chunk index + text with border; full polish deferred
- Files: `tools/remotion/src/primitives/{Token,Span,Cursor,MetricBar,Chunk}.tsx`
- Impact: Rendered videos show incomplete UI placeholder styling instead of polished motion graphics. The pilot MP4 will have visible markers indicating unfinished work. Scene 03-chunking and 05-comparison rely heavily on these primitives, so animation quality degrades.
- Fix approach: Implement animation in each primitive (see spec §8.2 for easing functions available). Sync `Cursor` and `MetricBar` to narration beats via `interpolate()` or Remotion's `spring()`. Replace dashed border placeholders with motion-based reveals.

**Webpack Alias Synchronization Risk:**
- Issue: `remotion.config.ts` (line 8–11) declares webpack aliases that must stay in lockstep with `tsconfig.json` paths. Both files have matching entries for `@shared`, `@theme`, `@primitives`, but any future alias addition risks drift.
- Files: `remotion.config.ts:12–23`, `tsconfig.json:5–9`
- Impact: If aliases diverge, TypeScript compilation succeeds (TS checks only the tsconfig), but Remotion's webpack bundler fails at preview/render with module not found errors. This is discovered late (at render time, not compile time).
- Fix approach: Extract aliases to a shared `.js` config file imported by both `remotion.config.ts` and `tsconfig.json` (via a custom TS plugin or manual sync). Alternatively, add a validation script to the pre-commit hook that parses both files and verifies exact match. Current mitigation: inline comment on line 8 of `remotion.config.ts` + manual verification in acceptance tests.

**Scene Timing Validation Only at Runtime:**
- Issue: `frames.ts` (lines 18–34) implements contiguity and sum validation, but only throws errors when the module is loaded. If `SCENES` is edited incorrectly, the error is not caught until preview boots or tests run.
- Files: `tools/remotion/src/compositions/chunk-vs-span/frames.ts:18–34`
- Impact: A developer could commit a timing error (e.g., changing `chunking.duration` to 400 instead of 450, making the sum fall short) and not discover it until CI or a test run. No static type check prevents this.
- Fix approach: Use `satisfies` clause more aggressively (frame timing is already `satisfies Record<...>`, but the sum check runs at runtime). Consider a compile-time check via TypeScript const assertion or a vitest snapshot test. Low-risk mitigation: current check is sufficient since it's always validated during studio preview.

**Per-Project Theme Override Manual Sync:**
- Issue: Design spec (§4, Q6) defers theme sync automation. Per-project theme files like `shared/theme/projects/cx-agent-evals.ts` are hand-written from palette definitions in the source repo (cx-agent-evals). There is no script to pull or validate alignment.
- Files: `shared/theme/projects/cx-agent-evals.ts`
- Impact: If the source repo's palette changes, the studio's theme file will silently drift out of sync. Videos using the old palette become visually inconsistent with the source project's branding.
- Fix approach: Create a theme-sync script that pulls palette definitions from `repo-references/cx-agent-evals/` and regenerates `shared/theme/projects/cx-agent-evals.ts` (this is deferred to Phase 2 per spec §11). For now, manually validate palette match by comparing source repo's design tokens against the theme file before rendering.

## Known Bugs

**Remotion Config Loader ESM Context (FIXED in commit 1d2cd59):**
- Issue: Initially, `remotion.config.ts` used `import.meta.url` with `fileURLToPath()` to resolve webpack aliases (committed intent). Remotion's config loader transforms the config to CommonJS before execution, making `import.meta.url` undefined. This caused `ERR_INVALID_ARG_TYPE` when running `pnpm render:chunk-vs-span`.
- Status: **Fixed** — commit `1d2cd59` ("fix(remotion): resolve aliases via relative paths, not import.meta.url") switched to `path.resolve('./shared')` etc., relying on `process.cwd()` (the repo root where pnpm scripts run).
- Files: `remotion.config.ts:1–23` (current working version)
- Impact: **None current** — the fix is in place and verified by acceptance tests (pnpm render succeeds).
- Prevention: The current workaround (relative paths from repo root) is stable and matches Remotion's canonical examples. No further action needed.

## Security Considerations

**No Hardcoded Secrets in Source:**
- Risk: Environment-based credentials (API keys, tokens) could leak if committed.
- Files: All source under `tools/remotion/src/` and `shared/`
- Current mitigation: No API keys, database URLs, or auth tokens present in any `.ts`, `.tsx`, or `.json` files. The project is self-contained (no external API integrations on day one).
- Recommendations: If future phases add integrations (e.g., YouTube upload, cloud rendering, AI generation), enforce `SECRETS.md` + `.env` pattern. Add pre-commit hook to block patterns like `api.?key.*=|password.*=` (see `.claude/agents/gsd-code-reviewer.md:109` for example regex patterns).

**No XSS/HTML Injection Vectors:**
- Risk: Remotion compositions render to canvas/video, not HTML, so typical DOM XSS is not a concern. However, if captions or dynamic text ever flows from untrusted input, `innerHTML` misuse could occur.
- Files: `tools/remotion/src/` — all text rendering uses React components (safe by default).
- Current mitigation: No `dangerouslySetInnerHTML`, `eval()`, or external script execution. Captions are defined as string constants in `captions.ts`.
- Recommendations: If future phases load narrative/caption data from external sources (e.g., JSON API, database), sanitize input with DOMPurify or a similar library before rendering.

**No Browser API Misuse in Server-Side Context:**
- Risk: Remotion runs in a headless browser (via Chromium), not Node.js, so `window` / `document` APIs are safe. However, if config files or shared utilities accidentally use these, render will fail.
- Files: Checked all `.ts` / `.tsx` under `tools/` — no direct `window.`, `document.`, or `localStorage` usage.
- Current mitigation: Clean separation: scene compositions use only Remotion/React APIs; config and theme are pure functions.
- Recommendations: Linting rule (already in `eslint.config.js`: TypeScript ESLint recommended rules) will catch accidental browser API usage in config files.

## Performance Bottlenecks

**Scene Composition Complexity:**
- Problem: Scene 05-comparison (`tools/remotion/src/compositions/chunk-vs-span/scenes/05-comparison.tsx`) is 26 lines and composes multiple Chunk/Span/Token primitives with reveal animations. As stub primitives are filled in with complex easing, this scene may become render-intensive.
- Files: `tools/remotion/src/compositions/chunk-vs-span/scenes/05-comparison.tsx`
- Cause: No memoization or render batching currently applied; each frame re-renders all nested components. Remotion's preloader should handle this, but large frame counts (900 frames for this scene) could slow preview interaction.
- Improvement path: Profile frame render time with `remotion studio` when stubs are animated. If slowdown is noticeable (>2s per frame), apply React.memo() to primitive components and use Remotion's `useVideoConfig()` to optimize frame-dependent logic. For now, not a blocker.

**Font Loading Synchronicity:**
- Problem: `shared/theme/fonts.ts:9–13` calls `loadFont()` at module load time (when Root.tsx mounts). This is synchronous and happens only once (guard via `loaded` flag), but if the Google Fonts CDN is slow, it could delay initial preview/render startup.
- Files: `shared/theme/fonts.ts:9–13`, called from `tools/remotion/src/Root.tsx:10`
- Cause: `@remotion/google-fonts/JetBrainsMono.loadFont()` is a synchronous operation (fetches font metadata; actual font data is fetched lazily by the browser).
- Improvement path: Minimal risk for Remotion (fonts are preloaded at composition registration time). If render times degrade, consider pre-warming the font fetch with a `useEffect()` or moving `loadFonts()` to a build-time step. Not a concern for the pilot.

## Fragile Areas

**Path Alias Resolution in ESM + Webpack Context:**
- Files: `remotion.config.ts:12–23`, `tsconfig.json:5–9`, composition imports throughout `tools/remotion/src/`
- Why fragile: Path aliases are resolved by two separate systems — TypeScript compiler and Webpack bundler. A mismatch breaks silently at runtime (render error, not compile error). The current fix (relative paths from `process.cwd()`) works but relies on execution context assumptions (script runs from repo root).
- Safe modification: Before adding new aliases, verify they work in both systems: (1) add to `tsconfig.json` paths, (2) add matching webpack alias to `remotion.config.ts`, (3) run `pnpm typecheck` (TypeScript validates alias exists), (4) run `pnpm studio`, click a composition, and check browser console for any module not found errors. Only then commit.
- Test coverage: Limited — no unit test validates alias resolution. The acceptance test (manual `pnpm studio` + preview success) is the only validation.

**Scene Frame Timing as Inline Constants:**
- Files: `tools/remotion/src/compositions/chunk-vs-span/frames.ts:4–11`
- Why fragile: Frame timings (start, duration) are magic numbers. If a scene's duration is shortened (e.g., compressing chunking from 450 to 400 frames), the developer must manually update `TOTAL_DURATION_FRAMES` or the validation will error. The contiguity check catches mismatches, but it's fragile to human error.
- Safe modification: When editing scene timing, always (1) update the `duration` and `start` values in `SCENES`, (2) update `TOTAL_DURATION_FRAMES`, (3) run `pnpm studio` to verify the error message clears (validation passes at module load). Do not rely on TypeScript to catch this — it won't.
- Test coverage: None — the validation is a runtime self-check, not a unit test.

**Webpack Alias Comment Synchronization:**
- Files: `remotion.config.ts:8–11` (comment), `tsconfig.json:5–9` (no mirror comment in tsconfig currently)
- Why fragile: The "keep this list in lockstep" comment exists only in `remotion.config.ts`. If someone edits `tsconfig.json` to add an alias and forgets to update `remotion.config.ts`, the comment in one file doesn't warn them about the other.
- Safe modification: Add a mirror comment to `tsconfig.json#compilerOptions.paths` ("keep these in lockstep with remotion.config.ts line X"). Better yet, create a shared config file or add a validation script to the lint workflow. Current mitigation: acceptance test (`pnpm lint` + `pnpm studio` success = aliases verified).
- Test coverage: None — synchronization is manual and comment-based.

**Stub Primitive Visibility During Preview:**
- Files: `tools/remotion/src/primitives/{Token,Span,Cursor,MetricBar,Chunk}.tsx`
- Why fragile: Stubs are marked with `data-stub` attributes and dashed borders, making them visually distinct in preview. However, if a developer forgets to fill in a stub, the incomplete component will render to the final MP4 unnoticed (unless they manually review the preview frame-by-frame or the QA process catches it).
- Safe modification: Before final render, visually review scenes 03-chunking and 05-comparison in `pnpm studio` and verify that all primitives are animated (not just dashed outlines). The `data-stub` attribute helps, but automation via a visual regression test would be stronger. For the pilot, manual review is sufficient.
- Test coverage: None — visual stubs are not caught by linting or type checking.

**Project-Specific Theme Override Coupling:**
- Files: `shared/theme/projects/cx-agent-evals.ts`, `tools/remotion/src/Root.tsx:4` (hardcoded import)
- Why fragile: Root.tsx hardcodes the import `from '@theme/projects/cx-agent-evals'`. Adding a second video would require modifying Root.tsx and composing with a conditional (e.g., based on Remotion's composition ID). There is no dynamic theme selection mechanism.
- Safe modification: When adding a second video, update Root.tsx to dynamically select the theme based on the composition ID or a query parameter. For now (single video), this is not a blocker, but it's a known limitation.
- Test coverage: None — theme selection is manual and hardcoded.

## Missing Critical Features

**Audio and Narration Pipeline:**
- Problem: The pilot video has no narration, background music, or sound design. Captions exist (`captions.ts`), but there is no mechanism to load, sync, or render audio.
- Blocks: Creating a finished product for YouTube distribution; audience comprehension (technical videos need narration).
- Deferred to: Phase 2 per spec §11. Planned: AI TTS (vendor TBD) or manual narration.

**Multi-Tool Composition / Timeline Assembly:**
- Problem: The studio currently has only one tool fully built (Remotion). Other tools (`ai-gen/`, `ffmpeg/`, `editor/`) are placeholder folders with READMEs. There is no mechanism to blend clips from multiple tools into a single output.
- Blocks: Advanced workflows (e.g., AI-generated backgrounds + Remotion motion graphics + external footage) or rapid assembly of multi-tool projects.
- Deferred to: Phase 3+ (beyond pilot scope). Will require a `timeline.json` schema and cross-tool orchestration.

**Cloud Rendering and Output Distribution:**
- Problem: Renders output to local `out/` directory only. No integration with cloud storage (R2, S3) or direct YouTube upload.
- Blocks: Distributed rendering (for long videos) or automated upload workflows.
- Deferred to: Phase 3+. Planned: ffmpeg phase includes cloud output routing.

**Formal Testing and CI:**
- Problem: No test suite (unit, integration, or E2E) or GitHub Actions workflow. Quality assurance relies on manual preview and visual review.
- Blocks: Regression detection, automated quality gates, or confidence in refactoring.
- Deferred to: Phase 2 per spec §11. Planned: vitest suite for primitives + scene logic, GitHub Actions to run render and validate MP4 dimensions/duration.

**Theme Sync Automation:**
- Problem: Per-project theme files are manually maintained. If a source repo's palette changes, the studio's theme file will drift without warning.
- Blocks: Keeping studio visuals aligned with source repo branding over time.
- Deferred to: Phase 2 per spec §11. Planned: script to pull palette from source repo and regenerate theme file.

## Test Coverage Gaps

**Primitive Component Animation:**
- What's not tested: Token, Span, Cursor, MetricBar reveal animations (when implemented) lack unit tests. Easing functions (fadeIn, slideIn, pulseDot, spanGlow) in `shared/theme/easings.ts` are defined but not unit-tested for correctness.
- Files: `tools/remotion/src/primitives/{Token,Span,Cursor,MetricBar,Chunk}.tsx`, `shared/theme/easings.ts`
- Risk: An animation easing function could break during refactoring (e.g., if `interpolate()` parameters are mistyped) and not be caught until preview/render.
- Priority: Medium — hold for Phase 2 testing plan.

**Scene Composition Integration:**
- What's not tested: Scenes (01-intro through 06-outro) are not validated for correct timing, caption text coverage, or visual correctness. The `frames.ts` contiguity check is a runtime validation but not a unit test.
- Files: `tools/remotion/src/compositions/chunk-vs-span/scenes/*.tsx`, `frames.ts:18–34`
- Risk: A developer could add a scene and forget to register it in the composition, or timing could drift without notice.
- Priority: Medium — snapshot or integration test would help.

**Theme Type Safety:**
- What's not tested: The `Theme` type and `ChunkIndex` union are not validated against actual theme object definitions. A missing color key in `cx-agent-evals.ts` would only be caught at runtime (if the primitive tries to access it).
- Files: `shared/theme/types.ts`, `shared/theme/projects/cx-agent-evals.ts`
- Risk: Low (TypeScript's strict mode catches most mismatches), but a per-project theme audit test would provide confidence.
- Priority: Low — TypeScript catches this already.

**Path Alias Resolution:**
- What's not tested: Webpack alias resolution is validated only by manual `pnpm studio` success. No test confirms both tsconfig and remotion.config have matching aliases.
- Files: `remotion.config.ts:12–23`, `tsconfig.json:5–9`
- Risk: Medium — drift between the two files could go unnoticed until render fails.
- Priority: Medium — add a simple Jest snapshot or bash validation script to the pre-commit hook.

**Render Output Validation:**
- What's not tested: No automated check validates that `pnpm render:chunk-vs-span` produces an MP4 with correct duration (90 frames = 3 seconds @ 30fps), dimensions (1920×1080), or codec (H.264).
- Files: Acceptance (manual observation of `out/cx-agent-evals--chunk-vs-span/v01.mp4`)
- Risk: Low (Remotion's renderer is battle-tested), but an ffprobe check would provide confidence for future videos.
- Priority: Low — defer to Phase 2 testing plan if regression testing becomes critical.

---

*Concerns audit: 2026-04-21*

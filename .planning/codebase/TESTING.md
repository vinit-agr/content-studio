# Testing Patterns

**Analysis Date:** 2026-04-21

## Test Framework

**Status:** No formal test framework configured

**Current State:**
- No Jest, Vitest, Playwright, or other test runner dependencies
- No `.test.ts`, `.spec.ts`, or `__tests__` directories in source code
- No test configuration files (jest.config.js, vitest.config.ts, etc.)
- No test scripts in `package.json` (only `typecheck`, `lint`, `format`)

**Package.json Scripts:**
```json
"scripts": {
  "studio": "remotion studio",
  "render:chunk-vs-span": "remotion render chunk-vs-span out/cx-agent-evals--chunk-vs-span/v01.mp4",
  "thumbnail:chunk-vs-span": "remotion still chunk-vs-span-thumbnail out/cx-agent-evals--chunk-vs-span/v01-thumb.png",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```

## Manual Verification Approach

**Studio Preview (Interactive Testing):**
- `pnpm studio` runs Remotion Studio server for real-time composition preview
- Allows visual inspection of animations, frame transitions, and timing
- Compositions defined in `tools/remotion/src/Root.tsx`

**Render Smoke Tests:**
- `pnpm render:chunk-vs-span` — renders full composition to MP4 video
- `pnpm thumbnail:chunk-vs-span` — renders still thumbnail image
- Output written to `out/` directory
- Provides end-to-end verification of rendering pipeline and codec settings

**TypeScript Validation:**
- `pnpm typecheck` runs `tsc --noEmit` to catch type errors without emitting files
- Strict TypeScript configuration (`tsconfig.base.json`):
  - `strict: true`
  - `noUncheckedIndexedAccess: true`
  - `noImplicitOverride: true`
  - `isolatedModules: true`

**Linting & Formatting:**
- `pnpm lint` runs ESLint with typescript-eslint
- `pnpm format:check` verifies Prettier compliance
- Catches conventions and style issues before manual testing

## Validation Strategy

**Layer 1 — Build-time (Immediate):**
- TypeScript compilation (`tsc --noEmit`) — type safety
- ESLint rules — code quality and conventions
- Prettier formatting — consistent style

**Layer 2 — Studio Preview (Developer):**
- Real-time animation preview in Remotion Studio
- Visual inspection of component rendering, transitions, and timing
- Manual frame-stepping and playback control

**Layer 3 — Smoke Render (Integration):**
- Full video render pipeline
- Validates Remotion CLI, bundling, and ffmpeg integration
- Detects runtime composition errors (e.g., missing dependencies, animation bugs)
- Output in `out/cx-agent-evals--chunk-vs-span/`

## Test Coverage Gaps

**Untested Areas:**
- Component isolation — No unit tests for primitives (TitleCard, Document, Chunk, etc.)
- Animation correctness — No automated checks for frame interpolation logic
- Scene timing — Manual verification only for SCENES constant contiguity (runtime self-check in `frames.ts`)
- Theme integration — No tests for ThemeContext provider or theme switching
- Data transformations — No tests for caption or frame calculation logic

**Files Without Coverage:**
- `tools/remotion/src/primitives/*.tsx` — All primitive components
- `tools/remotion/src/theme/ThemeContext.tsx` — Context provider
- `tools/remotion/src/compositions/chunk-vs-span/scenes/*.tsx` — Scene components
- `shared/theme/*.ts` — Theme utilities (colors, fonts, easings)
- `tools/remotion/src/compositions/chunk-vs-span/captions.ts` — Caption data
- `tools/remotion/src/compositions/chunk-vs-span/frames.ts` — Only has runtime self-check

## Runtime Self-Validation Example

`frames.ts` demonstrates validation at module load time:

```typescript
// Runtime self-check: scenes contiguous + sum to total.
const names = Object.keys(SCENES) as SceneName[];
let expectedStart = 0;
for (const name of names) {
  const { start, duration } = SCENES[name];
  if (start !== expectedStart) {
    throw new Error(
      `SCENES contiguity error: "${name}" starts at ${start}, expected ${expectedStart}`,
    );
  }
  expectedStart += duration;
}
if (expectedStart !== TOTAL_DURATION_FRAMES) {
  throw new Error(
    `SCENES duration mismatch: sum=${expectedStart}, TOTAL_DURATION_FRAMES=${TOTAL_DURATION_FRAMES}`,
  );
}
```

This pattern validates data invariants (contiguous scene timing) immediately when the module loads, failing fast if scenes are misconfigured.

## Current Testing Workflow

**For New Components:**
1. Create component with TypeScript props interface
2. Add component to `primitives/index.ts` barrel export with type export
3. Import and use in scene/composition
4. Run `pnpm studio` and preview in Remotion Studio
5. Inspect rendering, timing, and interaction with parent composition
6. Run `pnpm typecheck` to validate types
7. Run `pnpm lint` and `pnpm format:check` to catch style issues
8. Run `pnpm render:chunk-vs-span` to verify full pipeline

**For Animation Changes:**
1. Modify easing functions or frame calculations in component
2. Preview in Studio to verify visual result
3. Render smoke test to catch pipeline errors
4. Typecheck and lint for quality assurance

**For Data/Config Changes:**
1. Update configuration objects (SCENES, captions, theme colors)
2. Typecheck ensures type safety (const assertions prevent invalid edits)
3. Render smoke test validates consumption in compositions
4. Studio preview confirms visual impact

## No Current Best Practices for:
- Snapshot testing (no visual regression framework)
- Integration testing between components
- Performance benchmarking (frame timing, render duration)
- E2E testing of render pipeline
- Accessibility testing

---

*Testing analysis: 2026-04-21*

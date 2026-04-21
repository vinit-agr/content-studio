# Architecture

**Analysis Date:** 2026-04-21

## Pattern Overview

**Overall:** Component-driven, Remotion-based video composition pipeline with shared theming system.

**Key Characteristics:**
- Remotion studio for interactive development and batch rendering via CLI
- React components as the primary abstraction for motion graphics
- Centralized theme system providing colors, fonts, and animations to all compositions
- Scene-based composition structure with explicit timeline frames for synchronization
- Asset and data separation from rendering logic
- Multi-project support with per-project script/storyboard documentation

## Layers

**Rendering Layer (Remotion):**
- Purpose: Browser-based rendering engine via Remotion library (v4.0.450)
- Location: `tools/remotion/src/`
- Contains: Entry point, Root component, scene compositions, primitives, theme context
- Depends on: React, Remotion API, shared theme system
- Used by: Dev studio (`pnpm studio`) and CLI render commands (`pnpm render:chunk-vs-span`)

**Composition Layer:**
- Purpose: Define scene structure, timing, and content flow
- Location: `tools/remotion/src/compositions/`
- Contains: Top-level compositions (e.g., `chunk-vs-span`), scene sequence definitions, frame/duration mappings
- Depends on: Primitives, theme system, captions, shared assets
- Used by: Root component to register compositions with Remotion

**Scene Layer:**
- Purpose: Implement individual scenes with visual elements and animations
- Location: `tools/remotion/src/compositions/[composition]/scenes/`
- Contains: Named scene components (01-intro, 02-document, etc.) that compose primitives
- Depends on: Primitives, theme hooks, caption data
- Used by: Composition index to render in sequence

**Primitives (Reusable Components):**
- Purpose: Low-level visual elements (buttons, text, animations, shapes)
- Location: `tools/remotion/src/primitives/`
- Contains: Caption, Document, Chunk, Span, Token, MetricBar, Cursor, TitleCard
- Depends on: Remotion hooks (useCurrentFrame, interpolate), theme system
- Used by: Scene components

**Theme System:**
- Purpose: Centralized source of truth for colors, fonts, animations, project-specific overrides
- Location: `shared/theme/`
- Contains: Default color palette, typography, easing functions, type definitions, per-project themes
- Depends on: Remotion Google Fonts, project specifications
- Used by: All components via ThemeContext hook

**Data/Assets Layer:**
- Purpose: Static content (sample documents, project metadata)
- Location: `shared/assets/`
- Contains: Data files (sample-document.ts), binary assets (READMEs)
- Depends on: None
- Used by: Scene components

**Configuration Layer:**
- Purpose: Webpack aliases, codec settings, entry point registration
- Location: `remotion.config.ts`, `tsconfig.json`
- Contains: Path aliases (@shared, @theme, @primitives), video format settings, TypeScript paths
- Depends on: Node.js path utilities
- Used by: Build system at compile time

**Project Documentation:**
- Purpose: Per-project scripts, storyboards, creative notes
- Location: `projects/[project-name]/`
- Contains: script.md, storyboard.md, notes.md
- Depends on: None (tool-agnostic)
- Used by: Animators/editors for creative reference

## Data Flow

**Dev Studio (Interactive Preview):**

1. User runs `pnpm studio`
2. Remotion CLI loads `remotion.config.ts` and sets entry point to `tools/remotion/src/index.ts`
3. `index.ts` calls `registerRoot(Root)` with the Root component
4. `Root.tsx` registers compositions (chunk-vs-span, chunk-vs-span-thumbnail) with metadata (fps, duration, dimensions)
5. Browser loads studio UI at http://localhost:3000
6. User clicks a composition in the left sidebar
7. React component tree renders: Root → Composition → Sequence → Scenes → Primitives
8. Primitives use `useCurrentFrame()` hook to read current playhead position and animate accordingly
9. Theme system provides colors/fonts via ThemeContext hook
10. User edits a .ts/.tsx file → Hot module reload → Component re-renders in browser within ~1–2 seconds

**Batch Render (CLI):**

1. User runs `pnpm render:chunk-vs-span`
2. Remotion CLI loads config, sets entry point, compiles composition
3. Headless Chromium spins up and iterates through frames (0–2700 at 30fps for 90s video)
4. Each frame: composition renders React tree, captures to canvas, encodes to H.264
5. Output written to `out/cx-agent-evals--chunk-vs-span/v01.mp4`

**State Management:**

- **Frame-based state:** Remotion's `useCurrentFrame()` hook replaces Redux/useState — all animations derive from the global playhead position
- **Theme state:** React Context (ThemeProvider) wraps compositions to provide theme to all descendants
- **Composition state:** Declarative via JSX props; no runtime state mutations
- **Timeline state:** SCENES object in `frames.ts` is the single source of truth for scene boundaries and durations

## Key Abstractions

**Composition:**
- Purpose: Top-level Remotion registration; entry point for a video or still
- Examples: `ChunkVsSpan` (video), `ChunkVsSpanThumbnail` (still frame)
- Pattern: React functional component exported from `tools/remotion/src/compositions/[name]/index.tsx`
- Props: None (composition is self-contained); uses `useTheme()` to access colors
- Lifecycle: Registered once at startup; renders continuously as frames advance

**Scene:**
- Purpose: A logical segment of the composition with a time window
- Examples: IntroScene, DocumentScene, ChunkingScene
- Pattern: React functional component in `tools/remotion/src/compositions/[composition]/scenes/NN-[name].tsx`
- Props: None (derived from shared data)
- Lifecycle: Wrapped in `<Sequence>` with `from` and `durationInFrames` to control visibility window

**Primitive:**
- Purpose: Reusable visual element with animation capabilities
- Examples: Caption, Document, Chunk, Token, TitleCard
- Pattern: React functional component with typed props; uses `useCurrentFrame()` to animate
- Animation pattern: `interpolate(frame - offsetStart, [0, duration], [startValue, endValue], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })`
- Styling: Inline styles via theme-driven CSS-in-JS

**Theme:**
- Purpose: Design system for colors, typography, animations
- Pattern: TypeScript object satisfying `Theme` type; per-project overrides via spread operator
- Immutability: All theme values are `readonly` and `const` assertions prevent mutations
- Access: Components consume via `const theme = useTheme()` hook

**Frame Mapping:**
- Purpose: Declarative timeline structure with runtime self-checks
- Example: `SCENES` object in `frames.ts` defines scene start/duration
- Validation: Runtime check ensures scenes are contiguous and sum to total duration; throws Error if violated
- Usage: Scenes reference `SCENES[name].start` and `SCENES[name].duration`

## Entry Points

**Dev Studio:**
- Location: `tools/remotion/src/index.ts`
- Triggers: `pnpm studio`
- Responsibilities:
  1. Import Root component
  2. Call `registerRoot(Root)` to register with Remotion
  3. Remotion CLI/browser loads and runs Root
  4. Studio UI launches at http://localhost:3000

**Batch Render:**
- Location: `remotion.config.ts`
- Triggers: `pnpm render:chunk-vs-span` (calls Remotion CLI with composition ID)
- Responsibilities:
  1. Set entry point to `./tools/remotion/src/index.ts`
  2. Configure Webpack aliases (resolve @shared, @theme, @primitives)
  3. Set video codec (H.264), format (JPEG), dimensions/fps via Config API
  4. Remotion CLI renders composition and writes to `out/`

**Root Component:**
- Location: `tools/remotion/src/Root.tsx`
- Triggers: Called by Remotion once at startup
- Responsibilities:
  1. Load fonts via `loadFonts()`
  2. Define `withTheme` wrapper to inject theme into all compositions
  3. Register Composition and Still entries with metadata (id, fps, width, height, duration)
  4. Each composition wraps its component in theme provider

## Error Handling

**Strategy:** Validation at definition time (module load) and runtime checks with descriptive errors.

**Patterns:**
- **Scene contiguity check** (lines 18–34 in `frames.ts`): Runtime validation throws Error if scenes don't align or sum incorrectly — prevents silent timing bugs
- **Required props validation** (e.g., in Document.tsx line 28): Primitive throws Error if required prop (revealDurationFrames) is missing when reveal mode requires it
- **Theme type safety:** TypeScript enforces all theme values via `satisfies Theme` pattern — missing colors caught at compile time
- **Composition registration:** Remotion validates composition ID uniqueness and metadata (fps, dimensions) at startup

## Cross-Cutting Concerns

**Logging:** Not yet implemented. Console.log used for debugging in dev; production render silent.

**Validation:** 
- TypeScript strict mode enforces types at compile time
- Runtime checks (scene contiguity, required props) throw descriptive errors
- `satisfies` keyword ensures theme objects match schema without runtime overhead

**Authentication:** Not applicable (batch process, no user auth).

**Theme Injection:** ThemeProvider Context wraps Root, making theme available to all descendants via useTheme hook. Per-project overrides via spread operator and type safety via satisfies pattern.

**Timing/Synchronization:** Frame-based: all animations derive from global playhead position (useCurrentFrame). Scene boundaries defined in SCENES object prevent timing drift.

---

*Architecture analysis: 2026-04-21*

# Technology Stack

**Analysis Date:** 2026-04-21

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code; strict mode enabled via `tsconfig.base.json`
- JavaScript (ES2022) - Configuration files and build scripts
- JSX/TSX - React component syntax in `tools/remotion/src/`

**Secondary:**
- YAML - `pnpm-lock.yaml` for dependency management

## Runtime

**Environment:**
- Node.js 20+ (enforced via `engines.node` in `package.json`)
- Browser environment (headless Chromium via Remotion for rendering)

**Package Manager:**
- pnpm 9.12.0 (pinned in `package.json` via `packageManager` field)
- Lockfile: `pnpm-lock.yaml` (v9.0 format, present and committed)

## Frameworks

**Core:**
- Remotion 4.0.450 - Video composition and rendering engine
  - `@remotion/cli` - Command-line interface for studio and rendering
  - `@remotion/bundler` - Webpack-based bundling for compositions
  - `@remotion/renderer` - Headless rendering (outputs MP4 video)
  - `@remotion/google-fonts` - Web font integration (JetBrains Mono, etc.)

**UI/Component Framework:**
- React 18.3.1 - Component library for video compositions
- React DOM 18.3.1 - DOM rendering support

**Development/Build:**
- TypeScript 5.6.0+ - Static type checking and transpilation
- ESLint 9.0.0 with typescript-eslint 8.0.0 - Linting via flat config (`eslint.config.js`)
- Prettier 3.3.0 - Code formatting (config: `.prettierrc`)
- Webpack (managed by Remotion) - Module bundling

## Key Dependencies

**Critical (Runtime):**
- `remotion` 4.0.450 - Core video composition library
- `react` 18.3.1 - Component framework for Remotion compositions
- `react-dom` 18.3.1 - DOM adapter for React

**Infrastructure/Build:**
- `@remotion/cli` 4.0.450 - Studio dev server and CLI rendering
- `@remotion/bundler` 4.0.450 - Webpack integration for hot-reload
- `@remotion/renderer` 4.0.450 - Headless Chrome rendering pipeline
- `@remotion/google-fonts` 4.0.450 - Typography (JetBrains Mono primary)

**Platform-Specific:**
- Compositor binaries (pinned to 4.0.450 for each OS):
  - `@remotion/compositor-darwin-arm64` (macOS ARM64)
  - `@remotion/compositor-darwin-x64` (macOS Intel)
  - `@remotion/compositor-linux-arm64-gnu`, `linux-x64-gnu`, `linux-x64-musl` (Linux variants)
  - `@remotion/compositor-win32-x64-msvc` (Windows)
- Media utilities:
  - `@remotion/media-parser` - Video/audio metadata extraction
  - `@remotion/media-utils` - Playback utilities

## Configuration

**TypeScript:**
- Base config: `tsconfig.base.json` - Shared compiler settings (ES2022, strict, noUncheckedIndexedAccess, etc.)
- Root config: `tsconfig.json` - Extends base; adds path aliases (@shared/*, @theme/*, @primitives)
- Strict mode: `noUncheckedIndexedAccess: true`, `noImplicitOverride: true` enforced
- Module format: ESNext with bundler module resolution

**Remotion:**
- Config file: `remotion.config.ts` (CJS-compatible via Remotion's loader)
- Entry point: `./tools/remotion/src/index.ts`
- Video format: H.264 codec, JPEG image format
- Resolution: 1920×1080 for videos, 1280×720 for thumbnails
- Frame rate: 30 fps (set in Root.tsx and remotion.config.ts)
- Webpack alias overrides via `Config.overrideWebpackConfig()` to resolve `@shared`, `@theme`, `@primitives`

**Linting:**
- Config: `eslint.config.js` (flat config format)
- Base: `@typescript-eslint/recommended`
- Rules: Unused variable warnings with `argsIgnorePattern: '^_'`, `varsIgnorePattern: '^_'`
- Globals: Node.js and browser globals enabled
- Ignored: `out/`, `node_modules/`, `repo-references/`, `dist/`, `pnpm-lock.yaml`

**Formatting:**
- Config: `.prettierrc` (JSON)
- Semicolons: true
- Single quotes: true
- Trailing commas: all
- Print width: 100 characters
- Arrow parens: always
- Ignore file: `.prettierignore` (excludes `node_modules`, `out`, `repo-references`, `dist`, `pnpm-lock.yaml`, `LICENSE`)

**Git:**
- Ignore file: `.gitignore` - Excludes `out/`, `node_modules/`, `repo-references/`, `dist/`, `.DS_Store`, etc.

## Build & Runtime Commands

**Development:**
```bash
pnpm studio              # Start Remotion Studio dev server (localhost:3000)
pnpm typecheck           # Run TypeScript compiler (tsc --noEmit)
pnpm lint                # Run ESLint 9 flat config
pnpm format              # Run Prettier write
pnpm format:check        # Check format without modifying
```

**Rendering:**
```bash
pnpm render:chunk-vs-span         # Render chunk-vs-span composition to MP4
pnpm thumbnail:chunk-vs-span      # Render chunk-vs-span-thumbnail still image
```

All render outputs go to `out/` (gitignored).

## Path Aliases

Configured in `tsconfig.json` and mirrored in `remotion.config.ts` (via Webpack override):

- `@shared/*` → `shared/*`
- `@theme/*` → `shared/theme/*`
- `@primitives` → `tools/remotion/src/primitives/index`
- `@primitives/*` → `tools/remotion/src/primitives/*`

**Note:** Remotion's config loader converts `remotion.config.ts` to CommonJS; uses `path.resolve()` instead of `import.meta.url` for reliable alias resolution.

## Environment

No `.env` file required. All configuration is code-driven (tsconfig, remotion.config.ts, theme tokens). Rendering via Remotion CLI does not require external API keys or secrets.

## Dependencies Overrides

pnpm overrides force exact versions of all Remotion packages (4.0.450) to ensure consistent compositor binaries and avoid version conflicts:
- `@remotion/*` (10+ packages)
- `remotion` core

See `package.json` pnpm.overrides section for full list.

---

*Stack analysis: 2026-04-21*

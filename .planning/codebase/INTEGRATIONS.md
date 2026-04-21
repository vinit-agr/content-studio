# External Integrations

**Analysis Date:** 2026-04-21

## APIs & External Services

**None actively integrated.**

The current codebase is a standalone content production studio with no external API dependencies. All video composition, rendering, and asset management is self-contained.

## Data Storage

**Databases:**
- None. Not applicable to this codebase.

**File Storage:**
- **Local filesystem only**. All assets, compositions, and renders are stored locally:
  - Source compositions: `tools/remotion/src/`
  - Theme/design tokens: `shared/theme/`
  - Audio/images/video assets: `shared/assets/` (subdirectories: `audio/`, `images/`, `video/`)
  - Sample data: `shared/assets/data/sample-document.ts` (TypeScript constants)
  - Rendered outputs: `out/` (gitignored; contains MP4s and PNGs)
  - Project-specific files: `projects/<source-repo>--<video-slug>/`

**Asset Management:**
- Remotion CLI handles video/image imports directly from `shared/assets/`
- No CDN, cloud storage, or remote asset server configured
- Referenced repos cloned into `repo-references/` (gitignored) for Claude/human context only

**Caching:**
- None. Remotion caches compiled bundles in memory during studio session
- No Redis, Memcached, or persistent cache layer

## Authentication & Identity

**Auth Provider:**
- None. Not applicable.

**Implementation:**
- All code is local-only; no user authentication, API tokens, or session management

## Monitoring & Observability

**Error Tracking:**
- None configured. Remotion's CLI outputs errors to stdout/stderr during renders

**Logs:**
- Console/stdout logging: Standard for Remotion CLI
- Work log (human-readable): `log/` directory with dated markdown entries (e.g., `log/2026-04-20-pilot-kickoff.md`)
- Per-project iteration log: `log/projects/cx-agent-evals--chunk-vs-span.md`
- No structured logging, metrics, or observability platform

## CI/CD & Deployment

**Hosting:**
- Not applicable. This is a local content creation tool, not a deployable service.
- Renders are output to local `out/` directory for manual upload to video platforms (YouTube, etc.)

**CI Pipeline:**
- None configured. No GitHub Actions, GitLab CI, or similar
- Pre-commit hooks: Managed by `.claude/hooks/` (GSD framework hooks, external to this module)

**Build System:**
- Remotion's Webpack-based bundler (managed internally)
- No Docker, Kubernetes, or container-based builds

## Webhooks & Callbacks

**Incoming:**
- None. This is not a server application.

**Outgoing:**
- None. Video outputs are manually distributed (upload to YouTube, etc.)

## Environment Configuration

**Required env vars:**
- None. All configuration is code-based via:
  - `tsconfig.json`, `tsconfig.base.json` — TypeScript paths and compiler options
  - `remotion.config.ts` — Video resolution, codec, entry point, path aliases
  - `shared/theme/colors.ts` — Design tokens (palette, accent colors, chunk highlights)
  - `shared/theme/fonts.ts` — Typography configuration (JetBrains Mono via Google Fonts)
  - `shared/theme/easings.ts` — Animation curves
  - `shared/theme/projects/cx-agent-evals.ts` — Project-specific theme overrides

**Secrets location:**
- Not applicable. No API keys, database credentials, or secrets in this codebase.

## Content Sources

**External Repos (Reference Only):**
- `repo-references/` — Local clones of source repositories (gitignored)
  - Example: `repo-references/cx-agent-evals/` (cloned for human/Claude context when scripting videos)
  - Code in these repos is **not imported** into compositions; sample data is **copied** into `shared/assets/data/`
  - Purpose: Provide context for video scripting, not direct integration

**Fonts:**
- **Google Fonts** via `@remotion/google-fonts`
  - Primary: JetBrains Mono (loaded in `shared/theme/fonts.ts`)
  - Fallbacks: Fira Code, SF Mono (CSS fallbacks in component styles)
  - No external font files required; all loaded at render time

**Audio:**
- Local files only: `shared/assets/audio/` (for future narration, music, SFX)
- No streaming service, API, or external audio platform integration

## Future Tool Placeholders

These are planned but not yet implemented (as of 2026-04-21):

**AI Generation (tools/ai-gen/):**
- Planned integrations: Replicate, Google Veo, Nano Banana for AI-generated video/image clips
- Status: README placeholder only; no code yet

**FFmpeg (tools/ffmpeg/):**
- Planned: Video transcoding, stitching, and frame overlays
- Status: Placeholder folder; scripts/ and presets/ not yet created

**External Editor (tools/editor/):**
- Planned: Support for DaVinci Resolve and Adobe Premiere project files
- Status: Placeholder folder; no implementation

## How Compositions Are Rendered

**Rendering Pipeline (Remotion):**

1. **Studio Dev:** `pnpm studio` → Remotion Studio at localhost:3000 → hot-reload compositions via Webpack
2. **CLI Render:** `pnpm render:chunk-vs-span` → Remotion CLI → Webpack bundles composition → headless Chromium renders frames → FFmpeg encodes to H.264 MP4
3. **Still Render:** `pnpm thumbnail:chunk-vs-span` → Same pipeline but outputs single PNG frame

**No external dependencies in the render chain** — all tools (Chromium, FFmpeg) are vendored or bundled by Remotion.

## Example Integration Pattern for Future APIs

When integrating external services (e.g., AI image generation), the pattern would be:

1. Add SDK to `package.json` (e.g., `replicate`, `google-cloud-video`)
2. Create integration module in `tools/ai-gen/src/` (e.g., `ReplicateClient.ts`)
3. Export a factory function that accepts config (e.g., API key via env var)
4. Use in composition via `@shared/*` alias to ensure path resolution works in both Studio and CLI renders
5. Cache outputs locally to `shared/assets/` to avoid re-generating during iterative development

---

*Integration audit: 2026-04-21*

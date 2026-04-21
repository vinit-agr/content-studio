# content-studio

Standalone studio repo for producing videos and motion graphics — Remotion-first, tool-pluralist.

## Prerequisites

- **Node.js 20+** — check with `node --version`. Install via `nvm install 20` or Homebrew if needed.
- **Corepack** — ships with Node >=16. Enable once per machine: `corepack enable` (provisions pnpm automatically).
- **macOS / Linux** — Windows is untested.

## Setup

Clone the repo, then from the repo root:

```sh
corepack enable          # one-time, no-op if already enabled
pnpm install             # installs Remotion 4.x + full toolchain
```

The first install takes a few minutes (Remotion pulls a headless Chromium for rendering).

## Run the dev server (Remotion Studio)

```sh
pnpm studio
```

Remotion Studio boots at `http://localhost:3000` (or the next free port — it prints the URL) and auto-opens in your browser. The left sidebar shows two entries:

- **`chunk-vs-span`** — the 90-second pilot video (1920×1080, 30fps).
- **`chunk-vs-span-thumbnail`** — a single-frame still for the YouTube thumbnail (1280×720).

Click either to preview. Edits to any `.ts` / `.tsx` file hot-reload in the browser within a second or two. Stop the studio with `Ctrl-C`.

## Render the pilot

With the studio stopped (or from a second terminal), render from the CLI:

```sh
pnpm render:chunk-vs-span       # → out/cx-agent-evals--chunk-vs-span/v01.mp4  (H.264, ~5 MB)
pnpm thumbnail:chunk-vs-span    # → out/cx-agent-evals--chunk-vs-span/v01-thumb.png
```

Everything under `out/` is gitignored.

## Development commands

- `pnpm typecheck` — strict TypeScript (`tsc --noEmit`).
- `pnpm lint` — ESLint 9 flat config.
- `pnpm format` / `pnpm format:check` — Prettier.

Run all three before committing:

```sh
pnpm typecheck && pnpm lint && pnpm format:check
```

## Repo layout

- **`tools/remotion/`** — motion-graphics tool (fully built for day one).
- **`tools/{ai-gen,ffmpeg,editor}/`** — placeholder folders for future tools.
- **`shared/theme/`** — palette, fonts, easings — single source of truth. Per-project overrides live under `shared/theme/projects/`.
- **`shared/assets/`** — local-only binary assets (gitignored; READMEs tracked).
- **`projects/<source-repo>--<video-slug>/`** — tool-agnostic script, storyboard, notes per video.
- **`repo-references/`** — local clones of source repos the videos explain (gitignored; see `repo-references/README.md`).
- **`out/`** — rendered MP4s and thumbnails (gitignored).
- **`log/`** — dated work log + per-project iteration log.
- **`docs/superpowers/`** — design specs and implementation plans.

## Source repos

To script a video about a source repo, clone it into `repo-references/` — the folder is gitignored. See `repo-references/README.md` for expected clones.

## Design docs

- [Foundation design](docs/superpowers/specs/2026-04-20-content-studio-foundation-design.md)
- [Implementation plan](docs/superpowers/plans/2026-04-20-content-studio-foundation.md)
- [`HANDOFF.md`](./HANDOFF.md) — origin brief (historical).

## License

MIT — see [`LICENSE`](./LICENSE).

# content-studio

Standalone studio repo for producing videos and motion graphics — Remotion-first, tool-pluralist.

## What's here

- **`tools/remotion/`** — the motion-graphics tool, fully built for day one.
- **`tools/ai-gen/`, `tools/ffmpeg/`, `tools/editor/`** — placeholder folders for future tools.
- **`shared/theme/`** — palette + fonts + easings single source of truth. Per-project overrides live under `shared/theme/projects/`.
- **`shared/assets/`** — local-only binary assets (gitignored content, READMEs tracked).
- **`projects/<source-repo>--<video-slug>/`** — tool-agnostic script, storyboard, and notes per video.
- **`repo-references/`** — local clones of source repos the videos explain (gitignored; see `repo-references/README.md`).
- **`out/`** — rendered MP4s and thumbnails (gitignored).
- **`log/`** — dated work log + per-project iteration log.
- **`docs/superpowers/`** — design specs and implementation plans.

## Quick start

```sh
corepack enable
pnpm install
pnpm studio
```

Then open the printed URL. The `chunk-vs-span` composition previews the pilot.

## Render the pilot

```sh
pnpm render:chunk-vs-span
pnpm thumbnail:chunk-vs-span
```

Outputs land in `out/cx-agent-evals--chunk-vs-span/`.

## Development

- `pnpm typecheck` — strict TypeScript check.
- `pnpm lint` — ESLint 9 flat config.
- `pnpm format` / `pnpm format:check` — Prettier.

## Source repos

To script a video about a source repo, clone it into `repo-references/` — the folder is gitignored. See `repo-references/README.md` for the expected clone commands.

## Design docs

- [Foundation design](docs/superpowers/specs/2026-04-20-content-studio-foundation-design.md) — the decisions underlying this layout.
- [Implementation plan](docs/superpowers/plans/2026-04-20-content-studio-foundation.md) — task-by-task bootstrap.
- [`HANDOFF.md`](./HANDOFF.md) — origin brief (historical).

## License

MIT — see [`LICENSE`](./LICENSE).

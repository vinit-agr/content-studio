# Content Studio — Handoff Brief

A standalone Git repository for video / motion-graphics / AI-generated content production.
This document captures a brainstorm that started inside another repo (`cx-agent-evals`)
and is being moved into its own repo so the studio can serve any source project, not just one.

---

## How to use this file

1. **Create a new empty Git repo** somewhere outside `cx-agent-evals`, e.g. `~/Tars/Development/content-studio`.
2. **Copy this file** to the root of that repo as `HANDOFF.md` (or any name you prefer).
3. **Open Claude Code** in the new repo, with a fresh session (no prior context).
4. **Paste the prompt at the bottom of this file** ([Continuation prompt](#continuation-prompt-for-new-claude-session))
   into the new session. It will tell Claude to invoke the `superpowers:brainstorming` skill and
   pick up exactly where this conversation stopped.

The new session will **continue at "Open Questions"** below — all earlier decisions are locked in.

---

## What we're building

A personal **content studio** — a single repo that holds *all* tooling for producing videos
and motion-graphics content, designed to outlive any one source project.

- **Primary use case today:** producing technical/explainer videos for YouTube about ideas
  from various code repositories the user works on. First subject: the `cx-agent-evals` RAG
  evaluation system.
- **Long-term:** a mini studio. Remotion is just *one* tool. Future tools include FFmpeg
  (stitching/transcoding), AI image/video generators (Replicate, Google Veo, Nano Banana, etc.),
  and external video-editor project files (DaVinci Resolve / Premiere).
- **Reusable across source repos.** Each source project (cx-agent-evals, future projects) is
  cloned into a `repo-references/` folder so Claude has full code context when scripting videos
  about it. The studio itself stays single-repo, single-config.

---

## Decisions already made

These are **locked**. Don't re-litigate in the new session unless something concrete forces a change.

### 1. Video formats — both clip library and full videos
- Short reusable B-roll snippets (5–20s loops) AND full standalone explainer videos (1–3 min).
- The clip library feeds the full videos.

### 2. Audience and distribution
- **Primary:** technical developers, posted on the user's YouTube channel.
- **Format:** 16:9 landscape, 1920×1080.
- **Secondary (later):** product/marketing-oriented content.

### 3. Pilot video
- **Title (working):** "Chunk vs span: why character-level evaluation matters"
- **Length:** ~60–90 seconds
- **Source repo:** cx-agent-evals
- **Story arc:** animate a document → it gets chunked → show how chunk-level recall hides
  partial matches that span-level (character-span) evaluation catches. Compares both metrics
  on the same retrieval result.
- **Why this pilot:** small enough to validate the entire pipeline (composition → render →
  output → log), substantive enough to exercise theme tokens, primitives, and narration.

### 4. Repo strategy — standalone, not nested
- The studio is its **own Git repo**, not a folder inside `cx-agent-evals`.
- Source repos are pulled into `repo-references/` (gitignored) so the studio itself stays clean.
- The studio's name is provisional — `content-studio` is a working title; the user may rename.

### 5. Tooling philosophy — Remotion first, but tool-pluralist
- Remotion is the **first** tool, fully built out for the pilot.
- Other tools (`ai-gen/`, `ffmpeg/`, `editor/`) get **placeholder folders with READMEs only**
  on day one — the convention exists, but no code yet (YAGNI).
- Each tool is encapsulated; adding a new one is "make a new folder under `tools/`".

### 6. Folder structure (agreed)

```
content-studio/                # the new standalone repo
  README.md
  package.json                 # Remotion + supporting deps
  tsconfig.json
  remotion.config.ts           # 1920x1080, 30fps
  .gitignore                   # out/, node_modules/, repo-references/, ai-gen caches

  tools/                       # one folder per generation/processing tool
    remotion/                  # primary motion graphics — built now
      src/
        Root.tsx               # registers all compositions
        index.ts               # registerRoot(Root)
        theme/                 # imports from ../../shared/theme
        primitives/            # Document, Chunk, Span, Token, Caption, TitleCard, Cursor, MetricBar
        clips/                 # short reusable B-roll compositions
        compositions/          # full video compositions (one folder per video)
          chunk-vs-span/
            index.tsx
            scenes/            # 01-intro, 02-document, 03-chunking, 04-span, 05-comparison, 06-outro
            script.md          # narration script + scene timing
            notes.md           # design decisions for this video
            thumbnail.tsx      # 1280x720 YouTube thumbnail
    ai-gen/                    # placeholder — README only on day one
      README.md                # planned: replicate/, veo/, nano-banana/
    ffmpeg/                    # placeholder
      README.md                # planned: scripts/, presets/
    editor/                    # placeholder for external editor project files
      README.md                # planned: davinci/, premiere/

  shared/                      # cross-tool shared resources (single source of truth)
    theme/
      colors.ts                # palette tokens — see "Reference theme" below
      fonts.ts                 # JetBrains Mono via @remotion/google-fonts
      easings.ts               # motion curves matching cx-agent-evals frontend keyframes
    assets/
      fonts/                   # local font files if not using google-fonts
      audio/                   # narration, music, SFX
      images/                  # logos, icons, screenshots
      data/                    # sample document text used in animations

  projects/                    # one folder per video project — TOOL-AGNOSTIC
    cx-agent-evals--chunk-vs-span/    # naming: <source-repo>--<video-slug>
      script.md                # narration + scene timing
      storyboard.md            # shot-by-shot: which tool produces each shot
      timeline.json            # final assembly: clips + transitions for ffmpeg
      sources/                 # shot-level inputs (refs to tool outputs)
      thumbnail/               # YouTube thumbnail
      notes.md                 # decisions specific to this project

  repo-references/             # gitignored — external repos cloned here for Claude context
    .gitkeep
    README.md                  # explains: clone source repos here so Claude can read them
    cx-agent-evals/            # `git clone <url>` here when working on its videos

  out/                         # final renders (gitignored)
    cx-agent-evals--chunk-vs-span/
      v01.mp4
      v01-thumb.jpg

  log/                         # work log (committed)
    README.md                  # index, conventions
    2026-04-20-pilot-kickoff.md   # dated narrative entries
    projects/
      cx-agent-evals--chunk-vs-span.md   # per-project iteration log
```

**Key boundaries to preserve:**
- `projects/` is tool-agnostic. A project's `storyboard.md` can say "Scene 1 = Remotion comp X,
  Scene 2 = Veo clip Y, Scene 3 = Nano Banana image with caption overlay." `timeline.json`
  declares the final assembly; FFmpeg stitches it.
- `shared/theme/` is the single source of truth across tools — Remotion compositions, FFmpeg
  overlays, and AI-gen prompts all reference one palette so output looks consistent.
- The studio **never imports code from a referenced repo**. Code in `repo-references/` is for
  Claude/the human to read for context only. Sample data is *copied* into `shared/assets/data/`.

### 7. Workspace and packaging
- Single npm/pnpm package at the repo root. All tool deps go in one `package.json`.
- If a tool ever has heavy or conflicting deps, it can be promoted to a sub-package later.
- The Remotion config points to `tools/remotion/src/index.ts`.

---

## Reference: theme tokens to mirror (for cx-agent-evals videos)

The pilot video should match the cx-agent-evals frontend visual language so the video and the
app feel like the same brand. These come from
`packages/frontend/src/app/globals.css` in cx-agent-evals — `shared/theme/colors.ts` should
mirror them as TypeScript constants.

```ts
// shared/theme/colors.ts (target)
export const colors = {
  bg:            '#0c0c0f',
  bgElevated:    '#141419',
  bgSurface:     '#1a1a22',
  bgHover:       '#22222d',
  border:        '#2a2a36',
  borderBright:  '#3a3a4a',
  text:          '#e8e8ed',
  textMuted:     '#8888a0',
  textDim:       '#55556a',
  accent:        '#6ee7b7',  // mint green — primary brand color
  accentDim:     '#2d6b54',
  accentBright:  '#a7f3d0',
  warn:          '#fbbf24',
  error:         '#f87171',
  // chunk highlight colors (used to color individual chunks/spans)
  chunk1: '#6ee7b780',
  chunk2: '#818cf880',
  chunk3: '#fbbf2480',
  chunk4: '#f472b680',
  chunk5: '#38bdf880',
} as const;
```

**Typography:** JetBrains Mono (primary), with Fira Code / SF Mono as fallbacks. Display also
JetBrains Mono. Body text 13px @ line-height 1.6 in the app — videos can scale up.

**Existing keyframe animations in the app** (worth porting to `shared/theme/easings.ts` or as
primitive components):
- `fade-in` — 0.3s ease-out, opacity + translateY(6px → 0)
- `slide-in` — 0.25s ease-out, opacity + translateX(-8px → 0)
- `pulse-dot` — 1.4s ease-in-out infinite, opacity 0.4 ↔ 1.0
- `span-glow` — 2s ease-in-out, mint-green box-shadow flash

**Per-project theme overrides:** allowed. Each composition can override the base palette via
its own theme module. The cx-agent-evals theme is the default for cx-agent-evals videos.

---

## Pilot video brief — "Chunk vs span"

This is the founding storyboard sketch for the pilot. Refine in the new session.

**Goal:** explain to a technical-dev viewer why character-level (span) evaluation gives a more
honest signal than chunk-level for RAG retrieval quality.

**Rough scenes (~60–90s total):**
1. **Intro (5s):** title card "Chunk vs Span" with mint accent, dark bg, JetBrains Mono.
2. **The document (10s):** show a paragraph of text fading in, character by character or
   word by word.
3. **Chunking (15s):** the document splits into colored chunks (use chunk1–chunk5 palette),
   each with a chunk index label.
4. **The ground-truth span (10s):** a precise character span lights up across part of one
   chunk — narrate "the answer the user actually wants."
5. **Comparison (25–35s):** side-by-side metric bars. Left: "chunk-level recall = 1.0
   (this chunk was retrieved!)". Right: "span-level recall = 0.4 (only 40% of the answer
   characters were actually inside the retrieved chunk)". Animate the discrepancy.
6. **Outro (5–10s):** one-line takeaway + repo URL.

**Concepts the video assumes the viewer doesn't know yet:** chunking, retrieval,
recall/precision. Lean on visual metaphor, not jargon.

---

## Open questions

The new session should pick up here. **One question at a time, multiple-choice when possible.**

### Q5. `repo-references/` mechanism
How are external repos pulled into the studio for Claude/human context?

- **A. Plain `git clone` into a gitignored `repo-references/` folder.** Maximum simplicity.
  Each user / each machine clones independently. **Default recommendation.**
- **B. Git submodules.** Studio repo pins specific SHAs of external repos. Reproducible but
  adds the well-known submodule friction.
- **C. Git subtree.** Vendors external content into the studio repo. No external clone needed,
  but updates are manual subtree pulls.
- **D. A `repos.json` manifest** + a `pnpm refs:sync` script that shallow-clones each repo into
  `repo-references/`. Best of A and B; declarative without SHA tracking. Good graduation path
  if 5+ source repos eventually.

### Q6. Theme sync from referenced repo
For cx-agent-evals videos, `shared/theme/colors.ts` mirrors the frontend's `globals.css`. How
do they stay in sync?

- **A. Manual copy.** Update `colors.ts` by hand when the frontend palette changes. Trivial,
  drifts silently.
- **B. A `pnpm theme:sync cx-agent-evals` script** that reads `repo-references/cx-agent-evals/
  packages/frontend/src/app/globals.css` and regenerates `shared/theme/colors.ts`. Reproducible.
- **C. Per-project theme files** (`shared/theme/projects/cx-agent-evals.ts`) so each source
  repo gets its own palette module. Works well as you add more source projects.
- **D. Combine B + C.** Sync script writes per-project theme files. Recommended for the long run.

### Q7. Work-log format
Three options on the table:

- **A. Dated narrative entries** (`log/2026-04-20-pilot-kickoff.md`) PLUS per-project files
  (`log/projects/cx-agent-evals--chunk-vs-span.md`). Good chronology + good per-video story.
  **Default recommendation.**
- **B. Single rolling `CHANGELOG.md`.** One file. Loses per-project narrative.
- **C. Per-project only.** Loses cross-project chronology.

### Q8. Project naming convention
`projects/cx-agent-evals--chunk-vs-span/` uses `<source-repo>--<video-slug>`. Alternatives:

- **A. Keep as-is** — explicit source-repo prefix. Recommended.
- **B. Nest** — `projects/cx-agent-evals/chunk-vs-span/`. Cleaner if many videos per source repo.
- **C. Flat slug** — `projects/chunk-vs-span/`. Simpler when source repo is obvious from context.

### Q9. Audio / narration approach
For the pilot:

- **A. Recorded human voiceover** (the user records narration).
- **B. AI-generated narration** (e.g. ElevenLabs, OpenAI TTS).
- **C. Silent / on-screen captions only**, music bed only.
- **D. Decide later** — ship pilot with captions only, add narration in a follow-up render.

### Q10. Render output strategy
- Where do final MP4s go? (Local `out/` only, or also pushed to S3/Cloudflare R2 for sharing?)
- Codec defaults? (H.264 1080p30 is the safe pick for YouTube.)
- Thumbnails: rendered as a separate Remotion composition vs designed in Figma/Affinity?

### Q11. Initial dependencies to install
On approval of structure:
- `remotion`, `@remotion/cli`, `@remotion/google-fonts` (Remotion core)
- `react`, `react-dom`
- `typescript`, `@types/node`, `@types/react`
- (Later: `replicate`, `fluent-ffmpeg`, `@google/generative-ai` etc.)

Confirm before installing.

### Q12. Studio repo name
Working title: `content-studio`. Possible alternatives: `studio`, `motion`, `videos`,
`<username>-studio`. User to decide.

---

## What's NOT being moved into the studio

- The cx-agent-evals codebase itself stays where it is. The studio reads it via `repo-references/`.
- No CI/CD config moves. The studio gets its own minimal CI later if needed.
- No design assets from this repo are copied wholesale — only the theme tokens (above).

---

## Continuation prompt for new Claude session

Paste this verbatim into a fresh Claude Code session in the new content-studio repo:

> I'm starting a new content-studio repo for producing videos and motion graphics. There's a
> file at the root of this repo called `HANDOFF.md` that captures a brainstorm session from
> another repo where this idea originated. Please read it in full, then invoke the
> `superpowers:brainstorming` skill and continue the brainstorm from the "Open questions"
> section. All earlier decisions in the file are locked — don't re-litigate them. Start with
> Q5 (repo-references mechanism). Once all open questions are answered, write the design doc
> to `docs/superpowers/specs/YYYY-MM-DD-content-studio-foundation-design.md`, then transition
> to the writing-plans skill to produce the implementation plan. Use the project's CLAUDE.md
> conventions if any exist; otherwise default to standard pnpm + TypeScript + ESM.

---

## Provenance

- Brainstorm originated: 2026-04-20
- Source repo at time of brainstorm: cx-agent-evals (worktree branch `va_video_with_remotion`)
- Source frontend reference: `packages/frontend/src/app/globals.css`
- Brainstorming skill version: superpowers 5.0.7


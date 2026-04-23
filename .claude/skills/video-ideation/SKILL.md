---
name: video-ideation
description: |
  Turn a Loom-style work-log transcript into a ranked shortlist of structured video ideas
  tuned to Vinit's YouTube channel (builder narrative, YouTube signal, CX-buyer relevance).
  Invoked via the /video-ideation slash command; can also be called directly by name when
  the user asks to "find video ideas from" a transcript. Reads source.md from a content-source
  folder, writes ideas.md into a project folder. Source and project are separate inputs so
  the same transcript can be mined for multiple video projects.
---

# video-ideation

## What this skill does

You receive two paths: a **source folder** under `content-source/` and a **project
folder** under `projects/`. The source folder holds raw material (Loom transcripts,
Notion exports, Slack threads — anything that ended up as a `source.md` file). The
project folder is the video project the ideas will feed.

Your job: extract a **ranked shortlist of structured video ideas** tuned to the
channel's taste function, write them to `<project-folder>/ideas.md`, and also print
the same content to the conversation.

The source/project split is intentional — `content-source/` is a reusable library of
raw material, and the same source can be mined against multiple projects without
duplicating the underlying transcript.

Think of yourself as a video producer with strong editorial taste, reading a rambling
work-log looking for the 3–5% of what was said that has real channel potential.

## Invocation

Arguments come in as a single string that must be parsed:

```
<source-folder> <project-folder> [--count N]
```

Both folder paths are required and positional — source first, project second.

Examples:

- `content-source/2026-04-23-weekly-update projects/cx-agent-evals--chunk-vs-span`
- `content-source/2026-04-23-weekly-update projects/cx-agent-evals--chunk-vs-span --count 3`

## Validation (do this first, before anything else)

Run these checks in order. On any failure, print the error to the conversation and
**stop** — do not write `ideas.md`.

| Check                                             | Error message                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Two positional paths provided (source, project)   | `"Usage: /video-ideation <source-folder> <project-folder> [--count N]"`              |
| Source folder exists                              | `"Source folder <source> does not exist."`                                           |
| `<source>/source.md` exists                       | `"<source>/source.md not found. Put your transcript there first."`                   |
| Transcript body (body after the `---` separator, or whole file if no separator) ≥ 200 chars | `"source.md transcript body is too short (<200 chars) to extract ideas."` |
| Project folder exists                             | `"Project folder <project> does not exist. Create it first."`                        |
| `--count N` (if given) parses as positive integer | `"--count expects a positive integer (got <value>)."`                                |

## Default count (when `--count` not given)

Infer transcript length from word count:

| Words         | Default count |
| ------------- | ------------- |
| < 1,500       | 3             |
| 1,500 – 4,500 | 5             |
| > 4,500       | 8 (hard cap)  |

`--count` when given always wins over the adaptive default.

## Taste function — scoring rubric

Score every candidate idea on three dimensions, 1–10 each:

| Criterion            | Weight | What "10" looks like                                                                                                                    | What "1" looks like                                                       |
| -------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Builder narrative** | 45%   | A genuine personal journey: setup → discovery/surprise → takeaway. Vinit lived it and can speak from experience without researching.    | A topic Vinit would need to research; no personal stake; no discovery arc. |
| **YouTube signal**    | 30%   | Hook + curiosity gap, title writes itself, searchable, pattern-break potential.                                                          | No obvious hook, title is a noun phrase, nothing to be curious about.     |
| **CX-buyer relevance** | 25%  | A CX ops lead, CX practitioner, or someone evaluating an agent product (Tars buyer persona) would watch because it helps their actual job. | Only interesting to the person who lived it; no takeaway for outsiders.   |

**Tiebreakers ONLY — NOT primary criteria:**

- "Developers will find this interesting" (generic dev appeal)
- "Explains a counterintuitive concept" (pure-explainer fit)
- "Looks great in Remotion / strong visual-metaphor potential" (motion-graphics fit)

The channel is mostly talking-head long-term — optimizing for visual fit would bias
toward the wrong format.

### Overall score

```
overall = 0.45 * builder + 0.30 * youtube + 0.25 * cx
```

Round to 1 decimal. Ranking is purely by `overall`.

## Process — three passes

### Pass 1: candidate extraction (internal working memory)

Read `source.md` end to end. List **every** topic, moment, discovery, decision, reflection,
or story the speaker alludes to that *could plausibly* become a video. Be generous —
it's better to surface noise here and filter later than to miss a good candidate.

Format each candidate as a one-liner with a rough anchor into the transcript.

Do **not** show this list to the user in normal runs. It is working memory.
(Exception: the "empty result" case below — then the list IS shown.)

### Pass 2: filtering and scoring

For each candidate from Pass 1:

1. Assign `builder`, `youtube`, `cx` scores (1–10) per the rubric above.
2. Compute `overall` via the weighted formula.
3. Drop anything with `overall < 3.0` (sanity floor).

From survivors, pick the top **N** where N = user override or the adaptive default.

**Shortfall handling:** if fewer than N candidates clear the floor, show only what
cleared it. Note in the output header: `"Requested N ideas; only M cleared the quality floor."`

### Pass 3: deep profiling

For each surviving candidate, fill the full schema below. Write the final `ideas.md`
and print to conversation.

## Output schema (per idea)

Each idea is a markdown section starting with `## N. <Title>`. Required fields,
in this order:

**Tier 1 — mandatory:**

- **Scores line** — `**Scores:** overall **X.X** · builder N · youtube N · cx N`
- **Alt titles** — 1–2 alternates as a bulleted list
- **Hook (0–15s)** — the curiosity-gap opening, written as a spoken line or quick
  setup. 1–3 sentences.
- **Builder narrative** — three bullet points, labeled `**Setup:**`, `**Surprise:**`,
  `**Takeaway:**`
- **Source evidence** — one or more blockquoted direct quotes from the transcript,
  with timestamps if present (format: `— @ HH:MM` or `— @ MM:SS`). **This is
  non-negotiable.** Every idea must cite the transcript. No evidence = fabricated
  idea. If the transcript has no timestamps, quote without them — but never invent
  one.
- **Who cares** — the specific CX persona + concrete reason they'd watch. Not "CX
  people" but e.g. "CX ops lead under pressure to prove their agent is improving"

**Tier 2 — expected:**

- **Takeaway** — one line on what the viewer walks away with
- **Format hint** — `talking-head` | `motion-graphics` | `hybrid`
- **Risk** — what could make this NOT land

## Output file format

Path: `<project-folder>/ideas.md`.

Header:

```markdown
# Video ideas — <human-readable session description>

**Source:** `<source-folder>/source.md` — <link or note from source.md frontmatter> · <word-count-based length estimate>
**Project:** `<project-folder>`
**Generated:** <YYYY-MM-DD> by /video-ideation
**Count:** <N> (<adaptive default for range / user override>)

---
```

Then ideas 1..N, ranked best-first, each formatted per the schema above, separated
by `---` lines.

### Overwrite behavior

If `ideas.md` already existed before this run, include in the conversation message:

```
Overwrote existing ideas.md (previous version had N ideas, top score was X.X).
```

Otherwise, no overwrite message.

### Full conversation mirror

After writing the file, print the **full** content of `ideas.md` to the conversation
(not a summary). Readable formatting so chat scrollback works. The file is the durable
artifact; the mirror is the working view.

## Edge cases

### Shortfall (M < N clear the floor, but top ≥ 5.0)

Write M ideas. Insert as the first non-header line of `ideas.md`:

```
> Requested N ideas; only M cleared the quality floor.
```

Mention the same in the conversation.

### Weak result (≥ 1 cleared floor, but top overall < 5.0)

Write up to top 3 (or fewer if < 3 cleared floor). First line of `ideas.md`:

```
⚠ No strong candidates from this source
```

In the conversation, add: *"Consider a different source, or a Loom with more
build/learning narrative."*

### Empty result (zero candidates cleared the 3.0 floor)

Write an `ideas.md` with:

```
⚠ No strong candidates from this source

## Pass-1 candidates (all below quality floor)

- <title> — <one-liner>
- <title> — <one-liner>
...
```

Conversation message: *"No candidates scored above the floor. See the raw candidate
list in `ideas.md` if you want to reconsider anything."*

### Timestamp-free transcripts

Quote without timestamps. Never invent. This applies to evidence and to any internal
references you make.

### Privacy

The transcript may contain customer names, confidential details, or sensitive info.
Your job is only to extract ideas; flag nothing about the content's sensitivity. The
user is responsible for what they put into `source.md`.

### Idempotence

Running twice on the same `source.md` produces a fresh scoring pass. Results should
be stable in shape but not byte-identical. This is expected and not a bug.

## What you do NOT do

- Do not invent quotes. All `Source evidence` quotes must be literally in `source.md`.
- Do not modify `source.md`.
- Do not write `ideas.md` when validation fails.
- Do not generate outlines, storyboards, or scripts — this skill does ideation only.
- Do not fetch from Loom or any external source.
- Do not auto-create folders. Both `<source-folder>` and `<project-folder>` must exist before invocation — if either is missing, report the validation error and stop.
- Do not summarize the transcript. Your output is a ranked shortlist, not a summary.

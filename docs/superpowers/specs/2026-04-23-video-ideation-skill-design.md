# `video-ideation` Skill — Design

**Date:** 2026-04-23
**Status:** approved in chat — implementation plan to follow
**Author:** Vinit Agrawal (with Claude)
**Related:** [Content Studio foundation design](./2026-04-20-content-studio-foundation-design.md)

---

## 1. Goal

Ship a Claude Code skill — invoked via the slash command `/video-ideation` — that turns a single Loom-style work-log transcript into a **ranked shortlist of structured video ideas** tuned to Vinit's YouTube channel.

This is the first in a future pipeline (`ideation → outline → scripting`). Only ideation is in scope for v1.

Success looks like: drop a transcript into a new `projects/<YYYY-MM-DD>-<loom-slug>/source.md`, run `/video-ideation <path>`, review a `projects/<YYYY-MM-DD>-<loom-slug>/ideas.md` containing 3–8 scored ideas with evidence quotes, and walk away knowing which one (if any) deserves to become a real video project.

## 2. Non-Goals (v1)

- Outline generation, script generation, storyboard generation — future skills.
- Sources other than Loom-style work-log transcripts (call transcripts, raw notes, email, meeting minutes, etc.).
- YouTube Data API / vidIQ / web-search / competitive lookups — user can paste external signals into the ideation output manually if desired.
- Taste calibration across sessions (skill "learns" from which ideas you pick).
- Auto-creating a `projects/<source-repo>--<video-slug>/` folder when an idea is selected.
- Any UI, dashboard, or non-terminal interface.
- Non-English transcripts.

See §10 (Scope Fence) for the full deferred list.

## 3. Resolved Questions (from brainstorm)

| #   | Topic                            | Decision                                                                                                              |
| --- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Q1  | Skill scope                      | **D** — start with ideation only; outline/scripting are future skills.                                                 |
| Q2  | Taste function                   | Builder-narrative > YouTube-signal > CX-buyer resonance. Explicit audience: CX practitioners and buyers (Tars persona). |
| Q3  | Output shape                     | **B** — structured ranked shortlist. Each idea is a deeply profiled object.                                            |
| Q4  | Schema tier                      | **Tier 1 + Tier 2.** Tier 3 deferred.                                                                                 |
| Q5  | I/O model                        | **C** — hybrid input (file path), persistent file output, results mirrored in conversation.                           |
| Q5b | Output location                  | Per-session folder under `projects/<YYYY-MM-DD>-<loom-slug>/`, not a shared `log/` tree.                              |
| Q6a | Default idea count               | Adaptive: 3 (<10m), 5 (10–30m), 8 (>30m, cap). User override wins.                                                    |
| Q6b | Skill location                   | `.claude/skills/video-ideation/SKILL.md` — project-local, not vendored, not in `skills-lock.json`.                    |
| Q6c | Invocation                       | Slash command `/video-ideation` at `.claude/commands/video-ideation.md` wrapping the skill.                           |
| Q6d | Transcript source                | User creates `source.md` in the session folder with Loom link at top + transcript body.                               |
| Q6e | Scoring aggregation              | Weighted mean — Builder 45%, YouTube 30%, CX 25%. Rounded to 1 decimal.                                               |
| Q6f | Empty-result behavior            | Skill says "no strong candidates, top weak ideas below" rather than forcing N polished-looking bad ideas.              |

## 4. Taste Function

The skill scores every idea on three dimensions. These are encoded verbatim in `SKILL.md` so the model scores consistently.

| Criterion            | Weight | What it measures                                                                                                                       |
| -------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Builder narrative    | 45%    | Is there a genuine journey / discovery / surprise Vinit can authentically tell from personal experience? Not a topic he'd need to research. |
| YouTube signal       | 30%    | Hook, curiosity gap, title-writes-itself, searchability, pattern-break potential.                                                       |
| CX-buyer relevance   | 25%    | Would a CX ops lead, CX practitioner, or someone evaluating an agent-product (the Tars buyer persona) actually watch and care?           |

**Tiebreakers only, NOT primary criteria:**

- Generic "developers will find this interesting"
- "Explains a counterintuitive concept"
- "Looks great in Remotion / strong visual-metaphor potential"

Explicitly deprioritizing visual-metaphor fit is a design choice: the channel is mostly talking-head long-term, so optimizing for motion-graphics-friendliness would bias the skill toward the wrong format.

## 5. Idea Object Schema

Each idea in `ideas.md` is written as a markdown section with a consistent structure. The example in §8 is the canonical shape.

**Tier 1 — mandatory (trust + usefulness):**

- `title` — draft YouTube title (clickable, not a summary).
- `alt_titles` — 1–2 alternates.
- `hook` — the first 10–15 seconds of the video. The curiosity-gap opening. Written as a spoken line or quick setup.
- `builder_narrative` — the arc being told: **setup → surprise/discovery → takeaway**. Three bullet points.
- `source_evidence` — one or more direct quotes from the transcript that support this idea, with rough timestamps if the transcript has them. **Non-negotiable** — without this the output cannot be trusted.
- `who_cares` — the specific CX persona + *why* they'd watch. Concrete, not "CX people."
- `scores` — `{ builder: 1–10, youtube: 1–10, cx: 1–10, overall: weighted mean to 1 decimal }`. Conceptually a 4-field object; rendered inline in `ideas.md` as `**Scores:** overall X.X · builder N · youtube N · cx N`.

**Tier 2 — expected:**

- `takeaway` — one line on what the viewer walks away with.
- `format_hint` — one of: `talking-head` | `motion-graphics` | `hybrid`.
- `risk` — what could make this NOT land (e.g. "only works if viewer already knows X," "too insider for general CX audience," "would require sharing customer data").

**Tier 3 — deferred to v2:** `estimated_length`, `thumbnail_concept`, `search_terms`.

## 6. Skill Contract

### 6.1 Invocation

```
/video-ideation <path-to-session-folder>
/video-ideation <path-to-session-folder> --count N
```

Examples:

```
/video-ideation projects/2026-04-23-weekly-update
/video-ideation projects/2026-04-23-weekly-update --count 3
```

The argument is the **session folder**, not the source file. The skill derives `source.md` and `ideas.md` paths from it.

### 6.2 Adaptive default count

The skill infers transcript length (word count or timestamp range) and picks a default:

| Transcript length | Default count |
| ----------------- | ------------- |
| < ~1,500 words (~10 min @ 150 wpm) | 3 |
| 1,500–4,500 words (10–30 min)      | 5 |
| > 4,500 words (>30 min)            | 8 (hard cap) |

`--count` always wins over the adaptive default.

### 6.3 Input file

Path: `<session-folder>/source.md`

Expected shape:

```markdown
# <Loom title or short description>

**Loom:** https://loom.com/share/<id>  (or `recorded 2026-04-23, 17min` if no link)

---

<transcript body — paste of Loom/Otter/Whisper output, with or without timestamps>
```

The skill reads `source.md` directly. It does NOT fetch from Loom.

**Transcript format tolerance:** The skill accepts transcripts with any of:
- Per-speaker timestamps (`[00:08:42] Vinit: ...`)
- Inline timestamps (`(08:42) ...`)
- No timestamps at all (raw prose)

When timestamps are present, quote-level evidence cites them (`— @ 08:42`). When absent, evidence quotes stand alone without timestamps. The skill never invents timestamps.

**Validation — all in the skill (one place for rules):**

| Check                                             | Behavior on failure                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Session folder exists                             | Error: `"Session folder <path> does not exist."`                                    |
| `source.md` exists in session folder              | Error: `"<path>/source.md not found. Create it with your Loom transcript first."`  |
| `source.md` transcript body has ≥200 chars        | Error: `"source.md transcript body is too short (<200 chars) to extract ideas."`   |
| `--count N` parses as positive integer (if given) | Error: `"--count expects a positive integer (got <value>)."`                       |

All errors write only to the conversation. The skill does NOT write a broken `ideas.md`. The slash command is a thin wrapper that passes `$ARGUMENTS` to the skill verbatim — no command-level validation.

**Privacy note:** The skill reads whatever is in `source.md`. Customer names, confidential product details, or other sensitive content in the transcript flow into the output and eventually land in `ideas.md` on disk. Scrubbing before paste is the user's responsibility.

### 6.4 Output file

Path: `<session-folder>/ideas.md`

Overwrites any existing `ideas.md`. If (and only if) a previous `ideas.md` was present, the skill prints to the conversation: `"Overwrote existing ideas.md (previous version had N ideas, top score was X.X)."` On a fresh run with no prior file, no overwrite message is printed.

Output is also mirrored in full to the conversation so the user can read it inline without switching contexts.

### 6.5 Floor, shortfall, and weak-result behavior

Three distinct cases, in order of severity:

| Case | Trigger | Behavior |
| ---- | ------- | -------- |
| **Shortfall** | Floor-survivors count M < requested N, but top score ≥ 5.0 | Write M ideas. Conversation + file header note: `"Requested N ideas; only M cleared the quality floor."` |
| **Weak result** | At least 1 idea clears the 3.0 floor, but top score < 5.0 | Write top 3 (or fewer if <3 cleared). Add `⚠ No strong candidates from this source` as the first line of `ideas.md`. In conversation, suggest: "Consider a different source, or a Loom with more build/learning narrative." |
| **Empty result** | Zero ideas clear the 3.0 floor | Write an `ideas.md` containing only the `⚠` header + raw Pass-1 candidate list (title + one-liner per candidate, no scoring). Conversation message: "No candidates scored above the floor. See the raw candidate list in `ideas.md` if you want to reconsider anything." |

In all three cases, `ideas.md` is written — never left missing. The `⚠` marker is the signal that the file needs user judgment rather than trust.

This avoids the failure mode of producing N polished-looking ideas that are all bad.

### 6.6 Rerun semantics

- `ideas.md` is overwritten on rerun.
- Scoring is not cached — rerunning the skill on the same `source.md` produces a fresh pass. Results should be stable in shape but not byte-identical (this is expected and not a bug).
- `source.md` is never modified by the skill.

## 7. Files This Build Creates

```
.claude/
  commands/
    video-ideation.md                # slash-command prompt
  skills/
    video-ideation/
      SKILL.md                        # full skill instructions (taste function, schema, process)
```

**No changes to:**
- `skills-lock.json` — this is a project-local skill, not vendored.
- `.claude/skills/remotion-best-practices` — untouched.
- `CLAUDE.md` — no new workflow section; the skill catalog self-documents.
- `.gitignore` — `source.md` and `ideas.md` are committed by default. The existing `projects/<source>--<slug>/` convention commits `script.md` / `storyboard.md` / `notes.md`; ideation outputs follow the same rule. If a specific Loom is private, the user manually `.gitignore`s that session folder.

### 7.1 `.claude/commands/video-ideation.md` shape

A Claude Code slash command is a markdown file with YAML frontmatter (`description`) + a prompt body. `$ARGUMENTS` interpolates whatever the user typed after the slash-command name.

```yaml
---
description: Generate a ranked shortlist of video ideas from a Loom transcript in a session folder.
---
```

The prompt body is intentionally minimal — the command exists only so there's a discoverable `/video-ideation` entry point. It tells Claude to invoke the `Skill` tool with `skill: video-ideation` and pass `$ARGUMENTS` through as the skill's `args`. The skill itself handles parsing, validation, and everything else.

This keeps all logic in one place (`SKILL.md`) and the command stays a thin trigger.

### 7.2 `.claude/skills/video-ideation/SKILL.md` shape

A Claude Code skill is a markdown file with YAML frontmatter + body. The frontmatter determines auto-discovery and trigger phrases:

```yaml
---
name: video-ideation
description: |
  Turn a Loom-style work-log transcript into a ranked shortlist of structured video ideas
  tuned to Vinit's YouTube channel (builder narrative, YouTube signal, CX-buyer relevance).
  Invoked via the /video-ideation slash command; can also be called directly by name when
  the user asks to "find video ideas from" a transcript. Reads source.md from a session
  folder, writes ideas.md alongside it.
---
```

The body encodes, in order:

1. **Persona & taste function** — the three criteria and weights from §4, stated explicitly so the model scores consistently across runs.
2. **Process — three passes:**
   - **Pass 1 — candidate extraction.** Read `source.md` end to end. List every topic, moment, discovery, or story the speaker alludes to that *could* become a video. Be generous here; noise is fine. Output a terse internal list (working memory, not shown to user).
   - **Pass 2 — filtering and scoring.** Score each candidate against the three criteria. Drop anything with `overall < 3.0` (sanity floor). From the survivors, pick the top N (adaptive default or user-override). Shortfall / weak-result / empty-result behavior per §6.5.
   - **Pass 3 — deep profiling.** For each surviving candidate, fill the full Tier 1 + Tier 2 schema.
3. **Output format** — markdown template matching the example in §8. The same content is written to `ideas.md` AND printed to the conversation (not a summary — the full file contents, readably formatted so chat scrollback works).
4. **Edge cases** — missing source, source too short, timestamp-free transcripts, shortfall / weak / empty results.

## 8. Example Output

```markdown
# Video ideas — 2026-04-23 weekly work update

**Source:** [Loom](https://loom.com/share/abc123) · pasted transcript (~17 min)
**Generated:** 2026-04-23 by /video-ideation
**Count:** 5 (adaptive default for 10–30 min range)

---

## 1. Why our "100% accurate" retrieval was actually wrong

**Scores:** overall **8.4** · builder 9 · youtube 8 · cx 8

**Alt titles:**
- The recall-1.0 lie
- How we caught our RAG agent cheating

**Hook (0–15s):** Every dashboard said our support agent retrieved the right chunk. Every user said they got the wrong answer. Both were correct.

**Builder narrative:**
- **Setup:** We were measuring chunk-level recall and shipping with confidence.
- **Surprise:** A customer showed us three cases where the "right chunk" included mostly unrelated text — chunk recall was 1.0, but the useful character span was only 40% of it.
- **Takeaway:** Chunk-level recall is a vanity metric for RAG; span-level is the honest signal. We're moving our eval over.

**Source evidence:**
> "I was talking about how chunk-level recall gives you a 1.0 score but doesn't tell you what fraction of the actual answer you retrieved — that's the thing that bit us." — @ 08:42
> "We had three production cases where the right chunk had like 60% filler." — @ 10:15

**Who cares:** CX ops leads whose team has been asked to prove their AI support agent is actually improving — they need a scoring framework that doesn't flatter their model. Anyone evaluating an agent product (including Tars buyers) needs this framing before running a POC.

**Takeaway:** Trust span-level recall, not chunk-level. The vanity metric is hiding real regressions.

**Format hint:** motion-graphics (the 1.0 → 0.4 comparison is visually load-bearing; chunk-vs-span video already proves this)

**Risk:** Only lands if viewer already has a mental model of chunking + retrieval. May need a 10s primer at the top.

---

## 2. ...
```

## 9. Implementation Outline

Rough plan (details live in the implementation plan doc, not here):

1. Draft `.claude/skills/video-ideation/SKILL.md` — consult the `skill-creator` skill for frontmatter + structural guidance, but author the taste function / process / edge cases inline per §4 and §7.2 of this spec.
2. Create `.claude/commands/video-ideation.md` as the thin slash-command wrapper per §7.1.
3. **Test input preparation.** Create a deliberately-crafted sample transcript at `projects/_test-ideation/source.md` — a hand-written 1,500-ish-word fake work-log monologue that intentionally contains: 2 clearly video-worthy moments (discovery + surprise), 3 mundane status items, and 1 borderline case. This lets us verify the skill finds the 2, ignores the 3, and scores the borderline case reasonably.
4. **Smoke-test run.** Invoke `/video-ideation projects/_test-ideation`. Verify `ideas.md` is written and conversation mirror matches file.
5. **Iterate on `SKILL.md`** until the smoke test meets these v1 acceptance criteria:
    - The 2 planted video-worthy moments both appear in the top 3 ideas.
    - Every surfaced idea has at least one non-empty `source_evidence` quote pulled from the sample transcript (not paraphrased, not invented).
    - Scores differentiate: not every idea scores within 0.5 of every other.
    - The 3 mundane status items do not appear in the top-N ranked ideas.
    - Output is valid markdown and the example in §8 is a good shape match.
6. **Real-world run.** User provides a real Loom transcript in a fresh session folder. Success criterion for v1 is **skill correctness, not source quality** — if the real Loom is boring, the skill should honestly say so (per §6.5 weak/empty-result behavior) rather than manufacture good-looking bad ideas. v1 ships when:
    - The skill runs end-to-end on the real transcript without errors.
    - `ideas.md` is produced with the §8 structural shape.
    - All surfaced ideas have evidence quotes that genuinely appear in the transcript.
    - The user agrees the scoring is directionally honest (even if they don't love any idea).
    Once shipped, throwaway-delete `projects/_test-ideation/`.

## 10. Scope Fence (Deferred)

Parked for future work, deliberately out of v1:

- **`/video-outline`** — takes a picked idea, produces a scene-by-scene outline.
- **`/video-scripting`** — takes an outline, produces the full `script.md` / `storyboard.md` / `notes.md` trio in a new `projects/<source-repo>--<slug>/` folder.
- **Multi-source support** — call transcripts, raw notes, GitHub activity, meeting minutes.
- **External signals** — YouTube Data API for competitive analysis, vidIQ for channel insights, web-search for "is this idea already covered."
- **Taste calibration** — skill remembers which ideas the user picked vs skipped across sessions and biases future scoring.
- **Auto-graduation** — picking an idea auto-spawns a `projects/<source-repo>--<slug>/` folder stub.
- **Non-English transcripts.**
- **Rerun diffing** — compare today's `ideas.md` against yesterday's to track which ideas persist / gain / fade.

---

*Post-brainstorm status: design approved in chat on 2026-04-23; implementation plan to follow via `/finish-planning`.*

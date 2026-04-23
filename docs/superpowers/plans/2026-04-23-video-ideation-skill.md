# `video-ideation` Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Claude Code skill (`video-ideation`) and matching slash command (`/video-ideation`) that turns a Loom-style work-log transcript into a ranked shortlist of structured video ideas, validated by a deliberately-crafted test fixture before real-world use.

**Architecture:** Two Markdown artifacts under `.claude/`: a thin slash-command wrapper (`.claude/commands/video-ideation.md`) that passes `$ARGUMENTS` to the skill, and a full skill (`.claude/skills/video-ideation/SKILL.md`) that encodes the taste function, three-pass process, schema, and edge-case handling. A temporary test fixture under `projects/_test-ideation/` contains a crafted transcript with known video-worthy and mundane items to verify the skill discriminates correctly. The fixture is deleted after v1 acceptance.

**Tech Stack:** Markdown with YAML frontmatter. No code, no tests-as-code, no dependencies. "Testing" is running `/video-ideation` on the crafted fixture and checking output against the acceptance criteria from the spec §9 step 5.

**Spec:** [`docs/superpowers/specs/2026-04-23-video-ideation-skill-design.md`](../specs/2026-04-23-video-ideation-skill-design.md)

---

## File Structure

New files created by this plan:

| Path | Responsibility | Lifetime |
| ---- | -------------- | -------- |
| `.claude/skills/video-ideation/SKILL.md` | Skill definition — taste function, three-pass process, schema, output format, edge cases. Frontmatter makes it discoverable. | Permanent |
| `.claude/commands/video-ideation.md` | Slash-command trigger. Minimal prompt that invokes the skill with `$ARGUMENTS`. | Permanent |
| `projects/_test-ideation/source.md` | Crafted sample transcript with 2 video-worthy moments, 3 mundane items, 1 borderline case (~1100 words, falls in the "< 1,500 words → default count 3" adaptive bucket). Used to verify v1 acceptance. | Deleted after Task 7 |
| `projects/_test-ideation/ideas.md` | Skill output from smoke-test runs. Regenerated on each run. | Deleted after Task 7 (with parent folder) |

No existing files are modified.

**Commit sequence:** Each task ends with a single focused commit. Iteration loops inside Task 4 produce one commit per skill revision.

---

## Task 1: Create the Test Fixture

Purpose: write the "test input" — a deliberately-crafted Loom-style transcript with known video-worthy moments, so we have a deterministic target for verifying the skill behaves correctly.

**Files:**
- Create: `projects/_test-ideation/source.md`

- [ ] **Step 1: Create the test-fixture folder**

```bash
mkdir -p projects/_test-ideation
```

- [ ] **Step 2: Write the crafted transcript**

Write the following to `projects/_test-ideation/source.md`. This is ~1100 words (falls in the "default count 3" adaptive bucket, so top 3 = all ideas). It contains:
- 2 video-worthy moments: (i) "chunk-vs-span eval discovery" (rich builder narrative + CX relevance + YT hook); (ii) "prompt-drift canary suite" (rich builder narrative + CX relevance + YT hook)
- 3 mundane status items: dependency bumps, a flaky-test fix, a 1:1 meeting summary
- 1 borderline case: a customer POC with mixed results

Content:

```markdown
# Test fixture — fake work-log monologue

**Loom:** (fixture — no real recording)
**Recorded:** 2026-04-18, ~17 min

---

[00:00] Okay, recording. Weekly log, Friday the 18th. Let me just talk through
what I worked on this week, roughly in order.

[00:12] The big thing — and I want to come back to this because I'm still
processing it — is the eval stuff. So a couple weeks ago we noticed our
dashboards were showing recall of 1.0 on the retrieval step for our support
agent. Like literally, every query was hitting the right chunk. And yet, at
the same time, we had three customers open tickets saying the agent was
giving wrong answers. Both things could not be true at the same time, and it
took me way longer than it should have to figure out why.

[01:45] What I eventually worked out is this: chunk-level recall just tells
you whether the "right chunk" was in the retrieved set. But it says nothing
about whether the actual answer — the specific character span the user needs
— is a meaningful portion of that chunk. So we had chunks that were like
800 tokens long, and the useful answer span was maybe 60 tokens of that.
Span-level recall in that case is like 0.075, not 1.0. The dashboard was
lying to us. Or we were lying to ourselves, depending how you look at it.

[03:10] I spent most of Tuesday and Wednesday rebuilding the eval to score
span-level overlap. It's honestly not complicated — it's just character-level
set intersection — but what was interesting is that once we ran the whole
test set through the new scorer, our "93% recall" system dropped to 41%
span-level recall. And that 41% number actually matched what customers were
telling us. It's the honest number.

[04:30] I think this is something more people in CX should know about.
Every vendor in this space quotes chunk-level retrieval numbers in their
pitch decks and it's effectively a vanity metric. If someone's evaluating
a support-agent product, they need to know to ask for span-level recall
specifically. Otherwise they're buying on a number that doesn't correlate
with what their users experience. Like, that's the whole thing — the thing
you're measuring is whether the customer gets their answer, not whether your
retriever found a document with the answer somewhere in it.

[06:00] Anyway. The other big thing was — related but different — we started
noticing our agent's answer quality was degrading over time. Not a huge
amount. Like, maybe a 3-5% drop in our internal quality score over a month.
And this is with the same model, same prompt template, same retrieval
system. Nothing had changed, allegedly. Except something had changed,
obviously, because the numbers were dropping.

[07:20] So I set up this thing — I'm calling it a canary suite — where we
run the same 50 representative queries through the agent every morning and
diff the responses against the previous day's baseline. What I found is
pretty funny actually. The "nothing had changed" was wrong. Our knowledge
base grew by like 12% in that month. New documents were added. And as the
index grew, the retriever started picking up these slightly-less-relevant
chunks that were semantically close enough to pass the retrieval threshold
but were actually pulling the generation off-topic.

[09:05] The insight for me was: a stable model doesn't guarantee a stable
agent. The corpus is part of the system. And you only catch this drift if
you run deterministic evals continuously — not just when you ship a model
change. I think this is a really under-discussed problem in applied LLM
systems. Everyone tests on fixed datasets when they deploy; almost nobody
runs the same test every day.

[10:40] Other things this week — this is just housekeeping. We bumped our
dependency versions across the backend. Pretty standard. Pydantic 2.4
something, some FastAPI patches. Nothing exciting. Took me about half a
morning.

[11:10] Also fixed a flaky test in the ingest pipeline. It was failing
maybe one in twelve runs because of a race condition in how we were polling
for the embeddings to complete. Added a proper await. Yeah, nothing to see
there.

[11:50] Had a 1:1 with Priya about Q2 priorities on Thursday. We talked
about the roadmap, the new enterprise deal, the hiring plan. Good
conversation. Nothing video-worthy obviously — it's internal.

[12:45] Oh, one more thing that's maybe interesting, maybe not. We ran a
POC with a mid-market CX team this week. They were trying our agent
against their existing system. The results were — honestly — mixed. On
simple FAQ questions we won clearly. On more nuanced multi-turn
conversations, we were roughly tied. On cases where the user was asking
something that required combining info from multiple docs, they actually
beat us. I don't know yet if there's a video in that. It feels like the
lesson might be about demo-design — like, we need to be clearer with
prospects about where LLM agents genuinely outperform traditional systems
and where they don't. But I want to sit with it a bit longer before I know
if this is a public-facing lesson or an internal one.

[15:30] That's the week. The two things I want to come back to and
possibly make content about are the chunk-vs-span thing and the canary
suite thing. Both of those feel like they got me genuinely surprised, and
I think other people in this space are making the same mistakes I was.
Okay, recording ending.
```

- [ ] **Step 3: Verify the fixture file**

Run:

```bash
wc -w projects/_test-ideation/source.md
```

Expected: between 900 and 1400 words. (Must be under 1,500 so the skill's adaptive-count logic lands on 3 — that's important for Task 4 Criterion A, which assumes top-3 = all surfaced ideas.)

Run:

```bash
head -5 projects/_test-ideation/source.md
```

Expected: the markdown header (`# Test fixture...`) followed by the Loom metadata.

- [ ] **Step 4: Commit**

```bash
git add projects/_test-ideation/source.md
git commit -m "test(video-ideation): add crafted transcript fixture"
```

---

## Task 2: Create `SKILL.md`

Purpose: the core of the skill — the taste function, the three-pass process, the output schema, the edge-case handling, all encoded as instructions Claude follows when invoked.

**Files:**
- Create: `.claude/skills/video-ideation/SKILL.md`

- [ ] **Step 1: Create the skill folder**

```bash
mkdir -p .claude/skills/video-ideation
```

- [ ] **Step 2: Write `SKILL.md`**

Write the following content to `.claude/skills/video-ideation/SKILL.md`:

````markdown
---
name: video-ideation
description: |
  Turn a Loom-style work-log transcript into a ranked shortlist of structured video ideas
  tuned to Vinit's YouTube channel (builder narrative, YouTube signal, CX-buyer relevance).
  Invoked via the /video-ideation slash command; can also be called directly by name when
  the user asks to "find video ideas from" a transcript. Reads source.md from a session
  folder, writes ideas.md alongside it.
---

# video-ideation

## What this skill does

You receive a path to a **session folder** under `projects/`. The folder contains a
`source.md` file holding a Loom-style work-log monologue transcript. Your job: extract
a **ranked shortlist of structured video ideas** tuned to the channel's taste function,
write them to `<session-folder>/ideas.md`, and also print the same content to the
conversation.

Think of yourself as a video producer with strong editorial taste, reading a rambling
work-log looking for the 3–5% of what was said that has real channel potential.

## Invocation

Arguments come in as a single string that must be parsed:

```
<session-folder> [--count N]
```

Examples:

- `projects/2026-04-23-weekly-update`
- `projects/2026-04-23-weekly-update --count 3`

## Validation (do this first, before anything else)

Run these checks in order. On any failure, print the error to the conversation and
**stop** — do not write `ideas.md`.

| Check                                             | Error message                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Args provided and non-empty                       | `"No session folder provided. Usage: /video-ideation <path> [--count N]"`            |
| Session folder exists                             | `"Session folder <path> does not exist."`                                            |
| `<path>/source.md` exists                         | `"<path>/source.md not found. Create it with your Loom transcript first."`           |
| Transcript body (body after the `---` separator, or whole file if no separator) ≥ 200 chars | `"source.md transcript body is too short (<200 chars) to extract ideas."` |
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

Path: `<session-folder>/ideas.md`.

Header:

```markdown
# Video ideas — <human-readable session description>

**Source:** <link or note from source.md frontmatter> · <word-count-based length estimate>
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
- Do not auto-create `projects/<source-repo>--<video-slug>/` folders.
- Do not summarize the transcript. Your output is a ranked shortlist, not a summary.
````

- [ ] **Step 3: Verify `SKILL.md`**

Run:

```bash
test -f .claude/skills/video-ideation/SKILL.md && echo OK
head -10 .claude/skills/video-ideation/SKILL.md
wc -l .claude/skills/video-ideation/SKILL.md
```

Expected:
- `OK` printed.
- Frontmatter visible starting with `---` and `name: video-ideation`.
- Line count between 200 and 300 lines.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/video-ideation/SKILL.md
git commit -m "feat(video-ideation): add skill definition"
```

---

## Task 3: Create the Slash Command

Purpose: the discoverable `/video-ideation` entry point. Minimal by design — all logic is in the skill.

**Files:**
- Create: `.claude/commands/video-ideation.md`

- [ ] **Step 1: Check the commands folder exists**

```bash
ls -la .claude/commands
```

Expected: the folder exists (pre-existing). If it doesn't, create with `mkdir -p .claude/commands` — but it should be there per the project structure.

- [ ] **Step 2: Write the slash command**

Write the following content to `.claude/commands/video-ideation.md`:

```markdown
---
description: Generate a ranked shortlist of video ideas from a Loom transcript in a session folder.
---

Invoke the `video-ideation` skill with the provided arguments.

Arguments: `$ARGUMENTS`

Use the `Skill` tool with `skill: video-ideation` and pass the arguments above as the
skill's `args` parameter. The skill handles parsing, validation, transcript analysis,
scoring, and output. Do not perform any parsing, validation, or logic in this command —
it is intentionally a thin trigger.
```

- [ ] **Step 3: Verify the command file**

Run:

```bash
test -f .claude/commands/video-ideation.md && echo OK
cat .claude/commands/video-ideation.md
```

Expected:
- `OK` printed.
- Frontmatter with `description:` field visible.
- Body references the `Skill` tool and `$ARGUMENTS`.

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/video-ideation.md
git commit -m "feat(video-ideation): add /video-ideation slash command"
```

---

## Task 4: Smoke Test and Iterate

Purpose: run `/video-ideation` against the crafted fixture. Verify the output matches the v1 acceptance criteria from the spec §9 step 5. Iterate on `SKILL.md` if needed.

This task is **human-in-the-loop** — the executor must actually invoke the slash command in their Claude Code session and judge whether the output is correct. There is no automated pytest-style check.

**Files:**
- Read: `projects/_test-ideation/source.md`
- Generate: `projects/_test-ideation/ideas.md`
- Modify (if iterating): `.claude/skills/video-ideation/SKILL.md`

- [ ] **Step 1: Run the slash command**

In the Claude Code session, run:

```
/video-ideation projects/_test-ideation
```

Expected: the skill runs to completion without validation errors. `projects/_test-ideation/ideas.md` is created. The skill prints the full `ideas.md` content to the conversation.

**Fallback if `/video-ideation` isn't recognized:** Claude Code normally picks up new `.claude/commands/` entries automatically, but if the command isn't found (e.g., "unknown command"), invoke the skill directly by name instead:

> "Use the video-ideation skill on projects/_test-ideation"

Both paths should produce the same output — the slash command is just a discovery shortcut.

- [ ] **Step 2: Verify the output file exists and is readable**

```bash
test -f projects/_test-ideation/ideas.md && echo OK
wc -l projects/_test-ideation/ideas.md
```

Expected: `OK` printed, line count is non-trivial (at least 40 lines for a 5-idea output).

- [ ] **Step 3: Check v1 acceptance criteria**

Read `projects/_test-ideation/ideas.md` and verify ALL of the following:

- [ ] **Criterion A:** Both planted video-worthy moments appear in the top 3 ideas:
  - **"Chunk-vs-span eval"** — chunk-level recall 1.0 vs span-level 0.41, vanity-metric angle
  - **"Prompt drift / canary suite"** — stable model but unstable agent, corpus drift, continuous eval angle

- [ ] **Criterion B:** Every surfaced idea has at least one non-empty `**Source evidence**` quote. Each quote appears **literally** in `projects/_test-ideation/source.md` (copy-paste check). No paraphrased or invented quotes.

- [ ] **Criterion C:** Scores differentiate. Spread between the top idea's `overall` and the bottom idea's `overall` ≥ 1.5. Not every idea is within 0.5 of every other.

- [ ] **Criterion D:** None of these mundane items appear as top-N ranked ideas: dependency version bumps, the flaky-ingest-test fix, the 1:1 with Priya.

- [ ] **Criterion E:** Output is valid markdown and matches the §8 shape from the spec — header, `## N. <Title>`, scores line, alt titles, hook, builder narrative, source evidence, who cares, takeaway, format hint, risk.

- [ ] **Step 4: Decide — passes or iterate?**

**If ALL criteria A–E pass:** go to Step 6.

**If ANY criterion fails:** the skill needs iteration. Go to Step 5.

- [ ] **Step 5: Iterate on `SKILL.md`**

Identify the specific failure mode from Step 3:

| Failure | Likely SKILL.md fix |
| ------- | ------------------- |
| Planted items missed (A) | Strengthen the Pass 1 "be generous" instruction; add more examples of what counts as video-worthy |
| Invented / paraphrased quotes (B) | Make the `no fabricated quotes` rule louder; add a verification step where skill re-reads source.md before writing each quote |
| Scores too flat (C) | Add rubric anchors — explicit 10/5/1 examples per criterion; warn against defaulting to 7 |
| Mundane items surfaced (D) | Tighten the floor guidance; explicit examples of "mundane" items that should score < 3 |
| Schema violations (E) | Show a concrete output template in SKILL.md, not just prose description |

Edit `.claude/skills/video-ideation/SKILL.md` with a targeted fix. Commit each revision separately:

```bash
git add .claude/skills/video-ideation/SKILL.md
git commit -m "fix(video-ideation): <specific change>, e.g. tighten quote-fabrication guard"
```

Then **delete the prior ideas.md** and rerun from Step 1:

```bash
rm projects/_test-ideation/ideas.md
```

Cap at **3 iteration rounds**. If acceptance is still not met after 3 rounds, stop and report blockage to the user for design review — the criteria may be unrealistic or the spec needs revisiting.

- [ ] **Step 6: Commit the smoke-test output (optional, for audit trail)**

If acceptance passed without iteration, there's nothing new to commit (SKILL.md wasn't changed). If iteration happened, each round already produced its own commit.

Do **not** commit `projects/_test-ideation/ideas.md` — it's a regeneratable artifact and will be deleted in Task 7.

---

## Task 5: Real-World Test

Purpose: verify the skill works end-to-end on an actual Vinit Loom transcript, not just the crafted fixture. Success is defined by **skill correctness**, not idea quality — a boring source correctly produces a "weak result" warning rather than fake-polished ideas.

This task requires the user to provide a real transcript and inspect the output. The agent executing this plan should pause and ask the user to do this step.

**Files:**
- Expected: user creates `projects/<YYYY-MM-DD>-<loom-slug>/source.md` with a real Loom transcript
- Generated: `projects/<YYYY-MM-DD>-<loom-slug>/ideas.md`

- [ ] **Step 1: Ask the user**

Pause execution and prompt the user:

> "Task 5 is the real-world test. Please:
>  1. Create a new folder `projects/<YYYY-MM-DD>-<loom-slug>/` with a meaningful slug.
>  2. Drop your actual Loom transcript into `source.md` with a Loom link at the top.
>  3. Run `/video-ideation projects/<YYYY-MM-DD>-<loom-slug>`.
>  4. Share the resulting `ideas.md` content (or confirm it looks right) so I can verify v1 acceptance."

Wait for the user's response before continuing.

- [ ] **Step 2: Verify real-world v1 acceptance**

Review the generated `ideas.md` against these criteria (from spec §9 step 6):

- [ ] The skill ran end-to-end without errors.
- [ ] `ideas.md` exists with the §8 structural shape.
- [ ] All surfaced ideas have source-evidence quotes that appear literally in the transcript. Spot-check 2 random quotes.
- [ ] The user agrees the scoring is directionally honest — even if they don't love any individual idea, the ranking reflects their taste.

- [ ] **Step 3: Decide — pass or iterate?**

**If all 4 criteria pass:** proceed to Task 6.

**If any fail:** repeat Task 4 Step 5 (iterate on SKILL.md), then rerun `/video-ideation` on the real transcript. Cap at 2 additional iteration rounds.

- [ ] **Step 4: No commit needed for Task 5**

Real-world `source.md` / `ideas.md` are the user's content; they decide when and what to commit separately. The user's session folder follows the regular project convention.

---

## Task 6: Cleanup the Test Fixture

Purpose: remove the throwaway test folder now that v1 acceptance is met.

**Files:**
- Delete: `projects/_test-ideation/` (entire folder)

- [ ] **Step 1: Nuke the folder from disk**

```bash
rm -rf projects/_test-ideation
```

This removes both tracked (`source.md`) and untracked (`ideas.md`, which was never committed per Task 4 Step 6) files, plus the now-empty folder.

- [ ] **Step 2: Stage the tracked-file deletion**

```bash
git add -A projects/_test-ideation
```

`git add -A <path>` matches tracked files in git's index — it works even when the path no longer exists on disk. This stages the `source.md` deletion. (Untracked `ideas.md` was never in the index, so nothing to stage for it.)

- [ ] **Step 3: Verify stage + filesystem state**

```bash
test ! -e projects/_test-ideation && echo "disk: OK"
git status --short | grep '_test-ideation'
```

Expected:
- `disk: OK` printed.
- `git status` shows `D  projects/_test-ideation/source.md` (staged deletion).

- [ ] **Step 4: Commit the deletion**

```bash
git commit -m "chore(video-ideation): remove test fixture after v1 acceptance"
```

---

## Task 7: Update Spec Status

Purpose: bump the spec's status field from "approved in chat — implementation plan to follow" to "implemented" so future readers can trace.

**Files:**
- Modify: `docs/superpowers/specs/2026-04-23-video-ideation-skill-design.md:4`

- [ ] **Step 1: Update the Status line**

Edit `docs/superpowers/specs/2026-04-23-video-ideation-skill-design.md` — change the line:

```markdown
**Status:** approved in chat — implementation plan to follow
```

to:

```markdown
**Status:** implemented (2026-04-23)
```

- [ ] **Step 2: Verify the edit**

```bash
grep -n '^\*\*Status' docs/superpowers/specs/2026-04-23-video-ideation-skill-design.md
```

Expected: line shows `**Status:** implemented (2026-04-23)`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-04-23-video-ideation-skill-design.md
git commit -m "docs(video-ideation): mark spec as implemented"
```

---

## Final Verification

After all tasks complete, the repo state should be:

- [ ] `.claude/skills/video-ideation/SKILL.md` — exists, has valid frontmatter.
- [ ] `.claude/commands/video-ideation.md` — exists, has valid frontmatter.
- [ ] `projects/_test-ideation/` — does NOT exist (deleted in Task 6).
- [ ] `docs/superpowers/specs/2026-04-23-video-ideation-skill-design.md` — Status: implemented.
- [ ] `skills-lock.json` — unchanged.
- [ ] `CLAUDE.md` — unchanged.
- [ ] `.gitignore` — unchanged.

Run:

```bash
git log --oneline -15
```

Expected: **5 to 8 new commits** visible — 5 tasks that commit (1, 2, 3, 6, 7) plus 0–3 iteration rounds in Task 4.

Run:

```bash
git status
```

Expected: clean working tree.

---

## Rollback Plan

If implementation goes wrong and needs to be reverted:

```bash
# Find the pre-Task-1 commit
git log --oneline | head -20

# Reset to it (confirm hash first)
git reset --hard <pre-task-1-hash>
```

Since all tasks are committed atomically, rolling back individual tasks is also possible via `git revert <task-commit-hash>`.

---

## Out of Scope (do not do as part of this plan)

The following are deferred per spec §10. Do not implement these in this plan:

- `/video-outline`, `/video-scripting` — future skills.
- Multi-source support (call transcripts, notes, etc.).
- YouTube Data API, vidIQ, web-search integration.
- Taste calibration across sessions.
- Auto-creating `projects/<source-repo>--<video-slug>/` from a picked idea.
- Non-English transcript support.
- Rerun diffing.

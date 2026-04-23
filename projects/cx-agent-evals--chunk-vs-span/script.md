# chunk-vs-span — Script

Canonical narration and caption source. Scenes and durations match
`tools/remotion/src/compositions/chunk-vs-span/frames.ts` (SCENES map).

---

## Scene 1 — Intro (0:00–0:05)

**Narration:** _A 60-second tour of two ways to score a retrieval system._

**Caption:** "Chunk vs span — a quick tour of two recall metrics."

**Visual:** title card "Chunk vs Span" on the mint-accent palette.

---

## Scene 2 — The Document (0:05–0:15)

**Narration (V1, ~27 words, ~9.6s at 170 wpm):**
_"A document is anything with text — a report, a web page, a Google Doc.
All of it becomes clean Markdown. One format, one system. Next, we chunk."_

**Caption:** "Any text source → one Markdown file per document"

**Visual:** four source formats (PDF, DOCX, HTML, GDoc) cascade in from the
left, flow right through a dashed `normalize` block, and emerge as four
corresponding `.md` files on the right. A cursor enters, clicks
`annual-report.md`, and the file expands into a full structured-markdown
panel (heading, paragraph w/ highlight, bullets, `LLM-native` pill).

**Beat table (seconds from scene start):**

| Time (s)    | Phrase                              | On-screen                                                                  |
| ----------- | ----------------------------------- | -------------------------------------------------------------------------- |
| 0.0 – 0.6   | "A document is anything with text"  | Title fades in top-left                                                    |
| 0.6 – 1.2   | "— a report,"                       | `PDF / annual report` card slides in (8px overshoot)                       |
| 1.2 – 1.8   | _(silent)_                          | `DOCX / case study` card slides in                                         |
| 1.8 – 2.4   | "a web page,"                       | `HTML / blog post` card slides in                                          |
| 2.4 – 3.2   | "a Google Doc."                     | `GDoc / meeting notes` card slides in                                      |
| 3.2 – 5.0   | _(silent)_                          | Cards translate right into `normalize`; mint pulse flashes at ~4.0s        |
| 5.0 – 6.0   | "All of it becomes clean Markdown." | Four `.md` files emerge staggered on the right                             |
| 6.0 – 6.8   | _(tail)_                            | `normalize` block fades out                                                |
| 6.8 – 8.0   |                                     | Cursor travels bottom-right → `annual-report.md`                           |
| 8.0         | "One format, one system." (starts)  | Cursor click; mint ring pulses around card 1                               |
| 8.2 – 10.2  | "Next, we chunk."                   | Card 1 scales up from its own top-right into the expanded markdown panel; content cascades in; others dim |
| 10.0 – 10.5 |                                     | Hold, then transitions to Scene 3                                          |

> Narration is **not** yet part of the render — the scene plays silently
> with a caption. The beat frames in `02-document.tsx` are estimates at
> ~170 wpm; they will be replaced by Deepgram word-level timestamps in the
> upcoming narration-pipeline spec. No scene logic should change when that
> swap happens.

---

## Scene 3 — Chunking (0:15–0:30)

**Narration:** _The corpus is split into chunks. Each chunk becomes a unit
the retriever can pick or skip._

**Caption:** "Split the document into chunks. Each becomes a retrieval unit."

**Visual:** document breaks into ~5 colored chunks stacked vertically.

---

## Scene 4 — The Answer Span (0:30–0:40)

**Narration:** _The true answer is not a whole chunk. It's a specific
character span inside one of them._

**Caption:** "The true answer lives in this character span."

**Visual:** one chunk lights up; a sub-region inside it glows.

---

## Scene 5 — Comparison (0:40–1:10)

**Narration:** _Chunk-level recall says: the right chunk was retrieved, score
is 1.0. Span-level recall compares character overlap, and scores 0.4 — the
retrieved chunk contains the answer, but 60 percent of its text is
irrelevant context._

**Caption:** "Chunk-level recall: 1.0. Span-level recall: 0.4."

**Visual:** two metric bars animate to their values side-by-side.

---

## Scene 6 — Outro (1:10–1:30)

**Narration:** _If you want honest retrieval numbers, measure the span you
asked for — not the box it came in._

**Caption:** "Span evaluation is the honest signal."

**Visual:** repo URL + call to action.

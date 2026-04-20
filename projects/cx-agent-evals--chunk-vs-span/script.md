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

**Narration:** _Retrieval-augmented generation grounds a model in a corpus.
Let's take one short passage from that corpus._

**Caption:** "Consider this document."

**Visual:** paragraph fades in word-by-word.

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

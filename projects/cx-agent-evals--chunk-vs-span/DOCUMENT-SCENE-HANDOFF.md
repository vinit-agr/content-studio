# Document Scene — Implementation Handoff

Handoff from a brainstorming session for rebuilding **Scene 2 ("The Document")** of
the `chunk-vs-span` pilot video. All design decisions are locked. The next Claude
session should go straight to Remotion implementation — no further brainstorm,
spec, or planning step is required.

---

## How to use this file

1. Start a fresh Claude Code session in this repo.
2. Point Claude at this file: `projects/cx-agent-evals--chunk-vs-span/DOCUMENT-SCENE-HANDOFF.md`.
3. Open the animated reference in a browser: `projects/cx-agent-evals--chunk-vs-span/mockups/document-scene-v2.html` — a 13s looping, high-fidelity approximation using the same fonts, colors, and easings we want in the final render.
4. Ask Claude to implement the scene in `tools/remotion/src/compositions/chunk-vs-span/scenes/02-document.tsx`, reusing existing theme tokens and primitives where they fit. The mockup is the source of truth for motion feel and visual polish.

---

## Scene summary

- **Scene:** Scene 2 of `chunk-vs-span`.
- **Duration:** 10.0 seconds (0:05 – 0:15 in the 90s pilot). No changes to the overall video timeline.
- **Metaphor:** pipeline. Four source formats flow left → right through a dashed "normalize" block and emerge as four Markdown files on the right. A cursor clicks the first file; it expands to show that document's content.

---

## Locked narration (V1, concept-first, 27 words)

> "A document is anything with text — a report, a web page, a Google Doc. All of it becomes clean Markdown. One format, one system. Next, we chunk."

Target delivery pace ~170 wpm → runs ~9.6s. Narration is **not** part of the current implementation — the scene renders silently with captions for now. Beat-to-word sync arrives later via a separate narration-pipeline spec (see **Deferred** below).

---

## Beat-by-beat storyboard (seconds from scene start)

| Time (s) | Narration phrase | On-screen event |
| --- | --- | --- |
| 0.0 – 0.6 | "A document is anything with text" | Title "The Document" fades in top-left |
| 0.6 – 1.2 | "— a report," | `PDF / annual report` card slides in from left with ~8px overshoot, settles |
| 1.2 – 1.8 | (silent) | `DOCX / case study` card slides in (no narration — visual extra that implies "and more") |
| 1.8 – 2.4 | "a web page," | `HTML / blog post` card slides in |
| 2.4 – 3.2 | "a Google Doc." | `GDoc / meeting notes` card slides in — left column complete |
| 3.2 – 5.0 | (silent ~1.8s) | All four cards translate right into the dashed `normalize` block. They fade and blur slightly (0.4 → 1.2px) as they cross the boundary. A mint box-shadow pulse flashes on the normalize block at ~4.0s |
| 5.0 – 6.0 | "All of it becomes clean Markdown." | Four `.md` file cards emerge staggered on the right column (~300ms stagger): `annual-report.md`, `case-study.md`, `blog-post.md`, `meeting-notes.md` |
| 6.0 – 6.8 | (tail) | `normalize` block fades out; 4-file list sits cleanly on the right |
| 6.8 – 8.0 | | Cursor enters from bottom-right, travels up-left to `annual-report.md` |
| 8.0 | "One format, one system." (starts) | Cursor clicks; mint ring pulses around the card (2px stroke, scale 1 → 1.24 while fading 0.9 → 0 over ~400ms) |
| 8.2 – 10.2 | "Next, we chunk." | Clicked card scales up **from its own top-right corner** into a full structured-markdown panel. Other three files dim and fade. Content cascades in top-down: `# heading` → paragraph w/ bold highlight → `## Highlights` → 3 bullets → `LLM-native` pill |
| 10.0 – 10.5 | | Hold, then scene transitions to Scene 3 (chunking) |

**Implementation note:** the beat timings above are estimates, derived from natural-speech pacing. Encode them as **named frame constants** at the top of `02-document.tsx` (e.g. `PHRASE_REPORT_IN_FRAME = 18`, `NORMALIZE_ACTIVATE_FRAME = 120`, `MD_EMERGE_F1_FRAME = 150`, `CURSOR_CLICK_FRAME = 240`, `MD_CARD_EXPAND_FRAME = 246`). The future narration-pipeline spec will replace these constants with real Deepgram word-level timestamps — nothing else in the scene should change when that swap happens.

---

## Format icons (left column)

| Format | Example caption | Color | Theme token |
| --- | --- | --- | --- |
| PDF   | annual report  | `#f87171` | `error`  |
| DOCX  | case study     | `#fbbf24` | `warn`   |
| HTML  | blog post      | `#818cf8` | `chunk2` |
| GDoc  | meeting notes  | `#f472b6` | `chunk4` |

Card layout: rounded 8px, dark text (`#0c0c0f`) on the colored fill, format name in 18px/bold on top line, example caption in 11px/muted on second line. `HTML` card uses light text (`#e8e8ed`) because its fill is darker. Each card has a soft drop shadow `0 10px 30px -12px rgba(0,0,0,0.5)`.

---

## Markdown file list (right column, after normalize)

| Filename | Source hint |
| --- | --- |
| `annual-report.md` | from PDF |
| `case-study.md`    | from DOCX |
| `blog-post.md`     | from HTML |
| `meeting-notes.md` | from GDoc |

Each list card:

- Background `#1a1a22` (`bg-surface`)
- Border `#2d6b54` (`accent-dim`) at rest; transitions to `#6ee7b7` (`accent`) plus a 2px outer ring on click.
- Small folded-corner `.md` icon on the left (32×38px): mint fill, dark "md" label bottom-center, 10×10px cut at top-right exposing the page background.
- Right side: filename in mint/14px/semibold; source hint in dim/10px/letter-spaced underneath.

Entry animation: `translateX(-110%) scale(0.86)` → slight overshoot `(+6%, scale 1.03)` → settle `(0, 1.0)`, ~300ms per card. Staggered 300ms between cards 1–4.

On click (card 1 only):

- Ring pulse (described above) fires first.
- Card 1 then scales up from its own top-right corner (transform-origin `100% 10%`) into the expanded markdown panel position. ~400ms with `cubic-bezier(0.2, 0.9, 0.2, 1)`.
- Cards 2–4 fade to opacity 0 with a slight scale-down (`0.96`) during the same window.

---

## Expanded markdown panel (payoff content)

Annual-report-flavored content. Lives at ~26%/14% (left/top), 62%/72% (width/height).

```markdown
# 2024 Annual Report

Q3 revenue grew **32%** year-over-year, led by enterprise adoption.

## Highlights
- Expanded to 18 new markets
- Shipped Tars v4.0
- 2.4M active developers
```

Visual styling:

- Panel: `bg-surface` fill, 1px `accent` border, 10px radius, soft mint glow `0 0 40px 4px rgba(110,231,183,0.15)` + drop shadow `0 24px 60px -12px rgba(0,0,0,0.6)`.
- Header row: filename `annual-report.md` in mint/14px/bold on the left; `LLM-native` pill on the right (10px uppercase, mint text on `accent-dim` background, 999px radius, appears with a subtle 1.08 → 1.0 pulse at the end of the cascade).
- `# 2024 Annual Report` in mint/26px/bold.
- Paragraph in muted text (`#8888a0`), 14px/1.7 line-height. `**32%**` rendered as an amber highlight: text `#fbbf24`, background `rgba(251,191,36,0.18)`, 3px radius, 1px/6px padding.
- `## Highlights` in mint/17px/bold.
- Bullets: list marker replaced with a mint-bold `- ` prefix; bullet text muted, 13px.

Content cascades in top-down with 150ms stagger per line (fade + translateY 4px → 0).

---

## Cursor

Already have a `Cursor.tsx` primitive at `tools/remotion/src/primitives/Cursor.tsx` — extend it (or replace) to support:

- Absolute positioning with an animated path between two points.
- Click event rendering (ring pulse above).
- Arrow shape: classic OS cursor, `#e8e8ed` fill, `#0c0c0f` 1px stroke for contrast on dark bg. SVG path from the mockup:

```svg
<path d="M3 2 L3 18 L7.5 14.5 L10 21 L13 20 L10.5 13.5 L17 13 Z"
      fill="#e8e8ed" stroke="#0c0c0f" stroke-width="1" stroke-linejoin="round"/>
```

Motion: bottom-right (~88%/82%) → first-file target (~70%/25%). Easing `cubic-bezier(0.35, 0.1, 0.3, 1)`. Duration ~1.2s. Brief scale dip at click frame (0.9 for one frame, back to 1.0) for tactile feedback.

---

## Theme tokens used

All from `shared/theme/colors.ts`:

`bg`, `bg-elevated`, `bg-surface`, `border`, `text`, `text-muted`, `text-dim`, `accent`, `accent-dim`, `accent-bright`, `warn`, `error`, `chunk2`, `chunk4`.

No new tokens required. Typography: JetBrains Mono throughout (already wired via `@remotion/google-fonts` in the theme).

---

## Primitives

| Primitive | Status | Purpose |
| --- | --- | --- |
| `FormatCard` | **new** | Colored input card with format label + example caption. Props: `format`, `example`, `color`, `textColor?`, `enterFrame`, `flowStartFrame`, `targetX` |
| `NormalizeBlock` | **new** | Dashed mint box with label + sub-label. Props: `appearFrame`, `activateFrame`, `fadeFrame` |
| `MdFile` | **new** | File-list card with folded-corner `.md` icon, filename, source hint. Props: `filename`, `source`, `enterFrame`, `clicked?`, `clickFrame?` |
| `MdDocument` | **new** | Expanded structured-markdown panel with staggered line reveal. Props: `emergeFrame`, `content` (markdown AST or raw string), `originX`, `originY` |
| `Cursor` | **extend** | Extend existing primitive to support two-point animated path + click pulse |
| `Document` | **keep as-is** | Still used by Scene 3 (chunking). Leave untouched |
| `Caption`, `TitleCard` | **keep** | Already fit the scene. Reuse |

---

## File changes

- **Rewrite:** `tools/remotion/src/compositions/chunk-vs-span/scenes/02-document.tsx` (keep scene duration at 300 frames / 10s; update the scene's contents to match the storyboard above).
- **Add:** `tools/remotion/src/primitives/FormatCard.tsx`, `NormalizeBlock.tsx`, `MdFile.tsx`, `MdDocument.tsx`.
- **Edit:** `tools/remotion/src/primitives/Cursor.tsx` (extend with path + click pulse).
- **Edit:** `tools/remotion/src/primitives/index.ts` (re-export new primitives).
- **Add:** `shared/assets/data/sample-markdown-card.ts` exporting the annual-report markdown string (so the content isn't inlined in the scene).
- **Edit:** `projects/cx-agent-evals--chunk-vs-span/script.md` — replace Scene 2 narration with the locked V1 script; add the beat-timing table.
- **Edit:** `tools/remotion/src/compositions/chunk-vs-span/captions.ts` — update Scene 2 caption to `"Any text source → one Markdown file per document"`.

---

## Motion & easing reference (from the mockup)

- Format-card entry: `cubic-bezier(0.2, 0.8, 0.2, 1)` with translateX overshoot (~8px past target, settle 80ms later).
- Card flight into normalize: same easing, blur buildup 0.4 → 1.2px as they cross the boundary, opacity 1 → 0 shortly after.
- Normalize activation pulse: mint box-shadow `0 0 42px 6px rgba(110,231,183,0.35)` at peak, decay over ~400ms.
- `.md` file emergence: `cubic-bezier(0.2, 0.9, 0.2, 1)`, scale 0.86 → 1.03 overshoot → 1.0 settle, 300ms per file, 300ms stagger.
- Cursor motion: `cubic-bezier(0.35, 0.1, 0.3, 1)`, ~1.2s end-to-end.
- Click ring: 2px mint stroke, scale 1 → 1.24 while fading 0.9 → 0, ~400ms.
- Expanded-card emergence: `cubic-bezier(0.2, 0.9, 0.2, 1)`, scale 0.3 → 1 from top-right origin, ~400ms.
- Line cascade: 150ms stagger, each line fade + translateY(4px → 0) over ~250ms.

Remotion equivalents: use `interpolate()` with matching bezier curves, or `spring()` for the overshoot behaviors. Match the *feel*, not the exact numbers — the mockup is a target, not a spec.

---

## Deferred (not part of this implementation)

A separate future spec will cover:

- ElevenLabs TTS voiceover generation (new `tools/voiceover/`).
- Deepgram word-level alignment (new `tools/transcribe/`).
- Replacing the estimated beat constants in `02-document.tsx` with real word-timestamps read from a Deepgram alignment JSON.
- Mixing the actual audio track into the rendered MP4.

Nothing in this scene should preemptively build that infrastructure. The beat-constants-at-top-of-file pattern is the seam where the pipeline will plug in later.

---

## Review checklist for the implementation session

Before declaring the scene done:

- [ ] All beats from the table above visible at the expected time (verify by scrubbing in Remotion Studio).
- [ ] Motion feels crisp — overshoot is perceptible but not exaggerated; no stiffness from linear interpolation.
- [ ] Cursor path reads as purposeful, not lazy.
- [ ] Expanded-card emergence clearly grows out of the clicked file (origin matters — top-right of the clicked card).
- [ ] Typography is JetBrains Mono everywhere, weights 500/600/700 used consistently.
- [ ] All four markdown-file cards have the folded-corner icon.
- [ ] `LLM-native` pill appears at the *end* of the content cascade, not earlier.
- [ ] Final hold lasts long enough to read the bullets (~1s) before transitioning to Scene 3.
- [ ] `pnpm typecheck && pnpm lint` pass.
- [ ] Remotion Studio preview renders without console warnings.

---

## Related files

- Animated reference: `projects/cx-agent-evals--chunk-vs-span/mockups/document-scene-v2.html`
- Current scene to replace: `tools/remotion/src/compositions/chunk-vs-span/scenes/02-document.tsx`
- Full video script: `projects/cx-agent-evals--chunk-vs-span/script.md`
- Storyboard summary: `projects/cx-agent-evals--chunk-vs-span/storyboard.md`
- Theme palette: `shared/theme/colors.ts`
- Project-level notes: `projects/cx-agent-evals--chunk-vs-span/notes.md`

---

_Session date: 2026-04-22. Branch: `va_improve_animation`._

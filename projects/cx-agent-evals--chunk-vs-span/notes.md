# chunk-vs-span — Design Notes

## Why this pilot

Small enough to validate the whole pipeline (composition → render → output →
log), substantive enough to exercise theme tokens, primitives, and narration.

## Day-one fidelity

Scenes land as `TitleCard` + `Caption` + a few primitives — no polished
animation. The point is to prove the pipeline, not the visuals. Animation
polish is a follow-up pass (see spec §11 scope fence).

## Caption style

Short, declarative, no jargon in scenes 1–2. Technical terms enter only from
scene 3 onward, and only after the visual introduces them.

## Palette choices

The mint accent on the `Chunk-level recall` bar is intentional — we want the
high (chunk-level) number to feel positive on first read, so the drop to
`warn` amber on the span-level bar lands as a plot twist.

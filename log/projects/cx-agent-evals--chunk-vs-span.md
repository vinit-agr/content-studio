# chunk-vs-span — Iteration log

Newest first.

---

## 2026-04-20 — v01 placeholder render

First end-to-end render of the pilot against the foundation. Scenes are
placeholder fidelity (`TitleCard` + `Caption` + a few primitives). Goal was
pipeline validation, not visual polish.

What worked:

- Theme context wiring: editing `cx-agent-evals.ts` palette updates the
  preview in-place.
- `frames.ts` leaf module pattern avoids circular imports as scenes grow.
- `CAPTIONS satisfies Record<SceneName, string>` catches missing scene
  coverage at compile time.

What's next:

- Replace `Span` / `MetricBar` stubs with animated visuals.
- Tune caption copy against narration v1.

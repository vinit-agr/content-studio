---
description: Mine a content-source transcript for a ranked shortlist of video ideas targeted at a specific project folder.
---

Invoke the `video-ideation` skill with the provided arguments.

Arguments: `$ARGUMENTS`

Use the `Skill` tool with `skill: video-ideation` and pass the arguments above as the
skill's `args` parameter. The skill expects two positional paths —
`<source-folder> <project-folder>` — followed by an optional `--count N`. The skill
handles parsing, validation, transcript analysis, scoring, and output. Do not perform
any parsing, validation, or logic in this command — it is intentionally a thin trigger.

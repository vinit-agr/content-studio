# log/

Work log for the content studio. Two axes:

- **Dated entries** (`log/YYYY-MM-DD-<slug>.md`) — one per work session. Free-form
  markdown. Newest-last by filename sort.
- **Per-project files** (`log/projects/<source-repo>--<video-slug>.md`) — one per
  video project, rolling narrative (newest-first inside the file).

## Suggested frontmatter

```markdown
---
date: YYYY-MM-DD
session: <short-slug>
project: <source-repo>--<video-slug> # optional
---
```

## Conventions

- Write at end of session.
- Commit each log entry in its own commit.
- Logs are not auto-generated; they're the human's journal.

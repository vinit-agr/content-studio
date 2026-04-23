# tools/transcripts/

Small utilities for turning raw recording exports (SRT subtitle files, Loom
downloads, etc.) into the `source.md` format consumed by the
`video-ideation` skill.

## srt-to-source.ts

Converts one or more `.srt` subtitle files into a single Markdown transcript
with a header block and `[MM:SS]` paragraph anchors. Multi-file input is
treated as one continuous recording — each subsequent file's timestamps are
offset by the end-time of prior files.

```bash
pnpm dlx tsx tools/transcripts/srt-to-source.ts \
  --out projects/2026-04-23-weekly-update/source.md \
  --title "Weekly update — 2026-04-23" \
  --source "Loom: https://loom.com/share/..." \
  path/to/part1.srt path/to/part2.srt
```

Output shape (consumed by the `video-ideation` skill):

```markdown
# <title>

**Source:** <source>
**Duration:** ~<N> min (<K> parts)
**Generated:** <YYYY-MM-DD> by tools/transcripts/srt-to-source.ts

---

[MM:SS] <~25s of grouped subtitle text>

[MM:SS] <next paragraph>
```

Group window defaults to 25 seconds, which gives readable prose without
flattening the speaker's beats.

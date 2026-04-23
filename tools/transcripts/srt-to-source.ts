/**
 * srt-to-source.ts
 *
 * Convert one or more .srt subtitle files into a single `source.md` transcript
 * suitable as input to the `video-ideation` skill.
 *
 * Multi-file input: timestamps in each subsequent file are offset by the
 * cumulative end-time of prior files, so the output reads as one continuous
 * recording. SRT cues are grouped into ~WINDOW_MS paragraphs for readability.
 *
 * Usage:
 *   pnpm dlx tsx tools/transcripts/srt-to-source.ts \
 *     --out projects/<slug>/source.md \
 *     --title "<human-readable title>" \
 *     --source "<loom link or note>" \
 *     path/to/part1.srt [path/to/part2.srt ...]
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

type Cue = {
  index: number;
  startMs: number;
  endMs: number;
  text: string;
};

type Args = {
  out: string;
  title: string;
  source: string;
  files: string[];
};

const WINDOW_MS = 25_000;

function toMs(h: string, mm: string, ss: string, ms: string): number {
  return Number(h) * 3_600_000 + Number(mm) * 60_000 + Number(ss) * 1_000 + Number(ms);
}

function formatTimestamp(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}

function parseSrt(content: string): Cue[] {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized.trim().split(/\n\s*\n/);
  const cues: Cue[] = [];
  const timeRe = /(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/;
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.length > 0);
    if (lines.length < 3) continue;
    const indexLine = lines[0];
    const timeLine = lines[1];
    if (indexLine === undefined || timeLine === undefined) continue;
    const idx = Number.parseInt(indexLine.trim(), 10);
    if (!Number.isFinite(idx)) continue;
    const m = timeRe.exec(timeLine);
    if (!m) continue;
    const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = m;
    if (
      h1 === undefined || m1 === undefined || s1 === undefined || ms1 === undefined ||
      h2 === undefined || m2 === undefined || s2 === undefined || ms2 === undefined
    ) continue;
    const startMs = toMs(h1, m1, s1, ms1);
    const endMs = toMs(h2, m2, s2, ms2);
    const text = lines.slice(2).join(" ").trim();
    if (text.length === 0) continue;
    cues.push({ index: idx, startMs, endMs, text });
  }
  return cues;
}

function groupByWindow(cues: Cue[], windowMs: number): Cue[][] {
  const groups: Cue[][] = [];
  let current: Cue[] = [];
  let windowStart = 0;
  for (const cue of cues) {
    if (current.length === 0) {
      windowStart = cue.startMs;
      current.push(cue);
      continue;
    }
    if (cue.startMs - windowStart < windowMs) {
      current.push(cue);
    } else {
      groups.push(current);
      current = [cue];
      windowStart = cue.startMs;
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { out: "", title: "", source: "", files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === undefined) continue;
    if (a === "--out" || a === "--title" || a === "--source") {
      const next = argv[i + 1];
      if (next === undefined) throw new Error(`Missing value for ${a}`);
      if (a === "--out") out.out = next;
      else if (a === "--title") out.title = next;
      else out.source = next;
      i++;
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown flag: ${a}`);
    } else {
      out.files.push(a);
    }
  }
  if (!out.out) throw new Error("--out <path> is required");
  if (out.files.length === 0) throw new Error("at least one SRT file path is required");
  return out;
}

function buildBody(cues: Cue[]): string {
  const groups = groupByWindow(cues, WINDOW_MS);
  return groups
    .map((group) => {
      const first = group[0];
      if (first === undefined) return "";
      const anchor = formatTimestamp(first.startMs);
      const text = group.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim();
      return `[${anchor}] ${text}`;
    })
    .filter((p) => p.length > 0)
    .join("\n\n");
}

function buildHeader(args: Args, endMs: number): string {
  const durationMin = Math.max(1, Math.round(endMs / 60_000));
  const partsLabel = `${args.files.length} part${args.files.length === 1 ? "" : "s"}`;
  const title = args.title || "Transcript";
  const source = args.source || "(local SRT — no link provided)";
  const today = new Date().toISOString().slice(0, 10);
  return [
    `# ${title}`,
    ``,
    `**Source:** ${source}`,
    `**Duration:** ~${durationMin} min (${partsLabel})`,
    `**Generated:** ${today} by tools/transcripts/srt-to-source.ts`,
    ``,
    `---`,
    ``,
    ``,
  ].join("\n");
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const allCues: Cue[] = [];
  let offsetMs = 0;
  for (const file of args.files) {
    const raw = readFileSync(file, "utf8");
    const cues = parseSrt(raw);
    if (cues.length === 0) throw new Error(`No cues parsed from ${file}`);
    const shifted = cues.map((c) => ({ ...c, startMs: c.startMs + offsetMs, endMs: c.endMs + offsetMs }));
    allCues.push(...shifted);
    const last = shifted[shifted.length - 1];
    if (last === undefined) throw new Error(`Empty cue list after shift for ${file}`);
    offsetMs = last.endMs;
  }

  const body = buildBody(allCues);
  const last = allCues[allCues.length - 1];
  const endMs = last ? last.endMs : 0;
  const header = buildHeader(args, endMs);

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, header + body + "\n", "utf8");

  const paragraphs = body ? body.split("\n\n").length : 0;
  const durationMin = Math.round(endMs / 60_000);
  console.log(
    `Wrote ${args.out} (${paragraphs} paragraphs, ${allCues.length} cues, ~${durationMin} min)`,
  );
}

main();

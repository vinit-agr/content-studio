// tools/remotion/src/compositions/chunk-vs-span/captions.ts
// Canonical narration lives at projects/cx-agent-evals--chunk-vs-span/script.md.
// Keep captions here short; they are the on-screen text for the day-one
// captions-only render (Q9 in the spec).
import type { SceneName } from './frames';

export const CAPTIONS = {
  intro: 'Chunk vs span — a quick tour of two recall metrics.',
  document: 'Consider this document.',
  chunking: 'Split the document into chunks. Each becomes a retrieval unit.',
  span: 'The true answer lives in this character span.',
  comparison: 'Chunk-level recall: 1.0.   Span-level recall: 0.4.',
  outro: 'Span evaluation is the honest signal.',
} as const satisfies Record<SceneName, string>;

// tools/remotion/src/compositions/chunk-vs-span/frames.ts
// Leaf module — no other imports. Prevents circular imports between
// index.tsx (registers scenes) and captions.ts (needs SceneName).
export const SCENES = {
  intro: { start: 0, duration: 150 }, // 0–5s
  document: { start: 150, duration: 300 }, // 5–15s
  chunking: { start: 450, duration: 450 }, // 15–30s
  span: { start: 900, duration: 300 }, // 30–40s
  comparison: { start: 1200, duration: 900 }, // 40–70s
  outro: { start: 2100, duration: 600 }, // 70–90s
} as const satisfies Record<string, { start: number; duration: number }>;

export type SceneName = keyof typeof SCENES;

export const TOTAL_DURATION_FRAMES = 2700;
export const FPS = 30;

// Runtime self-check: scenes contiguous + sum to total.
const names = Object.keys(SCENES) as SceneName[];
let expectedStart = 0;
for (const name of names) {
  const { start, duration } = SCENES[name];
  if (start !== expectedStart) {
    throw new Error(
      `SCENES contiguity error: "${name}" starts at ${start}, expected ${expectedStart}`,
    );
  }
  expectedStart += duration;
}
if (expectedStart !== TOTAL_DURATION_FRAMES) {
  throw new Error(
    `SCENES duration mismatch: sum=${expectedStart}, TOTAL_DURATION_FRAMES=${TOTAL_DURATION_FRAMES}`,
  );
}

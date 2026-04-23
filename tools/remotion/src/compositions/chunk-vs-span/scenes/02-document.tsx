// tools/remotion/src/compositions/chunk-vs-span/scenes/02-document.tsx
//
// Scene 2 · The Document · 300 frames @ 30fps (10.0s)
//
// Beat-timing constants below are estimates derived from natural-speech
// pacing (~170 wpm). They are intentionally grouped at the top of the file:
// the narration-pipeline spec (see DOCUMENT-SCENE-HANDOFF §Deferred) will
// replace these constants with Deepgram word-level timestamps — nothing
// else in this file should change when that swap happens.
import type { FC } from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import {
  Cursor,
  FormatCard,
  MdDocument,
  MdFile,
  NormalizeBlock,
} from '@primitives';
import { SAMPLE_MARKDOWN_CARD } from '@shared/assets/data/sample-markdown-card';
import { monoStack } from '@theme/fonts';
import { useTheme } from '../../../theme';
import { CAPTIONS } from '../captions';

// --- Named beat frames (30fps) ------------------------------------------------
const TITLE_IN_FRAME = 0; // 0.0s  — "The Document" fades in
const PDF_IN_FRAME = 18; // 0.6s  — "a report"
const DOCX_IN_FRAME = 36; // 1.2s  — (silent extra)
const HTML_IN_FRAME = 54; // 1.8s  — "a web page"
const GDOC_IN_FRAME = 72; // 2.4s  — "a Google Doc"
const NORMALIZE_APPEAR_FRAME = 54; // 1.8s — dashed box begins to materialize
const CARDS_FLIGHT_FRAME = 96; // 3.2s — 4 cards translate into the normalize box
const NORMALIZE_ACTIVATE_FRAME = 120; // 4.0s — mint pulse peak
const MD_EMERGE_F1_FRAME = 150; // 5.0s — "All of it becomes clean Markdown."
const MD_EMERGE_F2_FRAME = 159; // 5.3s
const MD_EMERGE_F3_FRAME = 168; // 5.6s
const MD_EMERGE_F4_FRAME = 177; // 5.9s
const NORMALIZE_FADE_FRAME = 180; // 6.0s — normalize block fades out
const CAPTION_IN_FRAME = 30; // 1.0s — bottom caption fades in
const CURSOR_APPEAR_FRAME = 204; // 6.8s — cursor enters from bottom-right
const CURSOR_ARRIVE_FRAME = 240; // 8.0s — cursor reaches annual-report.md
const CURSOR_CLICK_FRAME = 240; // 8.0s — ring pulses, card begins lift
const MD_CARD_EXPAND_FRAME = 246; // 8.2s — expanded markdown panel begins
const CURSOR_FADE_FRAME = 252; // 8.4s — cursor fades out
const SCENE_FADE_OUT_FRAME = 292; // 9.73s — top-level fade before transition

const FLIGHT_TARGET_PX = 500;

const FORMAT_CARDS = [
  {
    format: 'PDF',
    example: 'annual report',
    color: '#f87171',
    textColor: '#0c0c0f',
    top: '22%',
    enter: PDF_IN_FRAME,
  },
  {
    format: 'DOCX',
    example: 'case study',
    color: '#fbbf24',
    textColor: '#0c0c0f',
    top: '37%',
    enter: DOCX_IN_FRAME,
  },
  {
    format: 'HTML',
    example: 'blog post',
    color: '#818cf8',
    textColor: '#e8e8ed',
    top: '52%',
    enter: HTML_IN_FRAME,
  },
  {
    format: 'GDoc',
    example: 'meeting notes',
    color: '#f472b6',
    textColor: '#0c0c0f',
    top: '67%',
    enter: GDOC_IN_FRAME,
  },
] as const;

const MD_FILES = [
  {
    filename: 'annual-report.md',
    source: 'from PDF',
    top: '20%',
    enter: MD_EMERGE_F1_FRAME,
    clicked: true,
  },
  {
    filename: 'case-study.md',
    source: 'from DOCX',
    top: '34%',
    enter: MD_EMERGE_F2_FRAME,
    clicked: false,
  },
  {
    filename: 'blog-post.md',
    source: 'from HTML',
    top: '48%',
    enter: MD_EMERGE_F3_FRAME,
    clicked: false,
  },
  {
    filename: 'meeting-notes.md',
    source: 'from GDoc',
    top: '62%',
    enter: MD_EMERGE_F4_FRAME,
    clicked: false,
  },
] as const;

const TITLE_EASING = Easing.bezier(0.16, 1, 0.3, 1);

export const DocumentScene: FC = () => {
  const theme = useTheme();
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(
    frame - TITLE_IN_FRAME,
    [0, 12, 18],
    [0, 1, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: TITLE_EASING },
  );
  const titleTy = interpolate(frame - TITLE_IN_FRAME, [0, 12], [-6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: TITLE_EASING,
  });

  const captionOpacity = interpolate(
    frame - CAPTION_IN_FRAME,
    [0, 12],
    [0, 0.9],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const sceneOpacity = interpolate(
    frame,
    [SCENE_FADE_OUT_FRAME, SCENE_FADE_OUT_FRAME + 8],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
        overflow: 'hidden',
        fontFamily: monoStack,
        opacity: sceneOpacity,
      }}
    >
      {/* Title, top-left */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '6%',
          color: theme.text,
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          opacity: titleOpacity,
          transform: `translateY(${titleTy}px)`,
        }}
      >
        The Document
        <div
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: theme.textDim,
            marginTop: 10,
            letterSpacing: '0.02em',
          }}
        >
          0:05 – 0:15 · scene 2
        </div>
      </div>

      {/* Dashed normalize pipe */}
      <NormalizeBlock
        appearFrame={NORMALIZE_APPEAR_FRAME}
        activateFrame={NORMALIZE_ACTIVATE_FRAME}
        fadeFrame={NORMALIZE_FADE_FRAME}
      />

      {/* Four input format cards */}
      {FORMAT_CARDS.map((c) => (
        <FormatCard
          key={c.format}
          format={c.format}
          example={c.example}
          color={c.color}
          textColor={c.textColor}
          top={c.top}
          enterFrame={c.enter}
          flowStartFrame={CARDS_FLIGHT_FRAME}
          targetXPx={FLIGHT_TARGET_PX}
        />
      ))}

      {/* Four .md files on the right */}
      {MD_FILES.map((f) => (
        <MdFile
          key={f.filename}
          filename={f.filename}
          source={f.source}
          top={f.top}
          enterFrame={f.enter}
          clicked={f.clicked}
          clickFrame={CURSOR_CLICK_FRAME}
        />
      ))}

      {/* Cursor — bottom-right → first file, click dip, then fade */}
      <Cursor
        from={{ x: '88%', y: '82%' }}
        to={{ x: '70%', y: '25%' }}
        startFrame={CURSOR_APPEAR_FRAME}
        arriveFrame={CURSOR_ARRIVE_FRAME}
        clickFrame={CURSOR_CLICK_FRAME}
        fadeOutFrame={CURSOR_FADE_FRAME}
      />

      {/* Expanded structured-markdown card */}
      <MdDocument
        content={SAMPLE_MARKDOWN_CARD}
        emergeFrame={MD_CARD_EXPAND_FRAME}
      />

      {/* Caption — bare, centered at bottom */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '4%',
          textAlign: 'center',
          color: theme.textMuted,
          fontSize: 24,
          letterSpacing: '0.02em',
          opacity: captionOpacity,
          fontFamily: monoStack,
        }}
      >
        {renderCaption(CAPTIONS.document, theme.accent)}
      </div>
    </AbsoluteFill>
  );
};

// Split the caption on ` → ` so the arrow can be styled in mint-accent.
function renderCaption(text: string, accent: string): JSX.Element[] {
  const parts = text.split(' → ');
  if (parts.length < 2) return [<span key="0">{text}</span>];
  const out: JSX.Element[] = [];
  for (let i = 0; i < parts.length; i += 1) {
    out.push(<span key={`t${i}`}>{parts[i]}</span>);
    if (i < parts.length - 1) {
      out.push(
        <span
          key={`a${i}`}
          style={{ color: accent, fontWeight: 700, margin: '0 14px' }}
        >
          →
        </span>,
      );
    }
  }
  return out;
}

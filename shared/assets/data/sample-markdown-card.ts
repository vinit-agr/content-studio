// shared/assets/data/sample-markdown-card.ts
// Structured content for the expanded-markdown card rendered in Scene 2 of
// the chunk-vs-span pilot. Kept as an object (not raw markdown) so the scene
// can style the syntax literally (#, ##, **) without running a parser.
export const SAMPLE_MARKDOWN_CARD = {
  filename: 'annual-report.md',
  badge: 'LLM-native',
  heading: '# 2024 Annual Report',
  paragraph: {
    before: 'Q3 revenue grew ',
    highlight: '**32%**',
    after: ' year-over-year, led by enterprise adoption.',
  },
  subheading: '## Highlights',
  bullets: [
    'Expanded to 18 new markets',
    'Shipped Tars v4.0',
    '2.4M active developers',
  ],
} as const;

export type SampleMarkdownCard = typeof SAMPLE_MARKDOWN_CARD;

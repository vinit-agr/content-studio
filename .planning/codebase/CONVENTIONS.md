# Coding Conventions

**Analysis Date:** 2026-04-21

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `TitleCard.tsx`, `Document.tsx`)
- Utility/data modules: camelCase with `.ts` extension (e.g., `frames.ts`, `captions.ts`, `colors.ts`)
- Index files: `index.ts` or `index.tsx` for barrel exports
- Config files: descriptive names matching function (e.g., `remotion.config.ts`)

**Functions & Components:**
- React FC components: PascalCase, named exports (e.g., `export const TitleCard: FC<Props> = ...`)
- Utility functions: camelCase (e.g., `loadFonts()`, `fadeIn()`)
- Custom hooks: camelCase with `use` prefix (e.g., `useTheme()`, `useCurrentFrame()`)
- Arrow functions preferred for hooks, function declarations for generic HOCs to avoid TSX parsing ambiguity

Example from `Root.tsx`:
```typescript
// Function declaration (not arrow) avoids TSX generic ambiguity
function withTheme<P extends object>(Inner: ComponentType<P>): FC<P> {
  const Wrapped: FC<P> = (props) => (
    <ThemeProvider theme={cxAgentEvalsTheme}>
      <Inner {...props} />
    </ThemeProvider>
  );
  return Wrapped;
}
```

**Variables:**
- camelCase for let/const
- UPPERCASE for constants with immutable values (e.g., `TOTAL_DURATION_FRAMES`, `FPS`)
- Readonly types for config objects: `as const satisfies Record<...>`

Example from `frames.ts`:
```typescript
export const SCENES = {
  intro: { start: 0, duration: 150 },
  document: { start: 150, duration: 300 },
  // ...
} as const satisfies Record<string, { start: number; duration: number }>;

export const TOTAL_DURATION_FRAMES = 2700;
```

**Types & Interfaces:**
- Use `type` for most definitions (preferred over `interface`)
- Props types named as `{ComponentName}Props` (e.g., `TitleCardProps`, `DocumentProps`)
- Import types with `type` keyword: `import type { ComponentType, FC } from 'react'`
- Suffix utility types with their purpose (e.g., `EasingFn`, `ChunkIndex`)

Example from `TitleCard.tsx`:
```typescript
export type TitleCardProps = {
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  enter?: 'fade' | 'slide' | 'none';
  style?: CSSProperties;
  className?: string;
};

export const TitleCard: FC<TitleCardProps> = ({ title, ... }) => { ... };
```

## Code Style

**Formatting:**
- Prettier 3.3.0 enforces formatting
- Config: `.prettierrc` - semi: true, singleQuote: true, trailingComma: all, printWidth: 100, arrowParens: always

**Linting:**
- ESLint 9.0.0 with typescript-eslint 8.0.0
- Config: `eslint.config.js` (flat config format)
- Rule: `@typescript-eslint/no-unused-vars` warns on unused variables, allows `_` prefix for intentional ignores

**TypeScript Strictness:**
- `tsconfig.base.json`: ES2022 target, ESNext module, strict mode enabled
- `noUncheckedIndexedAccess: true` — prevents unsafe object key access
- `noImplicitOverride: true` — requires explicit override keyword for inherited methods
- `resolveJsonModule: true` — allows importing JSON files as modules
- `isolatedModules: true` — enforces module boundaries
- `forceConsistentCasingInFileNames: true` — prevents case sensitivity issues

## Import Organization

**Order:**
1. External/node modules (React, Remotion, third-party)
2. Path aliases (@shared, @theme, @primitives)
3. Relative imports (./sibling or ../../parent)

Example from `TitleCard.tsx`:
```typescript
import type { CSSProperties, FC } from 'react';  // React types
import { AbsoluteFill, useCurrentFrame } from 'remotion';  // Remotion
import { monoStack } from '@theme/fonts';  // Path alias (shared theme)
import { fadeIn, slideIn } from '@theme/easings';  // Path alias
import { useTheme } from '../theme';  // Relative (same directory level)
```

**Path Aliases:**
- `@shared/*` → `shared/*` — shared utilities, theme, assets
- `@theme/*` → `shared/theme/*` — theme-specific exports
- `@primitives` → `tools/remotion/src/primitives/index` — component library
- `@primitives/*` → `tools/remotion/src/primitives/*` — individual primitives

Config in `tsconfig.json` and `remotion.config.ts` (webpack alias) must stay synchronized.

## Export Patterns

**Barrel Files:**
- `index.ts/tsx` files export named exports and re-export types
- Example from `primitives/index.ts`:
```typescript
export { TitleCard, type TitleCardProps } from './TitleCard';
export { Caption, type CaptionProps } from './Caption';
export { Document, type DocumentProps } from './Document';
```

**Type-only Exports:**
- Props types always exported with `type` keyword
- Example: `export type DocumentProps = { ... }`

## React/Remotion Component Patterns

**Function Component Structure:**
```typescript
export type ComponentNameProps = {
  requiredProp: string;
  optionalProp?: string;
  styleOverride?: CSSProperties;
};

export const ComponentName: FC<ComponentNameProps> = ({ 
  requiredProp, 
  optionalProp = 'default',
  styleOverride,
}) => {
  const theme = useTheme();
  const frame = useCurrentFrame();
  
  // Logic
  
  return (
    <AbsoluteFill style={{ ...baseStyle, ...styleOverride }}>
      {/* Content */}
    </AbsoluteFill>
  );
};
```

**Theme Integration:**
- All components use `useTheme()` hook to access design tokens
- Style spread pattern: base styles → theme values → props overrides
- Never hardcode colors; always use `theme` object properties

**Animation Primitives:**
- `useCurrentFrame()` from Remotion for frame-based animation logic
- Easing functions imported from `@theme/easings` (fadeIn, slideIn, pulseDot, spanGlow)
- `interpolate()` for frame-to-value transitions

## Error Handling

**Strategy:**
- Throw descriptive Error with context
- Validate required runtime conditions at module load time (see frames.ts pattern)
- Props validation happens at component render time

**Patterns:**

From `Document.tsx`:
```typescript
if (revealDurationFrames === undefined) {
  throw new Error(`Document: revealDurationFrames is required when reveal="${reveal}"`);
}
```

From `frames.ts` (runtime validation):
```typescript
if (start !== expectedStart) {
  throw new Error(
    `SCENES contiguity error: "${name}" starts at ${start}, expected ${expectedStart}`,
  );
}
```

- Always include context (component name, parameter name) in error messages
- Use template literals for parameterized errors
- Validate invariants at module load to fail fast

## Logging

**Framework:** `console` methods (no special logging library)

**Patterns:**
- No active console.log calls in source code
- Use comments with purpose statement above complex logic instead
- Document design decisions inline for future maintainers

Example from `frames.ts`:
```typescript
// Leaf module — no other imports. Prevents circular imports between
// index.tsx (registers scenes) and captions.ts (needs SceneName).
```

## Comments

**When to Comment:**
- Architecture decisions that aren't obvious from code (circular import prevention)
- Design trade-offs (function vs arrow function for generics)
- Non-standard patterns or workarounds

**Style:**
- Use `//` for line comments, `/* */` for blocks
- Capitalize first letter, end with period for complete sentences
- Short comments on same line as code for minor clarifications

Example from `Root.tsx`:
```typescript
// NOTE: `function` declaration (not arrow) avoids TSX generic ambiguity
// where `<P ...>` at the start of an arrow parameter list can be misread.
function withTheme<P extends object>(Inner: ComponentType<P>): FC<P> {
```

## Naming Edge Cases

**Stubs and TODOs:**
- Mark incomplete implementations with `STUB:` comment prefix
- Example from `Chunk.tsx`:
```typescript
// STUB: shows the chunk index + text with a palette-matched border.
// Upgrade: animate into existence when the containing chunk is "retrieved".
```

**Module-level Comments:**
- First line of file often includes file path as comment (e.g., `// tools/remotion/src/Root.tsx`)
- Helps with IDE navigation and context

## Type Strictness in Practice

- No `any` usage observed
- Generic constraints used (e.g., `<P extends object>`)
- CSSProperties for style props (from React.CSSProperties)
- Readonly arrays in config: `chunks: readonly [string, string, string, string, string]`
- Const assertions: `as const satisfies Record<...>` for type-safe config objects

---

*Convention analysis: 2026-04-21*

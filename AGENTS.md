<!-- intent-skills:start -->

## Skill Loading

Before substantial work:

- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load <package>#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

# AGENTS.md - Development Guidelines for Photo Album TanStack

This document provides essential guidelines for agentic coding agents working in this photo-album-tanstack repository.

## Build & Development Commands

### Core Development

```bash
bun run dev          # Start development server on port 3000
bun run build        # Production build
bun run serve        # Preview production build
bun run preview      # Build and preview
bun run deploy       # Build and deploy to Cloudflare Workers
```

### Testing

```bash
bun test             # Run all tests
bun run test         # Alternative test command
```

Tests live next to the code they cover as `*.test.ts` / `*.test.tsx` (for
example `src/utils/photo.test.ts`) and run under Vitest + Testing Library.
`vitest.config.ts` deliberately omits the Cloudflare plugin, so tests must not
depend on workerd bindings.

### Additional Commands

```bash
bun run cf-typegen   # Generate Cloudflare Workers types
```

## Architecture Overview

### Framework Stack

- **TanStack Start** - Full-stack React framework with SSR
- **TanStack Router** - File-based routing with TypeScript support
- **React 19.2.0** - Latest React with hooks and concurrent features
- **TypeScript** - Strict configuration with ES2022 target
- **StyleX** (`@stylexjs/stylex`, built by `@stylexjs/unplugin`) - styling for
  all new code; **Base UI** (`@base-ui/react`) - unstyled accessible primitives
- **MUI v7 with Pigment CSS** - legacy, being migrated away from component by
  component; do not add new MUI usage
- **Cloudflare Workers** - Deployment target

### Project Structure

```
src/
├── routes/          # File-based routing (TanStack Router)
├── components/      # Reusable React components
│   └── ui/          # StyleX + Base UI primitives (Button, Text, Dialog, ...)
├── styles.css       # Global styles
└── api/            # Server functions and API endpoints
```

## Code Style Guidelines

### Imports Organization

```typescript
// 1. React and framework imports
import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

// 2. UI component imports (grouped by library)
import { Container, Typography, Box, Card } from '@mui/material'
import { Home, Menu } from '@mui/icons-material'

// 3. Local imports
import Header from '../components/Header'
import { Album } from '../types'
```

### Component Patterns

#### Functional Components

```typescript
// Always use functional components with TypeScript
export default function PhotoAlbum({ albums }: { albums: Album[] }) {
  // Hooks at the top
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Event handlers
  const handleAlbumClick = (id: string) => {
    navigate({ to: `/albums/${id}` })
  }

  // JSX
  return (
    <Container>
      {/* Component content */}
    </Container>
  )
}
```

#### Route Components

```typescript
export const Route = createFileRoute('/albums/$id')({
  component: AlbumPage,
  loader: async ({ params }) => {
    // Server-side data loading
    return getAlbum(params.id)
  },
})

function AlbumPage() {
  const album = Route.useLoaderData()
  // Component logic
}
```

### TypeScript Guidelines

- **Never use `any` type**: Always define or import appropriate interfaces/types instead of using `any`.

#### Interface Definitions

```typescript
interface Album {
  id: string
  title: string
  description?: string // Optional properties
  cover_photo?: {
    url: string
    width: number
    height: number
  }
  photo_count: number
  created_at: string
}

interface User {
  id: string
  name: string
  email: string
}
```

#### Server Functions

```typescript
const getAlbums = createServerFn({
  method: 'GET',
}).handler(async () => {
  // Server-side logic
  return { albums: [] }
})
```

### Styling Patterns

New UI is styled with StyleX and built on Base UI primitives. MUI + Pigment
remain only in components not yet migrated.

#### StyleX

```typescript
import * as stylex from '@stylexjs/stylex'
import { breakpoints } from '@/styles/breakpoints.stylex'
import { colors, elevation, space } from '@/styles/tokens.stylex'

const styles = stylex.create({
  card: {
    padding: { default: space.s2, [breakpoints.smUp]: space.s3 },
    boxShadow: elevation.e1,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colors.divider,
    transition: 'transform 0.2s',
    // Pseudo-classes and media queries are conditions inside a property.
    transform: { default: null, ':hover': 'translateY(-4px)' },
  },
})

export function Card({ xstyle }: { xstyle?: stylex.StyleXStyles }) {
  return <div {...stylex.props(styles.card, xstyle)} />
}
```

- Tokens live in `src/styles/tokens.stylex.ts` (MUI default theme values:
  palette, 8px `space` grid, `radii`, `elevation` shadows, type scale, motion,
  z-index) and `src/styles/breakpoints.stylex.ts` (MUI xs/sm/md/lg/xl media
  queries via `defineConsts`). Use them instead of literals. `.stylex.ts` files
  may only export `defineVars` / `defineConsts`.
- Always `import * as stylex from '@stylexjs/stylex'`; call `stylex.create` at
  module top level. Accept an `xstyle?: stylex.StyleXStyles` prop for caller
  overrides and pass it last to `stylex.props`.
- **No border shorthands in `stylex.create`.** StyleX silently drops `border`,
  `borderTop/Right/Bottom/Left`, `borderBlock*` and `borderInline*` (any value,
  even `'none'` or `0`). Use longhands: `borderWidth`, `borderStyle`,
  `borderColor`, `borderTopWidth`, ... The Biome plugin
  `biome-plugins/no-stylex-border-shorthand.grit` enforces this in
  `bun run check`. Multi-value `padding` / `margin` / `borderRadius` are fine.
- Never put StyleX styles on MUI components: StyleX output lives in CSS
  `@layer`s and unlayered MUI/Pigment CSS beats it. Convert whole components.
- Global base styles go in `src/styles/app.css` inside `@layer reset` (StyleX
  layers are declared after it). It is side-effect imported from `__root.tsx`;
  never link it with `?url`, since StyleX appends its build output to it.
- In dev, StyleX rules are served from `/virtual:stylex.css` and kept fresh by
  `virtual:stylex:runtime` (both wired up in `__root.tsx`).
- Tests: vitest compiles StyleX with runtime injection, so component tests can
  assert `getComputedStyle(el)` for literal values; token references resolve to
  `var(--...)` strings (`styleOf` in `src/components/ui/test-utils.tsx`
  resolves them to the token's value). jsdom drops shorthands containing a
  `var()` (e.g. `padding: var(--x)`), so assert longhands for those, and
  StyleX minifies values (`'translate(14px,-9px) scale(.75)'`).

#### UI primitives (`src/components/ui`)

Build pages from these instead of MUI; import from `@/components/ui`. They
mirror the MUI components (and default theme) they replace, so props look
familiar: `Button` (`variant`, `size`, `color`, `startIcon`, `href`),
`IconButton`, `Text` (Typography: `variant`, `color`, `as`, `gutterBottom`),
`Container`, `Stack` (`direction` / `gap` in 8px units, responsive objects
like `{ xs: 'column', sm: 'row' }`), `Paper` / `Card` (+ `CardMedia`,
`CardContent`, `CardActions`), `Alert`, `Chip`, `TextField`, `Table*`,
`LinearProgress` / `CircularProgress`, `Dialog*`, `Menu` / `MenuItem`,
`Tooltip`, `Toast`, `Avatar`, `Link` / `Anchor` and the `*Icon` set.
`/admin/ui` renders every primitive and variant for manual testing.

- Every primitive takes `xstyle` for layout overrides (margins, flex, width);
  there is no `sx`. `className` is not supported: two `stylex.props` results
  concatenated as class strings do not override each other predictably.
- Router links: `<Link to="/albums/$slug" params={{ slug }}>` (type-safe,
  MUI Link look); buttons and text render as links via
  `render={<RouterLink to="/admin" />}` (TanStack's own `Link`, never the
  styled ui `Link`, whose classes would clash) or `href="..."`.
- Palette colors go through the `tone` vars (`tone.stylex.ts` / `tone.ts`):
  apply `toneStyles[color]` first, then read `tone.main`, `tone.hover`, ...
- Toasts need a `ToastProvider` above them. `<Toast open={Boolean(error)}
  severity="error" onClose={clearError}>` replaces the Snackbar + Alert
  pattern; `useToast().show({ message })` is the imperative form.
- While MUI's `CssBaseline` is loaded, its unlayered `* { box-sizing:
  inherit }` beats StyleX, so do not rely on `boxSizing: 'content-box'`.

### Naming Conventions

#### Files

- Components: `PascalCase.tsx` (`PhotoAlbum.tsx`)
- Routes: `kebab-case.tsx` (`photo-album.tsx`)
- Types: `PascalCase.ts` (`Album.ts`)
- Utilities: `camelCase.ts` (`formatDate.ts`)

#### Variables

- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Interfaces: `PascalCase` with `I` prefix avoided

```typescript
const API_BASE_URL = 'https://api.example.com'
const photoAlbum = ref<Album>(null)
const handleAlbumClick = (id: string) => navigate({ to: `/albums/${id}` })
```

### Error Handling

#### Async Operations

```typescript
async function loadAlbum(id: string) {
  try {
    const album = await getAlbum(id)
    return album
  } catch (error) {
    console.error('Failed to load album:', error)
    throw new Error(`Unable to load album: ${id}`)
  }
}
```

#### Component Error Boundaries

```typescript
// Use TanStack's error handling where possible
export const Route = createFileRoute('/albums/$id')({
  component: AlbumPage,
  errorComponent: ({ error }) => (
    <Container>
      <Typography color="error">
        Failed to load album: {error.message}
      </Typography>
    </Container>
  ),
})
```

### State Management

#### Local State

```typescript
// Use useState for local component state
const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)

// Use useReducer for complex state
type AlbumAction =
  | { type: 'SELECT_ALBUM'; payload: Album }
  | { type: 'CLEAR_SELECTION' }
```

#### Server State

```typescript
// Use TanStack Router loaders for server state
export const Route = createFileRoute('/albums')({
  loader: async () => {
    const albums = await getAlbums()
    return { albums }
  },
})

// Access loader data
function AlbumList() {
  const { albums } = Route.useLoaderData()
}
```

## Development Best Practices

### SSR Considerations

- Use TanStack's SSR features for data loading
- Avoid browser-only APIs in server code
- Test both client and server rendering modes

### Performance

- Use lazy loading for large components
- Implement proper image optimization
- Leverage TanStack's streaming capabilities

### Accessibility

- Use semantic HTML elements
- Implement proper ARIA labels
- Test with keyboard navigation
- Prefer Base UI primitives for interactive widgets (dialogs, menus, tooltips)

## Testing Guidelines

Tests sit beside the module under test and are run by `bun run test`
(`vitest run`). Assert literal expected values rather than recomputing them
from the module's own exports, or the test proves nothing. Module-level
constants derived from `import.meta.env` are captured at import time: to cover
a different value, use `vi.stubEnv(...)` plus `vi.resetModules()` and a dynamic
`await import('./module')` (see `src/utils/photo.test.ts`).

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AlbumCard from './AlbumCard'

describe('AlbumCard', () => {
  it('renders album title', () => {
    const album = { id: '1', title: 'Test Album', photo_count: 10 }
    render(<AlbumCard album={album} />)
    expect(screen.getByText('Test Album')).toBeInTheDocument()
  })
})
```

## Deployment Notes

### Cloudflare Workers

- Use `bun run deploy` for production and `bun run deploy:staging` for staging.
  The environment is selected **at build time** via `CLOUDFLARE_ENV`, which the
  Cloudflare Vite plugin bakes into `dist/server/wrangler.json`; `wrangler
  deploy` ignores `--env` against that config, so never run
  `wrangler deploy --env staging` by hand.
- Types generated with `bun run cf-typegen` (`wrangler types`)

### Configuration surfaces

There are three, and they are not interchangeable:

1. **Runtime `vars`** — non-secret values in `wrangler.jsonc`. Named
   environments do not inherit them, so every entry must be mirrored under
   `env.staging`. Read from the Worker `Env` binding.
2. **Build-time `VITE_*`** — `.env`, `.env.staging`, ... loaded by Vite per
   `--mode` and inlined at build time. Read via `import.meta.env`; never put
   secrets here, they end up in the client bundle.
3. **Secrets** — `.dev.vars` locally (gitignored), `wrangler secret put NAME
   [--env staging]` per deployed environment, and declared in `wrangler.jsonc`
   under `secrets.required` (top level *and* `env.staging`) so `wrangler types`
   is deterministic.

### Build Process

- Production builds include SSR optimization
- Static assets served from CDN
- Environment-specific configurations handled by Vite

## Common Patterns

### Navigation

```typescript
const navigate = useNavigate()
navigate({ to: '/albums' })
navigate({ to: '/albums/$id', params: { id: albumId } })
```

### Form Handling

```typescript
const [formData, setFormData] = useState({ title: '', description: '' })

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    await createAlbum(formData)
    navigate({ to: '/albums' })
  } catch (error) {
    setError(error.message)
  }
}
```

### Data Fetching

```typescript
// Server function
const createAlbum = createServerFn({
  method: 'POST',
}).handler(async (data: CreateAlbumData) => {
  // Validation and creation logic
  return { success: true, album: newAlbum }
})

// Client usage
const mutation = useMutation({
  mutationFn: createAlbum,
  onSuccess: () => navigate({ to: '/albums' }),
})
```

## Tool Configuration

### TypeScript

- Strict mode enabled
- No unused locals/parameters
- Path aliases: `@/*` → `./src/*`

### Prettier

- Single quotes
- No semicolons
- Trailing commas

### Vite

- Development server on port 3000
- Hot module replacement
- TypeScript with path aliases
- StyleX via `@stylexjs/unplugin` (Pigment CSS still loaded for legacy MUI)
- Cloudflare Workers environment

This document serves as the primary reference for maintaining code consistency and leveraging the TanStack ecosystem effectively.

# AGENTS.md - Development Guidelines for Photo Album TanStack

This document provides essential guidelines for agentic coding agents working in this photo-album-tanstack repository.

## Build & Development Commands

### Core Development

```bash
npm run dev          # Start development server on port 3000
npm run build        # Production build
npm run serve        # Preview production build
npm run preview      # Build and preview
npm run deploy       # Build and deploy to Cloudflare Workers
```

### Testing

```bash
npm test             # Run all tests
npm run test         # Alternative test command
```

_Note: Testing infrastructure exists with Vitest + Testing Library, but no test files exist yet._

### Additional Commands

```bash
npm run cf-typegen   # Generate Cloudflare Workers types
```

## Architecture Overview

### Framework Stack

- **TanStack Start** - Full-stack React framework with SSR
- **TanStack Router** - File-based routing with TypeScript support
- **React 19.2.0** - Latest React with hooks and concurrent features
- **TypeScript** - Strict configuration with ES2022 target
- **MUI v7.3.7** - Primary UI component library with Pigment CSS
- **Tailwind CSS v4** - Utility-first CSS for layouts
- **Cloudflare Workers** - Deployment target

### Project Structure

```
src/
├── routes/          # File-based routing (TanStack Router)
├── components/      # Reusable React components
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

#### MUI with Pigment CSS

```typescript
// Use sx prop for component-level styling
<Card
  sx={{
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 4,
    },
  }}
>
```

#### Tailwind for Layout

```typescript
// Use Tailwind for layout utilities
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

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
- Use MUI's built-in accessibility features

## Testing Guidelines

When adding tests (currently none exist):

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

- Use `npm run deploy` for production deployment
- Environment variables configured in `wrangler.jsonc`
- Types generated with `npm run cf-typegen`

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
- Pigment CSS integration
- Cloudflare Workers environment

This document serves as the primary reference for maintaining code consistency and leveraging the TanStack ecosystem effectively.


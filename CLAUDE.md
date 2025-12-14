# Campaign Ally

## Project Overview

Campaign Ally is an AI-powered campaign management tool designed specifically for D&D Dungeon Masters. It serves as an intelligent co-pilot that helps DMs organize, manage, and enhance their tabletop RPG campaigns.

### Core Purpose
- Assist Dungeon Masters with campaign organization and management
- Provide AI-powered tools for content generation and session planning
- Maintain persistent world state and campaign history
- Support real-time session management

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (dark theme default)
- **Authentication & Database**: Supabase
- **Package Manager**: npm

## Project Structure

```
campaign-ally-v2/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout with dark theme
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles + CSS variables
├── components/            # Shared React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and configurations
│   ├── utils.ts          # Utility functions (cn, etc.)
│   └── supabase/         # Supabase client configuration
│       ├── client.ts     # Browser client
│       ├── server.ts     # Server client
│       └── middleware.ts # Auth middleware helpers
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── public/               # Static assets
│   └── images/           # Logo files
└── middleware.ts         # Next.js middleware (auth)
```

## Architecture Decisions

### Authentication
- Supabase Auth with SSR support
- Middleware-based session management
- Server-side auth checks for protected routes

### Styling
- Dark theme by default (gray-900 background)
- Cyan/teal accent color (#14b8a6 to #0d9488 gradient)
- CSS variables for theming (shadcn/ui pattern)

### State Management
- Server Components by default
- Client-side state with React hooks when needed
- Supabase for persistent data

## Coding Conventions

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Prefer interfaces over types for object shapes
- Use `type` for unions and intersections

### React
- Functional components only
- Server Components by default, Client Components when needed
- Use `'use client'` directive explicitly
- Prefer composition over inheritance

### Naming
- PascalCase for components: `CampaignCard.tsx`
- camelCase for utilities: `formatDate.ts`
- kebab-case for routes: `app/campaign-details/`
- SCREAMING_SNAKE_CASE for constants

### File Organization
- One component per file
- Co-locate related files (component + types + tests)
- Index exports for clean imports

### Imports
- Use `@/` path alias for absolute imports
- Group imports: external, internal, relative
- Prefer named exports

## Brand Colors

```css
--primary: #14b8a6     /* Teal 500 */
--primary-dark: #0d9488 /* Teal 600 */
--background: #111827   /* Gray 900 */
--foreground: #f9fafb   /* Gray 50 */
```

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

Required environment variables (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

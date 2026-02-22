# Building & Deploying — Voice Capture Dashboard (Frontend)

## Environment Variables

The `.env` file **MUST be committed to git** (Lovable requirement).

```env
VITE_API_URL=https://voice-capture-api-production.up.railway.app
VITE_SUPABASE_URL=https://hggwsdqjkwydiubhvrvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # Public anon key (safe in git)
```

Use `.env.local` (gitignored) for local-only overrides.

## Dependencies

Key dependencies beyond the base stack (React, Vite, Tailwind, shadcn/ui):

| Package | Purpose |
|---------|---------|
| `@dnd-kit/core` | Drag-and-drop primitives (DndContext, useDraggable, useDroppable) |
| `@dnd-kit/utilities` | DnD utility helpers (CSS transform) |
| `i18next` + `react-i18next` | Internationalization (9 namespaces, 3 locales) |
| `@supabase/supabase-js` | Supabase client |
| `@tanstack/react-query` | Server state management |

## Local Development

```bash
npm install
npm run dev    # http://localhost:5173 with hot reload
```

Vite proxies nothing — the frontend calls the backend API directly via `VITE_API_URL`. CORS on the backend allows `localhost:*`.

## Building

```bash
npm run build      # Production build → dist/
npm run build:dev  # Development build (with source maps)
npm run preview    # Preview the production build locally
```

## Testing

```bash
npm test           # Vitest (single run)
npm run test:watch # Vitest (watch mode)
```

## Linting

```bash
npm run lint       # ESLint
```

## Deploy to Lovable

**Platform:** Lovable (auto-deploy from GitHub on push to `main`)

### Critical Rules

1. **NEVER remove `.env` from git** — Lovable reads `VITE_*` vars directly from the committed `.env` file. It does NOT reliably inject env vars set in its dashboard into the Vite build. Removing `.env` causes `supabaseUrl is required` crash at runtime.

2. **`.env` only contains public keys** — The anon key and URLs are safe to commit. They're public by design (visible in browser network tab anyway).

3. **Use `.env.local` for local secrets** — This file is gitignored and won't affect production.

### Deploy Process

1. Push to `main` branch
2. Lovable detects the push, runs `npm run build`
3. Static files served from CDN
4. No server-side rendering

## Supabase Configuration

### Auth Settings

- Email/password authentication enabled
- Password reset redirect URL configured to `{site_url}/reset-password`
- Auto-confirm disabled (email verification required)

### Database Access

The frontend reads directly from Supabase for:
- `projects` — user's projects
- `recordings` — recordings per project

Row Level Security (RLS) policies ensure users only see their own data.

### Migrations

SQL migrations live in `supabase/migrations/`. They are NOT auto-deployed by Lovable for this project -- they must be run manually against the Supabase project.

| Migration | Purpose |
|-----------|---------|
| `003_project_folders.sql` | Creates `project_folders` table (user_id scoped, gen_random_uuid()), adds `folder_id` FK to `projects`, sets up RLS policies |

To apply a migration manually:
1. Go to the Supabase dashboard SQL editor for project `hggwsdqjkwydiubhvrvq`
2. Paste the migration SQL and run it
3. Alternatively, use `npx supabase db push` if the CLI is linked to the project

### Generated Types

Types are in `src/integrations/supabase/client.ts`. If the schema changes, regenerate with:

```bash
npx supabase gen types typescript --project-id hggwsdqjkwydiubhvrvq > src/integrations/supabase/types.ts
```

## URLs

| Service | URL |
|---------|-----|
| Frontend (prod) | Deployed via Lovable (custom domain TBD) |
| Backend API | https://voice-capture-api-production.up.railway.app |
| Supabase | https://hggwsdqjkwydiubhvrvq.supabase.co |
| GitHub (Frontend) | https://github.com/quack2025/genius-voice-dashboard |
| GitHub (Backend) | https://github.com/quack2025/genius-voice-capture |

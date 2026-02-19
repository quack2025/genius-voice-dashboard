# Building & Deploying — Voice Capture Dashboard (Frontend)

## Environment Variables

The `.env` file **MUST be committed to git** (Lovable requirement).

```env
VITE_API_URL=https://voice-capture-api-production.up.railway.app
VITE_SUPABASE_URL=https://hggwsdqjkwydiubhvrvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # Public anon key (safe in git)
```

Use `.env.local` (gitignored) for local-only overrides.

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

# Voice Capture Dashboard — Frontend

React + TypeScript dashboard for managing voice capture projects, transcriptions, organizations, and a super admin backoffice. Includes an AI help chat widget powered by Claude.

**Part of:** Genius Labs AI Suite
**Repos:** [Backend API](https://github.com/quack2025/genius-voice-capture) + Frontend (this)

## Quick Reference

| Item | Value |
|------|-------|
| Framework | Vite + React 18 + TypeScript |
| Styles | Tailwind CSS + shadcn/ui |
| State | React Context + TanStack Query |
| Drag-and-drop | @dnd-kit/core + @dnd-kit/utilities |
| i18n | i18next (es/en/pt) — 9 namespaces |
| Auth | Supabase Auth |
| Deploy | Lovable (auto-deploy from GitHub) |
| Backend API | https://voice-capture-api-production.up.railway.app |
| Supabase | https://hggwsdqjkwydiubhvrvq.supabase.co |

## Project Structure

```
src/
├── components/
│   ├── ui/                      # shadcn/ui (don't modify directly)
│   ├── DashboardLayout.tsx      # Layout: DndContext + FolderProvider + sidebar + outlet + HelpChat
│   ├── AppSidebar.tsx           # Two-zone navigation: Core Zone + Account Zone
│   ├── HelpChat.tsx             # Floating AI chat widget
│   ├── ProtectedRoute.tsx       # Auth guard
│   ├── AdminProtectedRoute.tsx  # Admin guard
│   ├── PlanBadge.tsx            # Plan badge component
│   ├── UsageBadge.tsx           # Usage indicator
│   ├── LanguageSwitcher.tsx     # Language selector
│   └── ErrorBoundary.tsx        # Error boundary
│   ├── folders/
│   │   ├── FolderSection.tsx        # Folder CRUD + 8-color picker in sidebar
│   │   └── DroppableFolderItem.tsx  # @dnd-kit useDroppable folder target
│   ├── dashboard/
│   │   └── DraggableProjectCard.tsx # @dnd-kit useDraggable with GripVertical handle
├── contexts/
│   ├── AuthContext.tsx           # Auth (login, register, signOut, forgotPassword)
│   └── FolderContext.tsx         # Folder state (CRUD, selectedFolderId, drag-to-folder)
├── hooks/
│   ├── use-toast.ts
│   └── useFormatters.ts         # Locale-aware formatting (date, number, currency, duration)
├── i18n/
│   ├── index.ts                 # Config (9 namespaces: common, auth, dashboard, projects, landing, admin, org, chat, folders)
│   └── locales/{es,en,pt}/      # Translation JSONs
├── integrations/supabase/
│   └── client.ts                # Supabase client + generated types
├── lib/
│   ├── api.ts                   # Main API client (export, health, account)
│   ├── adminApi.ts              # Admin API client (users, orgs, stats)
│   ├── chatApi.ts               # Chat API client (conversations, messages, images)
│   ├── orgApi.ts                # Organization API client
│   ├── plans.ts                 # Plan definitions (mirrors backend)
│   └── utils.ts                 # cn() helper
├── pages/
│   ├── Landing.tsx              # Public landing page
│   ├── Login.tsx, Register.tsx  # Auth pages
│   ├── ForgotPassword.tsx       # Forgot password
│   ├── ResetPassword.tsx        # Reset password (from email link)
│   ├── Dashboard.tsx            # Project list with counters
│   ├── NewProject.tsx           # Create project + widget snippet
│   ├── ProjectDetail.tsx        # Recordings tab + Export tab
│   ├── Recordings.tsx           # Global recordings list
│   ├── Export.tsx               # CSV export via backend
│   ├── Settings.tsx             # Account settings
│   ├── OrgSettings.tsx          # Organization management (owner)
│   ├── AdminDashboard.tsx       # Admin stats + users by plan
│   ├── AdminUsers.tsx           # Paginated user list + search
│   ├── AdminUserDetail.tsx      # User detail + change plan + toggle admin + reset password + delete
│   ├── AdminOrgs.tsx            # Organization list + create + search
│   └── AdminOrgDetail.tsx       # Org detail + edit + members + delete
├── App.tsx                      # Router (public, protected, admin routes)
└── main.tsx                     # Entry point
```

## Plans (4 tiers, mirrored from backend)

| Key | Display Name | Price | Responses/mo |
|-----|-------------|-------|-------------|
| free | Free | $0 | 100 |
| freelancer | Starter | $39 | 1,500 |
| pro | Pro | $199 | 10,000 |
| enterprise | Enterprise | $499 | 50,000 |

DB key is `freelancer`, display name is `Starter`.

## Commands

```bash
npm install      # Install deps
npm run dev      # Dev (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview build
npm test         # Vitest
```

## Critical: Lovable Deploy

**NEVER remove `.env` from git.** Lovable reads `VITE_*` vars from the committed `.env` file. Removing it causes `supabaseUrl is required` crash.

## Genius Labs AI Suite

Voice Capture is part of a 4-product suite sharing a unified HSL-based design system (primary #1E40AF), Genius Labs logo, consistent sidebar hierarchy, and shadcn/ui components. See [agent_docs/cross_product_context.md](agent_docs/cross_product_context.md) for cross-product details.

## Detailed Docs

- [agent_docs/architecture.md](agent_docs/architecture.md) — Routes, page map, API clients, data flow, folder system
- [agent_docs/building_and_deploying.md](agent_docs/building_and_deploying.md) — Env vars, Lovable deploy, Supabase, migrations
- [agent_docs/code_conventions.md](agent_docs/code_conventions.md) — Patterns, i18n, component conventions, DnD
- [agent_docs/cross_product_context.md](agent_docs/cross_product_context.md) — Cross-product context: the 4 Genius Labs AI Suite products, shared design system, sidebar structure

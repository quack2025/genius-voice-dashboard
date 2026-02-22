# Architecture — Voice Capture Dashboard (Frontend)

## System Overview

```
Dashboard (this repo)
  ├── Supabase direct read → projects, recordings (via supabase client)
  ├── Backend API calls → export, retranscribe, account, admin, org, chat
  └── Supabase Auth → login, register, signOut, password reset
```

## Routing (App.tsx)

### Public Routes
| Path | Page | Description |
|------|------|-------------|
| `/` | Landing | Public landing page |
| `/login` | Login | Email/password login |
| `/register` | Register | Email/password registration |
| `/forgot-password` | ForgotPassword | Send reset email |
| `/reset-password` | ResetPassword | Reset password (from email link) |

### Protected Routes (require auth)
| Path | Page | Description |
|------|------|-------------|
| `/dashboard` | Dashboard | Project list with response counters |
| `/projects/new` | NewProject | Create project + get widget snippet |
| `/projects/:id` | ProjectDetail | Recordings tab + Export tab |
| `/recordings` | Recordings | Global recordings list (all projects) |
| `/export` | Export | Select project + export CSV |
| `/settings` | Settings | Account settings |
| `/org` | OrgSettings | Organization management (owner only) |

### Admin Routes (require admin)
| Path | Page | Description |
|------|------|-------------|
| `/admin` | AdminDashboard | Stats cards + users by plan chart |
| `/admin/users` | AdminUsers | Paginated user list + search + change plan |
| `/admin/users/:id` | AdminUserDetail | Full user management (plan, admin, reset, delete) |
| `/admin/orgs` | AdminOrgs | Org list + create + search |
| `/admin/orgs/:id` | AdminOrgDetail | Org detail + edit + members + delete |

## Layout

```
DashboardLayout
├── DndContext (drag-and-drop context for folder assignments)
│   └── FolderProvider (folder state: CRUD, selectedFolderId)
│       ├── AppSidebar (fixed left, 256px, slide-in on mobile)
│       │   ├── Logo + mobile close button
│       │   ├── Core Zone
│       │   │   ├── Projects (FolderKanban icon, /dashboard)
│       │   │   ├── Recordings (Mic2 icon)
│       │   │   └── Export (Download icon)
│       │   ├── FolderSection (folder list with DroppableFolderItems, create/rename/delete, 8-color picker)
│       │   ├── ── Separator ──
│       │   ├── Account Zone
│       │   │   ├── Usage (BarChart3 icon, /settings?tab=usage)
│       │   │   ├── Billing (CreditCard icon, /settings?tab=billing)
│       │   │   └── Settings
│       │   ├── Admin section (if user is admin: dashboard, users, orgs)
│       │   └── User section (avatar, email, plan badge, language switcher, logout)
│       ├── Main content area (Outlet)
│       └── HelpChat (floating bottom-right)
```

The sidebar is divided into two navigation zones separated by a `Separator`:
- **Core Zone:** Primary workflow links (Projects, Recordings, Export) plus the folder list.
- **Account Zone:** Account-related links (Usage, Billing, Settings).

The Organization link was removed from the sidebar. Usage and Billing now link directly to the corresponding Settings tabs via query parameters.

## API Clients

### api.ts (main)
```typescript
exportApi.exportCsv(projectId, status) → { blob, filename }
healthApi.check() → { status, timestamp, version }
accountApi.getUsage() → UsageData (plan, limits, usage, org info)
```

### adminApi.ts
```typescript
adminApi.getStats() → AdminStats
adminApi.getUsers(page, search) → PaginatedUsers
adminApi.getUser(userId) → AdminUserDetail
adminApi.updateUserPlan(userId, plan) → PlanChangeResult
adminApi.deleteUser(userId)
adminApi.toggleAdmin(userId, isAdmin)
adminApi.resetPassword(userId)
adminApi.getOrgs() → { orgs: AdminOrg[] }
adminApi.createOrg(data) → CreateOrgResult
adminApi.getOrgDetail(orgId) → AdminOrgDetail
adminApi.updateOrg(orgId, data)
adminApi.deleteOrg(orgId)
```

### chatApi.ts
```typescript
chatApi.getConversations() → ChatConversation[]
chatApi.createConversation() → ChatConversation
chatApi.getMessages(conversationId) → ConversationMessagesResponse
chatApi.sendMessage(conversationId, content, imageUrl?, context?) → SendMessageResponse
chatApi.uploadImage(file) → { url: string }
```

### orgApi.ts
```typescript
orgApi.getOrg() → OrgData
orgApi.inviteMember(email) → result
orgApi.removeMember(userId) → result
orgApi.leaveOrg() → result
```

### Shared Pattern: fetchWithAuth
All API clients use `fetchWithAuth<T>(endpoint, options)`:
1. Gets JWT from `supabase.auth.getSession()`
2. Sets `Authorization: Bearer <token>` + `Content-Type: application/json`
3. Returns `{ success, data?, error? }`

Base URL: `import.meta.env.VITE_API_URL || 'https://voiceapi.survey-genius.ai'`

## Auth Flow (AuthContext.tsx)

- `login(email, password)` → Supabase `signInWithPassword`
- `register(email, password)` → Supabase `signUp`
- `signOut()` → Supabase `signOut` + redirect to `/login`
- `forgotPassword(email)` → Supabase `resetPasswordForEmail`
- `onAuthStateChange` listener updates user state
- `ProtectedRoute` checks auth, redirects to `/login`
- `AdminProtectedRoute` checks auth + `is_admin` via `accountApi.getUsage()`

## HelpChat Widget

Floating Intercom-style chat in bottom-right corner of dashboard.

- Collapsed: circle button with chat icon
- Expanded: 380x520 panel with conversation list, message history, image attachment
- Sends page context (`useLocation()`) and language to backend
- Daily message limit displayed as badge
- Optimistic message rendering (shows user message immediately before API response)

## Data Flow: Supabase vs Backend

| Data | Source | Method |
|------|--------|--------|
| Projects list | Supabase direct | `supabase.from('projects').select(...)` |
| Recordings list | Supabase direct | `supabase.from('recordings').select(...)` |
| Recording counts | Supabase direct | `.select('id', { count: 'exact', head: true })` |
| Usage/plan info | Backend API | `GET /api/account/usage` |
| CSV export | Backend API | `GET /api/projects/:id/export` (streaming) |
| Retranscribe | Backend API | `POST .../retranscribe` |
| Admin operations | Backend API | `/api/admin/*` |
| Chat | Backend API | `/api/chat/*` |
| Org management | Backend API | `/api/org/*` |
| Folders | Supabase direct | `supabase.from('project_folders').select(...)` |

## Folder System

### Overview

Users can organize projects into color-coded folders. Folders are scoped to the authenticated user (`user_id`). Projects can be dragged onto folders in the sidebar to assign them.

### Database

Migration: `supabase/migrations/003_project_folders.sql`

- Table `project_folders`: `id` (gen_random_uuid()), `user_id`, `name`, `color`, `created_at`, `updated_at`
- Column `projects.folder_id` (nullable FK to `project_folders.id`, ON DELETE SET NULL)
- RLS policies: users can only CRUD their own folders

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `FolderSection` | `src/components/folders/FolderSection.tsx` | Folder list in sidebar with CRUD operations + 8-color picker |
| `DroppableFolderItem` | `src/components/folders/DroppableFolderItem.tsx` | Each folder item is a drop target via `@dnd-kit/core` `useDroppable` |
| `DraggableProjectCard` | `src/components/dashboard/DraggableProjectCard.tsx` | Project cards are draggable via `@dnd-kit/core` `useDraggable`, with a `GripVertical` handle |

### Context

`FolderContext.tsx` provides:
- `folders` list, `selectedFolderId`, `setSelectedFolderId`
- `createFolder`, `updateFolder`, `deleteFolder`
- `assignProjectToFolder` (called on drag-end)

The `FolderProvider` wraps the dashboard layout inside `DndContext`. When a project card is dropped onto a folder, `DashboardLayout` handles the `onDragEnd` event and calls `assignProjectToFolder`.

### Dashboard Filtering

`Dashboard.tsx` reads `selectedFolderId` from `FolderContext`. When a folder is selected in the sidebar, only projects belonging to that folder are displayed. Selecting "All Projects" (no folder) shows all projects.

# Code Conventions — Voice Capture Dashboard (Frontend)

## General

- **Language**: TypeScript (strict mode)
- **Module system**: ES modules (`import`/`export`)
- **Framework**: React 18 with functional components + hooks
- **Bundler**: Vite
- **UI Library**: shadcn/ui (Radix primitives + Tailwind)
- **No emojis in code** unless explicitly requested

## File Organization

- Pages in `src/pages/` — one file per page, PascalCase
- Components in `src/components/` — reusable components, PascalCase
- UI primitives in `src/components/ui/` — shadcn/ui (don't modify directly)
- API clients in `src/lib/` — one file per domain (api.ts, adminApi.ts, chatApi.ts, orgApi.ts)
- Hooks in `src/hooks/` — custom hooks
- Contexts in `src/contexts/` — React contexts
- i18n in `src/i18n/locales/{es,en,pt}/` — JSON translation files per namespace

## Component Pattern

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function MyPage() {
  const { t } = useTranslation('namespace');
  const { t: tCommon } = useTranslation('common');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // ... component logic

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
      {/* content */}
    </div>
  );
}
```

## Internationalization (i18n)

### 8 Namespaces
`common`, `auth`, `dashboard`, `projects`, `landing`, `admin`, `org`, `chat`

### Languages
Spanish (es), English (en), Portuguese (pt). Fallback: `es`.

### Usage
```tsx
const { t } = useTranslation('admin');           // Primary namespace
const { t: tCommon } = useTranslation('common'); // Common namespace

t('userDetail.title')                            // Nested key
t('confirmDeleteUser', { email: user.email })    // Interpolation
tCommon('buttons.cancel')                        // Cross-namespace
```

### Detection & Persistence
- Auto-detect from browser (`navigator.language`)
- Stored in `localStorage` key `ui_language`
- Changed via `LanguageSwitcher` component in sidebar

### Adding New Keys
1. Add key to all 3 language files: `es/{ns}.json`, `en/{ns}.json`, `pt/{ns}.json`
2. Use from component with `useTranslation('namespace')`

## API Client Pattern

All clients in `src/lib/` follow the `fetchWithAuth<T>` pattern:

```typescript
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = await getAuthToken(); // from supabase.auth.getSession()
  // Sets Authorization + Content-Type headers
  // Returns { success, data?, error? }
}
```

Response type: `{ success: boolean; data?: T; error?: string }`

## Styling

- **Tailwind CSS** utility classes for all styling
- **shadcn/ui** color tokens: `text-foreground`, `bg-background`, `text-muted-foreground`, `bg-muted`, `text-primary`, `border-border`, `text-destructive`, `bg-destructive`
- **Responsive**: `md:` breakpoint for desktop, mobile-first
- **Sidebar**: Fixed `w-64`, slide-in on mobile with backdrop
- **Page layout**: `p-4 md:p-8` padding, `max-w-4xl mx-auto` for detail pages

## State Management

- **Auth**: `AuthContext` (Supabase auth state)
- **Server state**: Direct API calls in `useEffect` + local `useState` (no TanStack Query for API calls currently)
- **Supabase reads**: Direct `supabase.from().select()` in components
- **No global state store** (Redux/Zustand) — each page manages its own state

## Routing

- `BrowserRouter` from `react-router-dom`
- 3 route groups: public, protected (`ProtectedRoute`), admin (`AdminProtectedRoute`)
- All dashboard routes wrapped in `DashboardLayout` (sidebar + outlet + chat)
- Navigation via `<Link>` / `useNavigate()`

## Toast Notifications

```tsx
const { toast } = useToast();
toast({ title: t('success') });                                    // Default
toast({ title: t('error'), variant: 'destructive' });              // Error
toast({ title: t('error'), description: result.error, variant: 'destructive' }); // With detail
```

## Destructive Actions

Use `AlertDialog` for confirmations:
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
      <AlertDialogDescription>{t('deleteConfirm')}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{tCommon('buttons.cancel')}</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive ...">
        {tCommon('buttons.delete')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Plan Badge

```tsx
import PlanBadge from '@/components/PlanBadge';
<PlanBadge plan="freelancer" size="md" />  // Shows "Starter" with plan color
```

## Formatters

```tsx
const { formatDate, formatNumber, formatCurrency, formatDuration } = useFormatters();
formatDate(isoString)       // Locale-aware date
formatNumber(1234)          // "1,234" or "1.234"
formatDuration(seconds)     // "2:30"
```

## Path Aliases

`@/` maps to `src/` (configured in `tsconfig.json` + `vite.config.ts`):
```typescript
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/adminApi';
```

## Common Patterns

### Loading State
```tsx
if (loading) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}
```

### Back Button
```tsx
<Button variant="ghost" className="mb-4" asChild>
  <Link to="/admin/users">
    <ArrowLeft className="h-4 w-4 mr-2" />
    {t('backToUsers')}
  </Link>
</Button>
```

### Danger Zone Card
```tsx
<Card className="border-destructive/50">
  <CardHeader>
    <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
  </CardHeader>
  <CardContent>
    {/* AlertDialog with destructive action */}
  </CardContent>
</Card>
```

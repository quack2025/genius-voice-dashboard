# Voice Capture Dashboard - Contexto para Claude

## Descripcion

Dashboard frontend para gestionar proyectos de captura de voz con transcripcion automatica usando OpenAI Whisper. Los usuarios crean proyectos, obtienen un snippet para embeber en encuestas Alchemer, y gestionan las transcripciones resultantes.

## Stack

- **Frontend**: Vite + React 18 + TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: React Context + TanStack Query
- **i18n**: i18next (ES/EN/PT)
- **Auth**: Supabase Auth
- **Database**: Supabase PostgreSQL (lectura directa)
- **Backend API**: Express.js en Railway (export, retranscribe)
- **Deploy**: Lovable (auto-deploy desde GitHub)

## URLs

| Servicio | URL |
|----------|-----|
| Backend API | https://voice-capture-api-production.up.railway.app |
| Supabase | https://hggwsdqjkwydiubhvrvq.supabase.co |
| GitHub (Frontend) | https://github.com/quack2025/genius-voice-dashboard |
| GitHub (Backend) | https://github.com/quack2025/genius-voice-capture |

## Arquitectura

```
Widget (voice.js) --POST /api/transcribe--> Backend --Whisper--> DB (solo texto)
Dashboard (este repo) --lectura directa--> Supabase (projects, recordings)
Dashboard --API calls--> Backend (export CSV, retranscribe)
```

- **Transcripcion inmediata:** El widget envia audio al backend, Whisper transcribe en memoria, solo se guarda texto
- **audio_path nullable:** Recordings exitosos tienen audio_path = null. Solo los fallback (Whisper fallo 3x) tienen audio almacenado
- **Play button condicional:** Solo aparece si `recording.audio_path` existe

---

## Estructura del Proyecto

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── DashboardLayout.tsx    # Layout responsive con sidebar mobile
│   ├── AppSidebar.tsx         # Navegacion con slide-in mobile
│   ├── ProtectedRoute.tsx     # Auth guard
│   ├── ErrorBoundary.tsx      # Error boundary global
│   ├── AudioPlayerModal.tsx   # Reproductor (solo fallback recordings)
│   └── LanguageSwitcher.tsx   # Selector de idioma UI
├── contexts/
│   └── AuthContext.tsx        # Auth Supabase (login, register, signOut)
├── hooks/
│   ├── use-toast.ts
│   └── useFormatters.ts      # Formateo locale-aware (fecha, numero, moneda, duracion)
├── i18n/
│   ├── index.ts              # Config i18n (namespaces: common, auth, dashboard, projects)
│   └── locales/{es,en,pt}/   # Traducciones
├── integrations/supabase/
│   └── client.ts             # Cliente Supabase + tipos (audio_path: string | null)
├── lib/
│   ├── api.ts                # API client backend (exportApi, healthApi)
│   └── utils.ts              # cn() helper
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx          # Lista proyectos (contadores optimizados)
│   ├── NewProject.tsx         # Crear proyecto + snippet widget
│   ├── ProjectDetail.tsx      # 2 tabs: Recordings + Export
│   ├── Recordings.tsx         # Lista global todas las grabaciones
│   ├── Export.tsx             # Export CSV via backend API
│   └── Settings.tsx
├── App.tsx                    # Router (BrowserRouter)
└── main.tsx                   # Entry point
```

---

## Modelo de Datos (tipos en client.ts)

### Project
```typescript
{
  id: string;
  user_id: string;
  name: string;
  public_key: string;        // proj_xxx
  language: string;           // es, en, pt
  transcription_mode: string; // siempre 'realtime'
  created_at: string;
}
```

### Recording
```typescript
{
  id: string;
  project_id: string;
  session_id: string;
  audio_path: string | null;  // null = transcripcion exitosa (audio descartado)
  duration_seconds: number;
  status: string;              // pending | processing | completed | failed
  transcription: string | null;
  created_at: string;
}
```

---

## Paginas y Funcionalidad

| Pagina | Funcion |
|--------|---------|
| Dashboard | Lista proyectos con contadores de recordings (query optimizada) |
| NewProject | Formulario nombre + idioma. Al crear muestra snippet para Alchemer |
| ProjectDetail | Tab Recordings (tabla paginada + Play condicional) + Tab Export (CSV) |
| Recordings | Lista global de recordings de todos los proyectos |
| Export | Seleccionar proyecto + exportar CSV via backend |
| Settings | Configuracion de cuenta |

---

## API Client (api.ts)

```typescript
// Export CSV via backend
exportApi.exportCsv(projectId, status) -> { blob, filename }

// Health check
healthApi.check() -> { status, timestamp, version }
```

Todas las llamadas usan JWT de Supabase Auth via `Authorization: Bearer <token>`.

---

## Internacionalizacion (i18n)

- **Idiomas**: Espanol (es), English (en), Portugues (pt)
- **Namespaces**: common, auth, dashboard, projects
- **Deteccion**: Automatica por navegador
- **Persistencia**: localStorage (`ui_language`)
- **Selector**: LanguageSwitcher en sidebar y paginas auth
- **Hook**: `useTranslation('namespace')` para textos
- **Hook**: `useFormatters()` para fechas/numeros locale-aware

**Importante**: El idioma de UI es independiente del idioma de transcripcion del proyecto.

---

## Responsive Design

- **Desktop**: Sidebar fija a la izquierda (w-64, md:translate-x-0)
- **Mobile**: Hamburger menu + sidebar slide-in + backdrop overlay
- **DashboardLayout**: Controla estado open/close del sidebar
- **AppSidebar**: Acepta props `open`/`onClose`, cierra al navegar

---

## Deployment (Lovable)

**CRITICO**: El archivo `.env` DEBE estar commiteado en git. Lovable lee las variables `VITE_*` directamente del `.env` en el repo. No inyecta env vars de su dashboard al build de Vite.

```env
VITE_API_URL=https://voice-capture-api-production.up.railway.app
VITE_SUPABASE_URL=https://hggwsdqjkwydiubhvrvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...  # Clave publica (anon), segura en git
```

Usar `.env.local` (gitignored) para secretos locales.

---

## Comandos

```bash
npm install      # Instalar dependencias
npm run dev      # Desarrollo local (http://localhost:5173)
npm run build    # Build produccion
npm run preview  # Preview build
```

---

## Convenciones

- `useTranslation('namespace')` para todos los textos visibles
- `useFormatters()` para fechas, numeros, moneda, duracion
- Componentes en PascalCase
- Paginas en `src/pages/`
- UI components de shadcn/ui en `src/components/ui/`
- Tipos en el mismo archivo o en `client.ts`
- No usar emojis en codigo

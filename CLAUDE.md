# Voice Capture Dashboard - Contexto para Claude

## Descripción del Proyecto

Dashboard frontend para gestionar proyectos de captura de voz con transcripción automática usando OpenAI Whisper.

## Stack Tecnológico

- **Frontend**: Vite + React 18 + TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: React Context + TanStack Query
- **i18n**: i18next (ES/EN/PT)
- **Auth**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Backend API**: Express.js en Railway

## URLs Importantes

| Servicio | URL |
|----------|-----|
| Backend API | https://voice-capture-api-production.up.railway.app |
| Supabase | https://hggwsdqjkwydiubhvrvq.supabase.co |
| GitHub (Frontend) | https://github.com/quack2025/genius-voice-dashboard |
| GitHub (Backend) | https://github.com/quack2025/genius-voice-capture |

## Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── ui/              # shadcn/ui components
│   ├── AppSidebar.tsx   # Navegación principal
│   ├── AudioPlayerModal.tsx
│   └── LanguageSwitcher.tsx
├── contexts/
│   └── AuthContext.tsx  # Autenticación Supabase
├── hooks/
│   ├── use-toast.ts
│   └── useFormatters.ts # Formateo locale-aware
├── i18n/
│   ├── index.ts         # Configuración i18n
│   └── locales/         # Traducciones ES/EN/PT
├── integrations/
│   └── supabase/
│       └── client.ts    # Cliente Supabase + tipos
├── lib/
│   ├── api.ts           # Cliente API backend
│   └── utils.ts
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx    # Lista de proyectos
│   ├── NewProject.tsx   # Crear proyecto + snippet
│   ├── ProjectDetail.tsx # Grabaciones, batch, export
│   ├── Recordings.tsx   # Todas las grabaciones
│   ├── Export.tsx
│   └── Settings.tsx
├── App.tsx              # Router
└── main.tsx             # Entry point
```

## Modelo de Datos

### projects
- `id` (UUID)
- `user_id` (UUID) - FK auth.users
- `name` (TEXT)
- `public_key` (TEXT) - Para widget (proj_xxx)
- `language` (TEXT) - Idioma transcripción
- `transcription_mode` (TEXT) - realtime/batch
- `created_at` (TIMESTAMP)

### recordings
- `id` (UUID)
- `project_id` (UUID) - FK projects
- `session_id` (TEXT)
- `audio_path` (TEXT) - Path en Supabase Storage
- `duration_seconds` (INTEGER)
- `status` (TEXT) - pending/processing/completed/failed
- `transcription` (TEXT)
- `created_at` (TIMESTAMP)

## API Endpoints (Backend)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/projects/:id/transcribe-batch | Preparar batch |
| POST | /api/projects/:id/transcribe-batch/:bid/confirm | Confirmar batch |
| GET | /api/projects/:id/transcribe-batch/:bid | Status batch |
| GET | /api/projects/:id/export | Exportar CSV |

## Flujos Principales

### Autenticación
1. Usuario → Login/Register → Supabase Auth
2. Supabase → JWT Token → localStorage
3. API calls usan `Authorization: Bearer <token>`

### Transcripción Batch
1. Usuario pega Session IDs
2. Frontend → `batchApi.prepare()` → Backend analiza
3. Usuario confirma → `batchApi.confirm()` → Backend inicia
4. Frontend hace polling → `batchApi.getStatus()`
5. Backend → OpenAI Whisper → Actualiza DB

### Exportación
1. Usuario selecciona opciones
2. Frontend → `exportApi.exportCsv()` → Backend
3. Backend genera CSV → Response blob
4. Frontend descarga archivo

## Internacionalización (i18n)

- **Idiomas**: Español (es), English (en), Português (pt)
- **Namespaces**: common, auth, dashboard, projects
- **Detección**: Automática por navegador
- **Persistencia**: localStorage (`ui_language`)
- **Selector**: LanguageSwitcher en sidebar y auth pages

**Importante**: El idioma de UI es independiente del idioma de transcripción del proyecto.

## Comandos

```bash
npm install      # Instalar dependencias
npm run dev      # Desarrollo local (http://localhost:5173)
npm run build    # Build producción
npm run preview  # Preview build
```

## Pendientes Importantes

1. **Widget voice.js**: El snippet usa URL placeholder `https://cdn.geniuslabs.ai/voice.js`. Necesita implementarse.

2. **Test E2E**: Probar flujo completo Login → Crear proyecto → Grabar → Transcribir

## Convenciones de Código

- Usar `useTranslation()` para todos los textos visibles
- Usar `useFormatters()` para fechas/números/moneda
- Componentes en PascalCase
- Archivos de página en pages/
- Tipos en el mismo archivo o en types.ts

## Notas para Desarrollo

- El backend ya soporta múltiples idiomas para transcripción
- Supabase Storage bucket: `voice-recordings`
- Las grabaciones se almacenan con path: `{project_id}/{session_id}.webm`
- Los tokens JWT expiran, el AuthContext maneja refresh

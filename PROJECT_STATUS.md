# Voice Capture Dashboard - Estado del Proyecto

**Última actualización:** 2026-01-22
**Branch activo:** `main`
**Repositorio:** genius-voice-dashboard
**Framework:** Vite + React + TypeScript + Tailwind + shadcn/ui
**Backend URL:** https://voice-capture-api-production.up.railway.app

---

## Resumen Ejecutivo

Dashboard frontend para Voice Capture API. Permite gestionar proyectos de captura de voz, ver grabaciones, ejecutar transcripciones batch y exportar datos. Construido originalmente en Lovable e integrado con backend Express/Supabase.

---

## Estado de Implementación

### Completado

| Componente | Archivo | Estado | Notas |
|------------|---------|--------|-------|
| Auth Context | `src/contexts/AuthContext.tsx` | ✅ Completo | Login/logout con Supabase |
| Dashboard | `src/pages/Dashboard.tsx` | ✅ Completo | Lista de proyectos |
| New Project | `src/pages/NewProject.tsx` | ✅ Completo | Crear proyecto con snippet |
| Project Detail | `src/pages/ProjectDetail.tsx` | ✅ Completo | Grabaciones, batch, export |
| Audio Player | `src/components/AudioPlayerModal.tsx` | ✅ Completo | Reproducción de audio |
| API Client | `src/lib/api.ts` | ✅ Completo | Cliente para backend Railway |
| Supabase Client | `src/integrations/supabase/client.ts` | ✅ Completo | Conexión directa a DB |

### Integración con Backend

| Feature | Endpoint | Estado |
|---------|----------|--------|
| Health Check | GET /health | ✅ Conectado |
| Batch Prepare | POST /api/projects/:id/transcribe-batch | ✅ Conectado |
| Batch Confirm | POST /api/projects/:id/transcribe-batch/:bid/confirm | ✅ Conectado |
| Batch Status | GET /api/projects/:id/transcribe-batch/:bid | ✅ Conectado (polling) |
| Export CSV | GET /api/projects/:id/export | ✅ Conectado |

### Pendiente / Por Hacer

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| Probar flujo completo E2E | 🔴 Alta | Login → crear proyecto → upload → transcribir |
| Agregar CORS para Lovable preview | 🟡 Media | Si se usa Lovable preview URL |
| Subir archivo CSV para batch | 🟢 Baja | UI existe pero no implementado |
| Export XLSX | 🟢 Baja | Backend retorna 501 |

---

## Estructura de Archivos

```
genius-voice-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   └── AudioPlayerModal.tsx   # Audio playback
│   ├── contexts/
│   │   └── AuthContext.tsx        # Supabase auth
│   ├── hooks/
│   │   └── use-toast.ts           # Toast notifications
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts          # Supabase client & types
│   ├── lib/
│   │   ├── api.ts                 # Backend API client
│   │   └── utils.ts               # Utilities
│   ├── pages/
│   │   ├── Auth.tsx               # Login/Register
│   │   ├── Dashboard.tsx          # Project list
│   │   ├── NewProject.tsx         # Create project
│   │   └── ProjectDetail.tsx      # Recordings & batch
│   ├── App.tsx                    # Router
│   └── main.tsx                   # Entry point
├── .env                           # (local) VITE_API_URL, etc.
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── PROJECT_STATUS.md              # Este archivo
```

---

## Variables de Entorno

```env
VITE_API_URL=https://voice-capture-api-production.up.railway.app
VITE_SUPABASE_URL=https://hggwsdqjkwydiubhvrvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## API Client (src/lib/api.ts)

El cliente API maneja:
- **getAuthToken()**: Obtiene JWT de sesión Supabase
- **fetchWithAuth()**: Fetch genérico con Authorization header
- **batchApi.prepare()**: Analiza session IDs para transcripción
- **batchApi.confirm()**: Confirma e inicia transcripción
- **batchApi.getStatus()**: Obtiene progreso del batch
- **exportApi.exportCsv()**: Descarga CSV de grabaciones

---

## Historial de Cambios

| Fecha | Cambio | Commit |
|-------|--------|--------|
| 2026-01-22 | Proyecto creado en Lovable | `b331aa1` |
| 2026-01-22 | Actualización sidebar Voice Capture | `1ee5689` |
| 2026-01-22 | **Integración backend**: API client creado, batch y export conectados al backend Railway | `5805fd5` |

---

## Relación con Backend

- **Backend Repo**: `genius-voice-capture`
- **Backend URL**: https://voice-capture-api-production.up.railway.app
- **Auth**: JWT de Supabase se pasa en header Authorization
- **Supabase Project**: `hggwsdqjkwydiubhvrvq` (compartido con backend)

---

*Este archivo debe actualizarse después de cada sesión de desarrollo significativa.*

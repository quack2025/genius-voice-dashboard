# Voice Capture Dashboard - Estado del Proyecto

**Última actualización:** 2026-01-22
**Branch activo:** `main`
**Repositorio:** genius-voice-dashboard
**Framework:** Vite + React + TypeScript + Tailwind + shadcn/ui
**Backend URL:** https://voice-capture-api-production.up.railway.app

---

## Resumen Ejecutivo

Dashboard frontend para Voice Capture API. Permite gestionar proyectos de captura de voz, ver grabaciones, ejecutar transcripciones batch y exportar datos. Construido originalmente en Lovable e integrado con backend Express/Supabase.

**Características principales:**
- Gestión de proyectos de captura de voz
- Visualización y reproducción de grabaciones
- Transcripción batch con OpenAI Whisper
- Exportación de datos a CSV
- Soporte multi-idioma (ES/EN/PT)

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Este Repo)                           │
│                         genius-voice-dashboard                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Login     │    │  Dashboard  │    │ NewProject  │    │ProjectDetail│  │
│  │  Register   │    │             │    │             │    │  Batch/Export│  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         └──────────────────┴──────────────────┴──────────────────┘          │
│                                    │                                        │
│                          ┌─────────┴─────────┐                              │
│                          │   AuthContext     │                              │
│                          │   (Supabase JWT)  │                              │
│                          └─────────┬─────────┘                              │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         │                          │                          │             │
│  ┌──────┴──────┐           ┌───────┴───────┐          ┌───────┴───────┐    │
│  │ Supabase    │           │  API Client   │          │    i18n       │    │
│  │ Client      │           │  (api.ts)     │          │  System       │    │
│  │ (Direct DB) │           │  (Backend)    │          │  (ES/EN/PT)   │    │
│  └──────┬──────┘           └───────┬───────┘          └───────────────┘    │
│         │                          │                                        │
└─────────┼──────────────────────────┼────────────────────────────────────────┘
          │                          │
          ▼                          ▼
┌─────────────────────┐    ┌─────────────────────────────────────────────────┐
│      Supabase       │    │              BACKEND (Railway)                  │
│  ┌───────────────┐  │    │           genius-voice-capture                  │
│  │   PostgreSQL  │  │    ├─────────────────────────────────────────────────┤
│  │  - projects   │  │    │  Express.js API                                 │
│  │  - recordings │  │    │  ┌─────────────────────────────────────────┐    │
│  │  - users      │  │    │  │ POST /api/projects/:id/transcribe-batch │    │
│  └───────────────┘  │    │  │ POST /api/.../confirm                   │    │
│  ┌───────────────┐  │    │  │ GET  /api/.../status                    │    │
│  │    Storage    │  │    │  │ GET  /api/projects/:id/export           │    │
│  │  (Audio Files)│  │    │  └─────────────────────────────────────────┘    │
│  └───────────────┘  │    │                    │                            │
│  ┌───────────────┐  │    │                    ▼                            │
│  │     Auth      │  │    │           ┌───────────────┐                     │
│  │    (JWT)      │  │    │           │ OpenAI Whisper│                     │
│  └───────────────┘  │    │           │ (Transcription)│                    │
└─────────────────────┘    │           └───────────────┘                     │
                           └─────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Autenticación**: Usuario → Supabase Auth → JWT Token
2. **Lectura de datos**: Frontend → Supabase Client → PostgreSQL (directo)
3. **Transcripción batch**: Frontend → API Client → Backend Railway → OpenAI Whisper
4. **Exportación**: Frontend → API Client → Backend Railway → CSV download

---

## Estado de Implementación

### Componentes Completados

| Componente | Archivo | Estado | Descripción |
|------------|---------|--------|-------------|
| Auth Context | `src/contexts/AuthContext.tsx` | ✅ | Login/logout con Supabase |
| Dashboard | `src/pages/Dashboard.tsx` | ✅ | Lista de proyectos del usuario |
| New Project | `src/pages/NewProject.tsx` | ✅ | Crear proyecto + snippet de integración |
| Project Detail | `src/pages/ProjectDetail.tsx` | ✅ | Grabaciones, batch, export por proyecto |
| Recordings | `src/pages/Recordings.tsx` | ✅ | Todas las grabaciones (cross-project) |
| Export | `src/pages/Export.tsx` | ✅ | Exportación global CSV |
| Settings | `src/pages/Settings.tsx` | ✅ | Configuración (placeholder) |
| Audio Player | `src/components/AudioPlayerModal.tsx` | ✅ | Reproducción de audio |
| App Sidebar | `src/components/AppSidebar.tsx` | ✅ | Navegación + LanguageSwitcher |
| API Client | `src/lib/api.ts` | ✅ | Cliente para backend Railway |
| Supabase Client | `src/integrations/supabase/client.ts` | ✅ | Conexión directa a DB |
| i18n System | `src/i18n/` | ✅ | ES/EN/PT, detección automática |
| Language Switcher | `src/components/LanguageSwitcher.tsx` | ✅ | Selector de idioma UI |
| Locale Formatters | `src/hooks/useFormatters.ts` | ✅ | Formato de fechas/números |

### Integración con Backend

| Feature | Endpoint | Estado | Descripción |
|---------|----------|--------|-------------|
| Health Check | `GET /health` | ✅ | Verificar estado del backend |
| Batch Prepare | `POST /api/projects/:id/transcribe-batch` | ✅ | Analizar session IDs |
| Batch Confirm | `POST /api/projects/:id/transcribe-batch/:bid/confirm` | ✅ | Iniciar transcripción |
| Batch Status | `GET /api/projects/:id/transcribe-batch/:bid` | ✅ | Polling de progreso |
| Export CSV | `GET /api/projects/:id/export` | ✅ | Descargar grabaciones |

### Pendiente / Por Hacer

| Tarea | Prioridad | Notas |
|-------|-----------|-------|
| Probar flujo completo E2E | 🔴 Alta | Login → crear proyecto → upload → transcribir |
| Agregar CORS para Lovable preview | 🟡 Media | Si se usa Lovable preview URL |
| Subir archivo CSV para batch | 🟢 Baja | UI existe pero no implementado |
| Export XLSX | 🟢 Baja | Backend retorna 501 |

---

## Sistema de Internacionalización (i18n)

### Arquitectura i18n

```
src/i18n/
├── index.ts                    # Configuración principal
└── locales/
    ├── es/
    │   ├── common.json         # Botones, estados, paginación
    │   ├── auth.json           # Login, Register
    │   ├── dashboard.json      # Dashboard
    │   └── projects.json       # Proyectos, grabaciones, batch, export
    ├── en/
    │   └── (mismos archivos)
    └── pt/
        └── (mismos archivos)
```

### Idiomas Soportados

| Idioma | Código | Estado | Notas |
|--------|--------|--------|-------|
| Español | `es` | ✅ Completo | Idioma por defecto |
| English | `en` | ✅ Completo | - |
| Português | `pt` | ✅ Completo | - |

### Características i18n

- **Detección automática**: Usa `i18next-browser-languagedetector` para detectar idioma del navegador
- **Persistencia**: Guarda preferencia en localStorage (key: `ui_language`)
- **Selector de idioma**: Disponible en sidebar y páginas de auth (pre-login)
- **Formateo locale-aware**: Hook `useFormatters` para fechas, números, moneda, duración
- **Namespaces**: 4 namespaces separados (common, auth, dashboard, projects)

### Uso en Componentes

```tsx
// Ejemplo de uso
import { useTranslation } from 'react-i18next';
import { useFormatters } from '@/hooks/useFormatters';

function MyComponent() {
  const { t } = useTranslation('projects');
  const { t: tCommon } = useTranslation('common');
  const { formatDate, formatDuration } = useFormatters();

  return (
    <div>
      <h1>{t('recordings.title')}</h1>
      <p>{tCommon('status.completed')}</p>
      <span>{formatDate(recording.created_at)}</span>
    </div>
  );
}
```

### Importante: Idioma UI vs Idioma Transcripción

| Concepto | Almacenamiento | Uso |
|----------|---------------|-----|
| Idioma UI | localStorage (`ui_language`) | Textos de la interfaz |
| Idioma Transcripción | DB (`projects.language`) | Enviado a OpenAI Whisper |

**Son independientes**: Un usuario puede tener la UI en inglés pero crear un proyecto que transcribe audio en español.

---

## Estructura de Archivos

```
genius-voice-dashboard/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components (Button, Card, etc.)
│   │   ├── AudioPlayerModal.tsx   # Modal para reproducir grabaciones
│   │   ├── AppSidebar.tsx         # Sidebar con navegación + LanguageSwitcher
│   │   └── LanguageSwitcher.tsx   # Dropdown para cambiar idioma UI
│   ├── contexts/
│   │   └── AuthContext.tsx        # Context de autenticación Supabase
│   ├── hooks/
│   │   ├── use-toast.ts           # Hook para toast notifications
│   │   └── useFormatters.ts       # Hook para formateo locale-aware
│   ├── i18n/
│   │   ├── index.ts               # Configuración i18next
│   │   └── locales/
│   │       ├── es/                # 4 archivos JSON
│   │       ├── en/                # 4 archivos JSON
│   │       └── pt/                # 4 archivos JSON
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts          # Cliente Supabase + tipos TypeScript
│   ├── lib/
│   │   ├── api.ts                 # Cliente API para backend Railway
│   │   └── utils.ts               # Utilidades (cn, etc.)
│   ├── pages/
│   │   ├── Login.tsx              # Página de login
│   │   ├── Register.tsx           # Página de registro
│   │   ├── Dashboard.tsx          # Lista de proyectos
│   │   ├── NewProject.tsx         # Crear nuevo proyecto
│   │   ├── ProjectDetail.tsx      # Detalle de proyecto (grabaciones, batch, export)
│   │   ├── Recordings.tsx         # Todas las grabaciones
│   │   ├── Export.tsx             # Exportación global
│   │   └── Settings.tsx           # Configuración
│   ├── App.tsx                    # Router principal
│   └── main.tsx                   # Entry point + import i18n
├── .env                           # Variables de entorno (local)
├── package.json                   # Dependencias
├── tailwind.config.js             # Configuración Tailwind
├── vite.config.ts                 # Configuración Vite
└── PROJECT_STATUS.md              # Este archivo
```

---

## Variables de Entorno

```env
# URL del backend en Railway
VITE_API_URL=https://voice-capture-api-production.up.railway.app

# Supabase (compartido con backend)
VITE_SUPABASE_URL=https://hggwsdqjkwydiubhvrvq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## API Client (src/lib/api.ts)

### Funciones Principales

| Función | Descripción |
|---------|-------------|
| `getAuthToken()` | Obtiene JWT de sesión Supabase |
| `fetchWithAuth(url, options)` | Fetch genérico con Authorization header |
| `batchApi.prepare(projectId, sessionIds)` | Analiza session IDs para transcripción |
| `batchApi.confirm(projectId, batchId)` | Confirma e inicia transcripción |
| `batchApi.getStatus(projectId, batchId)` | Obtiene progreso del batch |
| `exportApi.exportCsv(projectId, params)` | Descarga CSV de grabaciones |

### Manejo de Errores

El cliente maneja automáticamente:
- Tokens expirados → Redirige a login
- Errores de red → Toast de error
- Respuestas 4xx/5xx → Propagación de error message

---

## Modelo de Datos (Supabase)

### Tabla: projects

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | FK a auth.users |
| name | TEXT | Nombre del proyecto |
| public_key | TEXT | Key para widget (proj_xxx) |
| language | TEXT | Idioma transcripción (es, en, pt) |
| transcription_mode | TEXT | realtime / batch |
| created_at | TIMESTAMP | Fecha creación |

### Tabla: recordings

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK a projects |
| session_id | TEXT | ID único de sesión |
| audio_url | TEXT | URL en Supabase Storage |
| duration_seconds | INTEGER | Duración en segundos |
| status | TEXT | pending / processing / completed / failed |
| transcription | TEXT | Texto transcrito (nullable) |
| language_detected | TEXT | Idioma detectado por Whisper |
| created_at | TIMESTAMP | Fecha creación |

---

## Historial de Cambios

| Fecha | Cambio | Commit |
|-------|--------|--------|
| 2026-01-22 | Proyecto creado en Lovable | `b331aa1` |
| 2026-01-22 | Actualización sidebar Voice Capture | `1ee5689` |
| 2026-01-22 | **Integración backend**: API client creado, batch y export conectados al backend Railway | `5805fd5` |
| 2026-01-22 | **i18n Multi-idioma**: Soporte ES/EN/PT, detección automática, todas las páginas migradas | `194e40f` |

---

## Relación con Backend

| Aspecto | Detalle |
|---------|---------|
| Backend Repo | `genius-voice-capture` |
| Backend URL | https://voice-capture-api-production.up.railway.app |
| Hosting | Railway |
| Auth | JWT de Supabase se pasa en header `Authorization: Bearer <token>` |
| Supabase Project | `hggwsdqjkwydiubhvrvq` (compartido) |
| Transcripción | OpenAI Whisper API (via backend) |

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build de producción
npm run build

# Preview build
npm run preview
```

---

## Dependencias Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| react | ^18.x | Framework UI |
| react-router-dom | ^6.x | Routing |
| @supabase/supabase-js | ^2.x | Cliente Supabase |
| i18next | ^23.x | Internacionalización |
| react-i18next | ^14.x | Bindings React para i18n |
| i18next-browser-languagedetector | ^7.x | Detección automática idioma |
| tailwindcss | ^3.x | Estilos |
| shadcn/ui | - | Componentes UI |
| lucide-react | ^0.x | Iconos |

---

*Este archivo debe actualizarse después de cada sesión de desarrollo significativa.*

# Cross-Product Context -- Genius Labs AI Suite

## The Suite
Voice Capture is one of 4 products in the Genius Labs AI Suite. All share:
- Unified design system (HSL tokens, primary #1E40AF, Genius Labs logo)
- Consistent sidebar hierarchy (Core Zone + Folders + Account Zone)
- shadcn/ui + Tailwind CSS + Lucide icons
- Lovable deployment (auto-deploy from main, .env must stay in git)
- Supabase Auth + Postgres + RLS

## The 4 Products

| Product | Repo | Purpose | Backend | Supabase ID |
|---------|------|---------|---------|-------------|
| Survey Coder Pro | survey-coder-front | AI-powered survey response coding | Railway (Express) | czqrgdgyzvsrutymjssg |
| Voice Capture | genius-voice-dashboard | Voice recording projects + transcription | Railway (Express) | hggwsdqjkwydiubhvrvq |
| SurveyGenius AI | ai-followup-front | AI follow-up questions for surveys (Alchemer) | Express (api.survey-genius.ai) | yqaginukztblnwooxmwd |
| Talk2Data | talk2data-front | Market research data analysis + AI chat | FastAPI (Railway) | xithhxnnbvxkzxdmdpnn |

## GitHub Org
All repos under quack2025 on GitHub.

## Shared Sidebar Structure (all 4 products)
Logo + Product Name
-- Core Zone (product-specific nav items)
-- Separator
-- Folder Section (drag-and-drop project folders)
-- Separator
-- Account Zone (Usage, Billing, Settings)
-- User section (avatar, language, logout)

## Key Differences Between Products
- i18n: Survey Coder uses i18next (5 locales), Voice Capture/AI Followup use i18next (3 locales), Talk2Data uses custom useLanguage() hook (2 locales)
- Sidebar: Survey Coder uses shadcn Sidebar components, others use custom aside elements
- Folders: Survey Coder and AI Followup scope to organization_id, Voice Capture/Talk2Data scope to user_id
- Auth: All use Supabase Auth. Survey Coder has session enforcement + encryption
- Org management: AI Followup has multi-org support (OrganizationSwitcher in Settings page, not sidebar)

## Voice Capture Specifics
- Core Zone nav items: Projects (FolderKanban), Recordings (Mic2), Export (Download)
- Account Zone: Usage (/settings?tab=usage), Billing (/settings?tab=billing), Settings
- Folder system: user_id scoped, 8-color picker, @dnd-kit drag-and-drop
- Migration: `supabase/migrations/003_project_folders.sql` (manual apply, not auto-deployed by Lovable)
- Plans: free, freelancer (display: Starter), pro, enterprise (4 tiers, mirrored from backend)
- Backend API: voice-capture-api-production.up.railway.app

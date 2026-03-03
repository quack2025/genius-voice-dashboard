

## Plan: Alchemer-focused landing copy + platform status update

### What changes

**1. Update i18n landing copy (3 locale files)** to position Alchemer as the primary platform:
- Hero title: "Make the most out of your Alchemer surveys" / equivalent in es/pt
- Hero subtitle: emphasize that voice responses give richer insights vs typing
- Integrations section: change subtitle to highlight Alchemer as available now, other platforms coming soon
- Add an "alchemerHighlight" key for a badge/callout like "Built for Alchemer"

**2. Update `platforms.ts`** — Change all non-Alchemer and non-generic platforms to `coming_soon`:
- Keep `alchemer` as `available`
- Keep `generic` as `available` (any HTML form)
- Move `qualtrics`, `surveymonkey`, `questionpro`, `jotform` to `coming_soon`

**3. Update Landing.tsx integrations teaser section** — Redesign to show:
- Alchemer prominently as the featured/available platform
- All other platforms displayed as "Coming soon" pills
- Remove filter that only shows `available` platforms; instead show Alchemer first, then coming soon platforms with a badge

**4. Verify all links** — The landing page links to:
- `/login`, `/register` — internal routes, work fine
- `/integrations` and `/integrations/:slug` — internal routes, work fine
- `#how-it-works`, `#features`, `#pricing`, `#demo`, `#faq` — anchor links, work fine
- No hardcoded domain references found; all links are relative paths, so they work on any domain including the custom domain

### Files to edit
- `src/i18n/locales/en/landing.json` — Update hero, integrations copy
- `src/i18n/locales/es/landing.json` — Same updates in Spanish
- `src/i18n/locales/pt/landing.json` — Same updates in Portuguese
- `src/lib/platforms.ts` — Move non-Alchemer platforms to `coming_soon`
- `src/pages/Landing.tsx` — Update integrations teaser to feature Alchemer prominently + show others as coming soon


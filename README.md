# WeekendGo

WeekendGo (周末去哪儿) is a family outdoor discovery and planning app for users aged 25-40, focused on camping, stream tracing, hiking, and picnic scenarios.

## Tech Stack

- Next.js 15
- TypeScript
- TailwindCSS
- shadcn/ui
- Supabase
- Mapbox

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create env file

```bash
cp .env.example .env.local
```

3. Fill environment values (`Supabase`, `Mapbox`)

4. Start dev server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Current Scope

- Home page MVP (hero + scenario entry + recommendations)
- Destination list/detail with favorites
- Plan creation/editing + public share page
- Supabase client/server utilities
- Mapbox token setup utility
- EN/ZH locale switching
- CSV batch import tool for `spots`/`facilities`/`photos`

## CSV Import Tool

- Admin page: `/admin/import`
- APIs:
  - `POST /api/admin/import/validate`
  - `POST /api/admin/import/execute`
- Migration:
  - `supabase/migrations/20260601_importer_spots_facilities_photos.sql`
- Templates:
  - `outputs/spots_template.csv`
  - `outputs/facilities_template.csv`
  - `outputs/photos_template.csv`
- Runbook:
  - `outputs/weekendgo_release_runbook.md`

## I18N Ops

Run translation validation:

```bash
npm run i18n:validate
```

Run preflight (validation + dry-run SQL + release checklist):

```bash
npm run i18n:preflight
```

## I18N Message Conventions

- Shared client-side interaction messages are centralized in:
  - `src/lib/i18n/messages.ts`
- Use message factories instead of inline `isZh ? ... : ...` strings:
  - `getLoginMessages(locale)`
  - `getAddToPlanMessages(locale)`
  - `getPlanEditorMessages(locale)`
- Presenter helpers for destination labels are in:
  - `src/features/destinations/presenter.ts`
- Presenter helper for plan status labels is in:
  - `src/features/plans/presenter.ts`

## CI Workflows

- `I18N Validate`
  - Runs on pull requests when i18n-relevant files change.
  - Executes `npm run i18n:validate`.
  - Uploads validation report artifact.

- `I18N Preflight` (manual)
  - Trigger from GitHub Actions via `workflow_dispatch`.
  - Accepts input paths for CSV/report/dry-run SQL/checklist.
  - Executes `work/tools/release_i18n_preflight.mjs`.
  - Uploads three artifacts:
    - validation report
    - dry-run SQL
    - release checklist

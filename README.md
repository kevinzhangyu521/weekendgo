# 栖美地

栖美地是面向亲子家庭的周末户外目的地推荐平台，聚焦露营、溯溪、徒步和野餐场景。

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

- Home page MVP with scenario entry and personalized recommendations
- Destination list/detail with favorites
- Plan creation/editing and public share page
- Supabase client/server utilities
- Mapbox token setup utility
- EN/ZH locale switching
- CSV batch import tool for `spots`/`facilities`/`photos`
- Admin destination review and management

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

Run preflight:

```bash
npm run i18n:preflight
```

## CI Workflows

- `I18N Validate`
  - Runs on pull requests when i18n-relevant files change.
  - Executes `npm run i18n:validate`.
- `I18N Preflight`
  - Trigger from GitHub Actions via `workflow_dispatch`.
  - Executes `work/tools/release_i18n_preflight.mjs`.

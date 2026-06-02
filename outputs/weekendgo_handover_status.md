# WeekendGo Handover Status (2026-05-31)

## 1) Completed

- Next.js 15 + TypeScript + TailwindCSS app scaffold completed.
- Supabase integration completed:
  - auth callback flow
  - server/client helpers
  - middleware session refresh
- Mapbox integration completed:
  - token setup helper
  - map explorer page and marker interaction
- Core pages completed:
  - Home
  - Destinations list/detail
  - Favorites
  - Plans list/detail/editor
  - Public share page
  - Login
- Plans capability completed:
  - add destination to plan
  - reorder/remove stops
  - toggle public share
  - copy share link
  - QR preview/download
  - share card PNG download
- i18n completed for EN/ZH in major flows.
- Label standardization completed:
  - destination scenario/difficulty/safety unified in presenter
  - plan status unified in presenter
- Message centralization completed:
  - `src/lib/i18n/messages.ts`
  - `getLoginMessages`
  - `getAddToPlanMessages`
  - `getPlanEditorMessages`
- I18N operations completed:
  - validation/preflight scripts
  - SQL/template/report/checklist assets
  - GitHub workflows (`I18N Validate`, `I18N Preflight`)

## 2) Key Files

- i18n message center:
  - `src/lib/i18n/messages.ts`
- destination presenter:
  - `src/features/destinations/presenter.ts`
- plans presenter:
  - `src/features/plans/presenter.ts`
- workflows:
  - `.github/workflows/i18n-validate.yml`
  - `.github/workflows/i18n-preflight.yml`
- docs:
  - `README.md`

## 3) Pending Verification (Local/CI)

- Run type check:
  - `npm run typecheck`
- Run production build:
  - `npm run build`
- Run i18n validation:
  - `npm run i18n:validate`
- Optional preflight:
  - `npm run i18n:preflight`

## 4) Release Checklist (Recommended)

- Confirm Supabase env vars in `.env.local`.
- Confirm Mapbox token in `.env.local`.
- Apply Supabase migrations in order under `supabase/migrations/`.
- Smoke test pages:
  - `/`
  - `/destinations`
  - `/destinations/[id]`
  - `/map`
  - `/favorites`
  - `/plans`
  - `/plans/[id]`
  - `/plans/share/[slug]`
- Validate EN/ZH switching on all pages.
- Trigger `I18N Preflight` workflow before release.

## 5) Notes

- In this environment, `npm`/`git` commands were unavailable in terminal, so runtime verification is pending and should be executed in a normal Node/Git-enabled environment.

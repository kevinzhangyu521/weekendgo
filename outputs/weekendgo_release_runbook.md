# WeekendGo Release Runbook

Date: 2026-05-31  
Owner: Product + Engineering  
Scope: WeekendGo web app (Next.js + Supabase + Mapbox)

## 0. Pre-check

1. Confirm Node.js and npm available.
2. Confirm Git available.
3. Confirm environment file is ready:
   - `.env.local`
4. Confirm required env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

Pass criteria:
- `node -v` and `npm -v` return versions.
- App env vars are non-empty.

---

## 1. Install and Verify

1. Install deps:
   - `npm install`
2. Type check:
   - `npm run typecheck`
3. Build:
   - `npm run build`

Pass criteria:
- Type check passes with zero errors.
- Build succeeds.

Rollback:
- If build fails, do not release; fix errors and re-run this section.

---

## 2. Database Migration

1. Apply SQL migrations in `supabase/migrations/` in timestamp order.
2. Verify tables and columns exist:
   - destinations i18n fields
   - favorites
   - weekend_plans
   - plan_items
   - share_slug/is_public related fields

Pass criteria:
- All migrations complete successfully.
- No missing schema errors in app runtime logs.

Rollback:
- Stop release if migration fails.
- Restore DB from backup/snapshot if partial migration caused inconsistent state.

---

## 3. I18N Quality Gate

1. Validate i18n content:
   - `npm run i18n:validate`
2. Optional full preflight:
   - `npm run i18n:preflight`
3. (CI) Trigger `I18N Preflight` workflow manually and download artifacts.

Pass criteria:
- Validation report has no blocking errors.
- Preflight report/checklist generated.

Rollback:
- Fix translation/template data and re-run before release.

---

## 4. Functional Smoke Test

Test routes:
- `/`
- `/destinations`
- `/destinations/[id]`
- `/map`
- `/favorites`
- `/plans`
- `/plans/[id]`
- `/plans/share/[slug]`
- `/login`

Required checks:
1. EN/ZH switch works on all pages.
2. Destination cards show readable scenario/difficulty/safety labels.
3. Favorites add/remove works (logged-in user).
4. Add-to-plan works from destination detail.
5. Plan editor supports:
   - rename
   - date update
   - reorder/remove stops
   - public share toggle
   - copy share link
   - QR/card download actions
6. Shared plan page opens and renders stops.
7. Map page loads markers and side list without garbled text.

Pass criteria:
- No blocking UX/functional defect.
- No obvious i18n corruption text.

Rollback:
- Disable deployment and keep previous version live if any P0/P1 defect appears.

---

## 5. Release Execution

1. Merge approved release branch.
2. Deploy to production target.
3. Verify production health:
   - homepage loads
   - login callback works
   - Supabase reads/writes succeed
   - Mapbox map loads

Pass criteria:
- Production checks all pass.

Rollback:
- Redeploy previous stable version immediately.
- Keep new release branch for hotfix.

---

## 6. Post-release (30-60 min)

1. Monitor logs and error rate.
2. Verify key journeys with a real account:
   - login
   - favorite
   - plan create/edit/share
3. Confirm no spike in client/server errors.

Pass criteria:
- No sustained error spike.
- Core conversion paths healthy.

---

## 7. Ownership Notes

- i18n interaction messages are centralized in:
  - `src/lib/i18n/messages.ts`
- Destination labels are in:
  - `src/features/destinations/presenter.ts`
- Plan status labels are in:
  - `src/features/plans/presenter.ts`

If copy changes are needed post-release, update those files first, then run i18n validation.

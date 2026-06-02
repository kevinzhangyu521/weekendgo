# I18N Preflight Guide

Run one command before each translation release:

```bash
node work/tools/release_i18n_preflight.mjs outputs/destinations_i18n_template.csv outputs/destinations_i18n_validation_report.md outputs/destinations_i18n_dry_run.sql outputs/destinations_i18n_release_checklist.md
```

## Outputs

1. `outputs/destinations_i18n_validation_report.md`
   - Field-level validation report (missing/non-CJK/too-long/duplicates)

2. `outputs/destinations_i18n_dry_run.sql`
   - SQL preview with `begin; ... rollback;`
   - Review statements before applying in production

3. `outputs/destinations_i18n_release_checklist.md`
   - Operational checklist summary
   - Lists missing rows, potential untranslated rows, overlong descriptions

# I18N CSV Validation Guide

## Script

`work/tools/validate_i18n_csv.mjs`

## Usage

```bash
node work/tools/validate_i18n_csv.mjs outputs/destinations_i18n_template.csv outputs/destinations_i18n_validation_report.md
```

## Checks

1. Missing required fields: `id`, `name_zh`, `city_zh`, `description_zh`
2. Non-CJK values in Chinese columns
3. Overlong `description_zh` (default max: 120 chars)
4. Duplicate translation rows

## Output

Validation report is written to:

`outputs/destinations_i18n_validation_report.md`

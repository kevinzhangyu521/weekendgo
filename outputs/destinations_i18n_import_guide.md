# Destinations I18N Import Guide

## Files

- CSV template: `destinations_i18n_template.csv`
- SQL script: `destinations_i18n_import.sql`

## Workflow

1. Fill Chinese translations in `destinations_i18n_template.csv`.
2. Open Supabase SQL editor.
3. Run `destinations_i18n_import.sql` step by step.
4. Import CSV data into `tmp_destinations_i18n_import` when the script asks for it.
5. Continue running the `update` statement.
6. Run the verification `select` at the end.

## Notes

- Keep `id` unchanged.
- Leave a cell empty to keep existing DB value unchanged.
- You can review pending items with:
  ```sql
  select * from public.destinations_i18n_todo;
  ```

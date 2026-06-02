# WeekendGo CSV Import Tool Guide

## 1. Entry

- Page: `/admin/import`
- APIs:
  - `POST /api/admin/import/validate`
  - `POST /api/admin/import/execute`

## 2. Required Files

Upload three CSV files together:

1. `spots.csv`
2. `facilities.csv`
3. `photos.csv`

Use templates:

- `outputs/spots_template.csv`
- `outputs/facilities_template.csv`
- `outputs/photos_template.csv`

## 3. Field Specs

## 3.1 spots.csv

Required:

- `external_id`
- `name`
- `city`
- `lat`
- `lng`
- `scenario` (`camping|creek|hiking|picnic`)
- `difficulty` (`easy|moderate|hard`)
- `safety` (`low_risk|medium_risk|high_risk`)

Optional:

- `name_zh`
- `city_zh`
- `distance_km`
- `description`
- `description_zh`

## 3.2 facilities.csv

Required:

- `spot_external_id`
- `facility_code`

Optional:

- `facility_name`
- `facility_name_zh`

## 3.3 photos.csv

Required:

- `spot_external_id`
- `url` (http/https)

Optional:

- `caption`
- `caption_zh`
- `sort_order`
- `is_cover` (`true|false|1|0`)

## 4. Auto Association Rules

- `facilities.csv` and `photos.csv` reference spots by `spot_external_id`.
- Import process resolves `spot_external_id -> spots.id`.
- Association tables are upserted:
  - `spot_facilities` by `(spot_id, facility_id)`
  - `photos` by `(spot_id, url)`

## 5. Recommended Workflow

1. Upload 3 files.
2. Click `Validate`.
3. If validation passes, click `Validate + Import`.
4. Check inserted counts in result panel.

## 6. Common Errors

- `spot_external_id not found in spots.csv`:
  - The referenced spot does not exist in the uploaded spots file.
- `scenario/difficulty/safety is invalid`:
  - Value not in allowed enum set.
- `url is invalid`:
  - `photos.url` must be valid `http` or `https`.
- `external_id is duplicated in spots.csv`:
  - Duplicate spot key in same upload.

## 7. Data Safety

- Import uses upsert and unique constraints; re-import is idempotent for same keys.
- Always run validate before execute in production.

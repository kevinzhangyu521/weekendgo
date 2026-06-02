# WeekendGo CSV Import API Examples

## Base

- Validate API: `POST /api/admin/import/validate`
- Execute API: `POST /api/admin/import/execute`
- Content-Type: `multipart/form-data`
- Auth: must be logged in (cookie/session)

## 1) Validate (curl)

```bash
curl -X POST "http://localhost:3000/api/admin/import/validate" \
  -H "Accept: application/json" \
  -F "spots=@outputs/spots_template.csv;type=text/csv" \
  -F "facilities=@outputs/facilities_template.csv;type=text/csv" \
  -F "photos=@outputs/photos_template.csv;type=text/csv"
```

Expected success response (example):

```json
{
  "ok": true,
  "errors": [],
  "counts": {
    "spots": 2,
    "facilities": 4,
    "photos": 3
  }
}
```

Expected failure response (example):

```json
{
  "ok": false,
  "errors": [
    {
      "file": "spots",
      "row": 3,
      "message": "scenario is invalid"
    }
  ],
  "counts": {
    "spots": 2,
    "facilities": 4,
    "photos": 3
  }
}
```

## 2) Execute Import (curl)

```bash
curl -X POST "http://localhost:3000/api/admin/import/execute" \
  -H "Accept: application/json" \
  -F "spots=@outputs/spots_template.csv;type=text/csv" \
  -F "facilities=@outputs/facilities_template.csv;type=text/csv" \
  -F "photos=@outputs/photos_template.csv;type=text/csv"
```

Expected success response (example):

```json
{
  "ok": true,
  "errors": [],
  "counts": {
    "spots": 2,
    "facilities": 4,
    "photos": 3
  },
  "inserted": {
    "spots": 2,
    "facilities": 3,
    "spotFacilities": 4,
    "photos": 3
  }
}
```

## 3) Postman Setup

1. Method: `POST`
2. URL:
   - validate: `http://localhost:3000/api/admin/import/validate`
   - execute: `http://localhost:3000/api/admin/import/execute`
3. Body -> `form-data`
4. Keys:
   - `spots` (File)
   - `facilities` (File)
   - `photos` (File)
5. Select the corresponding CSV files.
6. Ensure login session cookie is present in Postman or use browser page `/admin/import`.

## 4) Common HTTP Status

- `200`: success
- `400`: csv missing or validation/import failed
- `401`: unauthorized (not logged in)

## 5) Quick Troubleshooting

- `401 Unauthorized`:
  - Log in first, then retry.
- `spots, facilities and photos csv files are required`:
  - Ensure all three file fields are included.
- Validation errors:
  - Fix row-level issues from response `errors`, then re-run.

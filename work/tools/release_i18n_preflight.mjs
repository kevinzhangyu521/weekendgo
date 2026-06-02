#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((x) => x.length > 0)) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function toRecords(rows) {
  const headers = rows[0].map((x) => x.trim());
  return rows.slice(1).map((r) => {
    const o = {};
    headers.forEach((h, i) => {
      o[h] = (r[i] ?? "").trim();
    });
    return o;
  });
}

function sqlEscape(s) {
  return String(s).replaceAll("'", "''");
}

function buildDryRunSql(records) {
  const lines = [];
  lines.push("-- DRY-RUN PREVIEW SQL");
  lines.push("-- Review before applying on production.");
  lines.push("begin;");
  for (const r of records) {
    const id = sqlEscape(r.id || "");
    if (!id) continue;
    const name = sqlEscape(r.name_zh || "");
    const city = sqlEscape(r.city_zh || "");
    const desc = sqlEscape(r.description_zh || "");
    lines.push(
      `update public.destinations set name_zh='${name}', city_zh='${city}', description_zh='${desc}' where id::text='${id}';`
    );
  }
  lines.push("rollback;");
  return lines.join("\n");
}

function buildChecklist(records) {
  const total = records.length;
  const missing = records.filter((r) => !r.id || !r.name_zh || !r.city_zh || !r.description_zh);
  const sameAsEnHint = records.filter(
    (r) => /^[\x00-\x7F\s.,;:'"!?()/-]+$/.test(r.name_zh || "") || /^[\x00-\x7F\s.,;:'"!?()/-]+$/.test(r.description_zh || "")
  );
  const longDesc = records.filter((r) => (r.description_zh || "").length > 120);

  const out = [];
  out.push("# I18N Release Checklist");
  out.push("");
  out.push(`- Total rows: ${total}`);
  out.push(`- Missing required fields: ${missing.length}`);
  out.push(`- Potential untranslated (ASCII-only zh fields): ${sameAsEnHint.length}`);
  out.push(`- Overlong descriptions (>120): ${longDesc.length}`);
  out.push("");
  out.push("## Missing Required Fields");
  out.push("");
  if (!missing.length) out.push("No issues.");
  else missing.forEach((r) => out.push(`- ${r.id || "(no-id)"}`));
  out.push("");
  out.push("## Potential Untranslated Rows");
  out.push("");
  if (!sameAsEnHint.length) out.push("No issues.");
  else sameAsEnHint.forEach((r) => out.push(`- ${r.id || "(no-id)"}`));
  out.push("");
  out.push("## Overlong Descriptions");
  out.push("");
  if (!longDesc.length) out.push("No issues.");
  else longDesc.forEach((r) => out.push(`- ${r.id || "(no-id)"} (${(r.description_zh || "").length})`));
  return out.join("\n");
}

function main() {
  const csvPath = process.argv[2] || "outputs/destinations_i18n_template.csv";
  const reportPath = process.argv[3] || "outputs/destinations_i18n_validation_report.md";
  const dryRunPath = process.argv[4] || "outputs/destinations_i18n_dry_run.sql";
  const checklistPath = process.argv[5] || "outputs/destinations_i18n_release_checklist.md";

  const absCsv = path.resolve(csvPath);
  if (!fs.existsSync(absCsv)) {
    console.error(`CSV not found: ${absCsv}`);
    process.exit(1);
  }

  const validator = spawnSync(
    process.execPath,
    ["work/tools/validate_i18n_csv.mjs", csvPath, reportPath],
    { stdio: "inherit" }
  );
  if (validator.status !== 0) process.exit(validator.status ?? 1);

  const rows = parseCsv(fs.readFileSync(absCsv, "utf8"));
  if (rows.length < 2) {
    console.error("CSV has no data rows.");
    process.exit(1);
  }
  const records = toRecords(rows);

  fs.writeFileSync(path.resolve(dryRunPath), buildDryRunSql(records), "utf8");
  fs.writeFileSync(path.resolve(checklistPath), buildChecklist(records), "utf8");

  console.log(`Dry-run SQL: ${path.resolve(dryRunPath)}`);
  console.log(`Release checklist: ${path.resolve(checklistPath)}`);
}

main();

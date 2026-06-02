#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

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

function toRecord(headers, row) {
  const out = {};
  headers.forEach((h, i) => {
    out[h] = (row[i] ?? "").trim();
  });
  return out;
}

function isCjk(text) {
  return /[\u3400-\u9FFF]/.test(text);
}

function main() {
  const inputPath = process.argv[2] || "outputs/destinations_i18n_template.csv";
  const outputPath = process.argv[3] || "outputs/destinations_i18n_validation_report.md";
  const absInput = path.resolve(inputPath);
  const absOutput = path.resolve(outputPath);

  if (!fs.existsSync(absInput)) {
    console.error(`Input not found: ${absInput}`);
    process.exit(1);
  }

  const text = fs.readFileSync(absInput, "utf8");
  const rows = parseCsv(text);
  if (rows.length < 2) {
    console.error("CSV must include header + at least 1 row.");
    process.exit(1);
  }

  const headers = rows[0].map((s) => s.trim());
  const data = rows.slice(1).map((r) => toRecord(headers, r));

  const required = ["id", "name_zh", "city_zh", "description_zh"];
  const missingHeaders = required.filter((h) => !headers.includes(h));
  if (missingHeaders.length) {
    console.error(`Missing headers: ${missingHeaders.join(", ")}`);
    process.exit(1);
  }

  const issues = {
    missing: [],
    nonCjk: [],
    tooLong: [],
    duplicates: []
  };

  const descMax = 120;
  const seen = new Map();

  for (const row of data) {
    const id = row.id || "(no-id)";
    const name = row.name_zh || "";
    const city = row.city_zh || "";
    const desc = row.description_zh || "";

    if (!name || !city || !desc) {
      issues.missing.push({ id, name, city, desc });
    }

    if (name && !isCjk(name)) issues.nonCjk.push({ id, field: "name_zh", value: name });
    if (city && !isCjk(city)) issues.nonCjk.push({ id, field: "city_zh", value: city });
    if (desc && !isCjk(desc)) issues.nonCjk.push({ id, field: "description_zh", value: desc });

    if (desc.length > descMax) {
      issues.tooLong.push({ id, length: desc.length, value: desc });
    }

    const key = `${name}|${city}|${desc}`;
    if (seen.has(key)) {
      issues.duplicates.push({ id, duplicateOf: seen.get(key) });
    } else {
      seen.set(key, id);
    }
  }

  const now = new Date().toISOString();
  const report = [];
  report.push(`# I18N Validation Report`);
  report.push(``);
  report.push(`- Generated: ${now}`);
  report.push(`- Input: ${inputPath}`);
  report.push(`- Rows: ${data.length}`);
  report.push(``);
  report.push(`## Summary`);
  report.push(``);
  report.push(`- Missing fields: ${issues.missing.length}`);
  report.push(`- Non-CJK values: ${issues.nonCjk.length}`);
  report.push(`- Overlong descriptions (> ${descMax} chars): ${issues.tooLong.length}`);
  report.push(`- Duplicate translation rows: ${issues.duplicates.length}`);
  report.push(``);

  report.push(`## Missing Fields`);
  report.push(``);
  if (!issues.missing.length) {
    report.push(`No issues.`);
  } else {
    for (const it of issues.missing) {
      report.push(`- ${it.id}: name_zh="${it.name}", city_zh="${it.city}", description_zh length=${it.desc.length}`);
    }
  }
  report.push(``);

  report.push(`## Non-CJK Values`);
  report.push(``);
  if (!issues.nonCjk.length) {
    report.push(`No issues.`);
  } else {
    for (const it of issues.nonCjk) {
      report.push(`- ${it.id}.${it.field}: ${it.value}`);
    }
  }
  report.push(``);

  report.push(`## Overlong Descriptions`);
  report.push(``);
  if (!issues.tooLong.length) {
    report.push(`No issues.`);
  } else {
    for (const it of issues.tooLong) {
      report.push(`- ${it.id}: length=${it.length}`);
    }
  }
  report.push(``);

  report.push(`## Duplicates`);
  report.push(``);
  if (!issues.duplicates.length) {
    report.push(`No issues.`);
  } else {
    for (const it of issues.duplicates) {
      report.push(`- ${it.id} duplicates ${it.duplicateOf}`);
    }
  }
  report.push(``);

  fs.writeFileSync(absOutput, report.join("\n"), "utf8");
  console.log(`Report written: ${absOutput}`);
}

main();

"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ImportExecuteResult, ImportValidateResult } from "@/features/importer/types";

export default function AdminImportPage() {
  const [spots, setSpots] = useState<File | null>(null);
  const [facilities, setFacilities] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<ImportValidateResult | null>(null);
  const [execution, setExecution] = useState<ImportExecuteResult | null>(null);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => Boolean(spots && facilities && photos), [spots, facilities, photos]);

  function makeFormData() {
    const formData = new FormData();
    if (spots) formData.append("spots", spots);
    if (facilities) formData.append("facilities", facilities);
    if (photos) formData.append("photos", photos);
    return formData;
  }

  async function handleValidate(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setExecution(null);
    try {
      const response = await fetch("/api/admin/import/validate", {
        method: "POST",
        body: makeFormData()
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Validate failed.");
        return;
      }
      setValidation(data);
    } catch {
      setError("Validate failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleExecute() {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/import/execute", {
        method: "POST",
        body: makeFormData()
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Import failed.");
        setExecution(data);
        return;
      }
      setExecution(data);
    } catch {
      setError("Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">CSV Batch Import</h1>
        <p className="mt-1 text-sm text-slate-600">Upload spots, facilities and photos CSV files, then validate and import.</p>

        <form onSubmit={handleValidate} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-medium text-slate-700">
            spots.csv
            <input type="file" accept=".csv" className="mt-1 block w-full text-sm" onChange={(e) => setSpots(e.target.files?.[0] ?? null)} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            facilities.csv
            <input type="file" accept=".csv" className="mt-1 block w-full text-sm" onChange={(e) => setFacilities(e.target.files?.[0] ?? null)} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            photos.csv
            <input type="file" accept=".csv" className="mt-1 block w-full text-sm" onChange={(e) => setPhotos(e.target.files?.[0] ?? null)} />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Validating..." : "Validate"}
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={!canSubmit || loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Importing..." : "Validate + Import"}
            </button>
          </div>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

        {validation ? (
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Validation Result</h2>
            <p className="mt-1 text-sm text-slate-600">
              spots: {validation.counts.spots}, facilities: {validation.counts.facilities}, photos: {validation.counts.photos}
            </p>
            <p className={`mt-2 text-sm font-medium ${validation.ok ? "text-emerald-700" : "text-rose-600"}`}>
              {validation.ok ? "Validation passed" : `Validation failed (${validation.errors.length} errors)`}
            </p>
          </section>
        ) : null}

        {execution ? (
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Import Result</h2>
            <p className={`mt-2 text-sm font-medium ${execution.ok ? "text-emerald-700" : "text-rose-600"}`}>
              {execution.ok ? "Import succeeded" : "Import failed"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Inserted spots: {execution.inserted.spots}, facilities: {execution.inserted.facilities}, spot_facilities:{" "}
              {execution.inserted.spotFacilities}, photos: {execution.inserted.photos}
            </p>
            {execution.errors.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-xs text-rose-700">
                {execution.errors.slice(0, 20).map((err, idx) => (
                  <li key={`${err.file}-${err.row}-${idx}`}>
                    {err.file} row {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}
      </section>
    </main>
  );
}

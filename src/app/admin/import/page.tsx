"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ImportExecuteResult, ImportValidateResult } from "@/features/importer/types";
import { createClient } from "@/lib/supabase/client";

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

  async function authHeaders() {
    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
    return headers;
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
        headers: await authHeaders(),
        credentials: "include",
        body: makeFormData()
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "\u6821\u9a8c\u5931\u8d25\u3002");
        return;
      }
      setValidation(data);
    } catch {
      setError("\u6821\u9a8c\u5931\u8d25\u3002");
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
        headers: await authHeaders(),
        credentials: "include",
        body: makeFormData()
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "\u5bfc\u5165\u5931\u8d25\u3002");
        setExecution(data);
        return;
      }
      setExecution(data);
    } catch {
      setError("\u5bfc\u5165\u5931\u8d25\u3002");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="qmd-container py-8">
        <h1 className="text-2xl font-bold text-slate-900">{"CSV \u6279\u91cf\u5bfc\u5165"}</h1>
        <p className="mt-1 text-sm text-slate-600">{"\u4e0a\u4f20 spots\u3001facilities \u548c photos CSV \u6587\u4ef6\uff0c\u5148\u6821\u9a8c\u540e\u5bfc\u5165\u3002"}</p>

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
              {loading ? "\u6821\u9a8c\u4e2d..." : "\u6821\u9a8c"}
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={!canSubmit || loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "\u5bfc\u5165\u4e2d..." : "\u6821\u9a8c\u5e76\u5bfc\u5165"}
            </button>
          </div>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

        {validation ? (
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">{"\u6821\u9a8c\u7ed3\u679c"}</h2>
            <p className="mt-1 text-sm text-slate-600">
              spots: {validation.counts.spots}, facilities: {validation.counts.facilities}, photos: {validation.counts.photos}
            </p>
            <p className={`mt-2 text-sm font-medium ${validation.ok ? "text-emerald-700" : "text-rose-600"}`}>
              {validation.ok ? "\u6821\u9a8c\u901a\u8fc7" : `\u6821\u9a8c\u5931\u8d25\uff08${validation.errors.length} \u4e2a\u9519\u8bef\uff09`}
            </p>
          </section>
        ) : null}

        {execution ? (
          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">{"\u5bfc\u5165\u7ed3\u679c"}</h2>
            <p className={`mt-2 text-sm font-medium ${execution.ok ? "text-emerald-700" : "text-rose-600"}`}>
              {execution.ok ? "\u5bfc\u5165\u6210\u529f" : "\u5bfc\u5165\u5931\u8d25"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {"\u5df2\u5199\u5165 spots\uff1a"}{execution.inserted.spots}, facilities: {execution.inserted.facilities}, spot_facilities:{" "}
              {execution.inserted.spotFacilities}, photos: {execution.inserted.photos}
            </p>
            {execution.errors.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-xs text-rose-700">
                {execution.errors.slice(0, 20).map((err, idx) => (
                  <li key={`${err.file}-${err.row}-${idx}`}>
                    {err.file} {"\u7b2c"} {err.row} {"\u884c\uff1a"}{err.message}
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

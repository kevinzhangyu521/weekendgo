"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { DestinationImage } from "@/components/destinations/destination-image";
import type { DestinationPhoto } from "@/features/destinations/types";
import { createClient } from "@/lib/supabase/client";

const photoCategories = [
  { value: "cover", label: "封面图" },
  { value: "gallery", label: "图库" },
  { value: "play", label: "游玩场景" },
  { value: "parking", label: "停车信息" },
  { value: "toilet", label: "卫生间信息" },
  { value: "food", label: "餐饮" },
  { value: "camping", label: "露营" },
  { value: "water", label: "玩水" }
] as const;

type PhotoCategory = DestinationPhoto["category"];

type UploadPreview = {
  id: string;
  file: File;
  previewUrl: string;
  category: PhotoCategory;
  altText: string;
  sortOrder: number;
  isCover: boolean;
};

type PhotoResponse = {
  ok?: boolean;
  photos?: DestinationPhoto[];
  photo?: DestinationPhoto;
  deletedId?: string;
  message?: string;
  errors?: string[];
};

type PatchDraft = {
  category: PhotoCategory;
  altText: string;
  sortOrder: string;
  isCover: boolean;
};

async function authHeaders() {
  const supabase = createClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  return headers;
}

function normalizeSortOrder(value: string | number) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : 0;
}

function photoLabel(category: PhotoCategory) {
  return photoCategories.find((item) => item.value === category)?.label ?? category;
}

function makeDraft(photo: DestinationPhoto): PatchDraft {
  return {
    category: photo.category,
    altText: photo.altText ?? "",
    sortOrder: String(photo.sortOrder ?? 0),
    isCover: photo.isCover
  };
}

function draftsFromPhotos(photos: DestinationPhoto[]) {
  return Object.fromEntries(photos.map((photo) => [photo.id, makeDraft(photo)]));
}

function sortPhotos(photos: DestinationPhoto[]) {
  return [...photos].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

function hasCoverPhoto(photos: DestinationPhoto[]) {
  return photos.some((photo) => photo.isCover || photo.category === "cover");
}

export function DestinationPhotoManager({
  destinationId,
  destinationName,
  initialPhotos,
  hasLegacyCover = false
}: {
  destinationId: string;
  destinationName: string;
  initialPhotos: DestinationPhoto[];
  hasLegacyCover?: boolean;
}) {
  const [photos, setPhotos] = useState<DestinationPhoto[]>(sortPhotos(initialPhotos));
  const [previews, setPreviews] = useState<UploadPreview[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PatchDraft>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const previewsRef = useRef<UploadPreview[]>([]);

  useEffect(() => {
    const sortedPhotos = sortPhotos(initialPhotos);
    setPhotos(sortedPhotos);
    setDrafts(draftsFromPhotos(sortedPhotos));
  }, [initialPhotos]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    };
  }, []);

  const nextSortOrder = useMemo(() => {
    const maxExisting = photos.reduce((max, photo) => Math.max(max, photo.sortOrder ?? 0), 0);
    return maxExisting + previews.length + 1;
  }, [photos, previews.length]);

  function addPreviews(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;

    setMessage("");
    setPreviews((current) => {
      const existingCover = hasLegacyCover || hasCoverPhoto(photos) || current.some((item) => item.isCover);
      return [
        ...current,
        ...files.map((file, index) => {
          const shouldBeCover = !existingCover && index === 0;
          return {
            id: `${Date.now()}-${index}-${file.name}`,
            file,
            previewUrl: URL.createObjectURL(file),
            category: shouldBeCover ? "cover" : "gallery",
            altText: destinationName,
            sortOrder: nextSortOrder + index,
            isCover: shouldBeCover
          } satisfies UploadPreview;
        })
      ];
    });
    event.target.value = "";
  }

  function removePreview(id: string) {
    setPreviews((current) => {
      const target = current.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function updatePreview(id: string, patch: Partial<UploadPreview>) {
    setPreviews((current) =>
      current.map((item) => {
        if (item.id !== id) return patch.isCover ? { ...item, isCover: false, category: item.category === "cover" ? "gallery" : item.category } : item;

        const next = { ...item, ...patch };
        if (patch.isCover === true || patch.category === "cover") {
          next.isCover = true;
          next.category = "cover";
        }
        if (patch.category && patch.category !== "cover") {
          next.isCover = false;
        }
        return next;
      })
    );
  }

  function updateDraft(photoId: string, patch: Partial<PatchDraft>) {
    const fallback = photos.find((photo) => photo.id === photoId);
    if (!fallback && !drafts[photoId]) return;

    setDrafts((current) => {
      const currentDraft = current[photoId] ?? (fallback ? makeDraft(fallback) : { category: "gallery", altText: "", sortOrder: "0", isCover: false });
      const nextDraft = { ...currentDraft, ...patch };
      if (patch.isCover === true || patch.category === "cover") {
        nextDraft.isCover = true;
        nextDraft.category = "cover";
      }
      if (patch.category && patch.category !== "cover") {
        nextDraft.isCover = false;
      }

      const nextDrafts = { ...current, [photoId]: nextDraft };
      if (nextDraft.isCover) {
        Object.keys(nextDrafts).forEach((key) => {
          if (key !== photoId) nextDrafts[key] = { ...nextDrafts[key], isCover: false, category: nextDrafts[key].category === "cover" ? "gallery" : nextDrafts[key].category };
        });
      }
      return nextDrafts;
    });
  }

  async function uploadOne(preview: UploadPreview) {
    const formData = new FormData();
    formData.append("photos", preview.file);
    formData.set(
      "metadata",
      JSON.stringify([
        {
          category: preview.category,
          altText: preview.altText,
          sortOrder: preview.sortOrder,
          isCover: preview.isCover
        }
      ])
    );

    const response = await fetch(`/api/admin/destinations/${destinationId}/photos`, {
      method: "POST",
      headers: await authHeaders(),
      credentials: "include",
      body: formData
    });
    const result = (await response.json()) as PhotoResponse;
    if (!response.ok || !result.ok) throw new Error(result.message ?? "图片上传失败。");
    return result.photos ?? [];
  }

  async function uploadSelected() {
    if (previews.length === 0) return;
    setBusy("upload");
    setMessage("");

    const succeededIds = new Set<string>();
    const errors: string[] = [];
    let latestPhotos: DestinationPhoto[] | null = null;

    for (const preview of previews) {
      try {
        latestPhotos = await uploadOne(preview);
        succeededIds.add(preview.id);
        URL.revokeObjectURL(preview.previewUrl);
      } catch (error) {
        errors.push(`${preview.file.name}：${error instanceof Error ? error.message : "上传失败"}`);
      }
    }

    if (latestPhotos) {
      const sortedPhotos = sortPhotos(latestPhotos);
      setPhotos(sortedPhotos);
      setDrafts(draftsFromPhotos(sortedPhotos));
    }

    setPreviews((current) => current.filter((preview) => !succeededIds.has(preview.id)));
    setMessage(errors.length > 0 ? `已上传 ${succeededIds.size} 张，${errors.length} 张失败：${errors.join("；")}` : `已上传 ${succeededIds.size} 张图片。`);
    setBusy("");
  }

  async function savePhoto(photoId: string, forceCover = false) {
    const draft = drafts[photoId];
    if (!draft) return;

    const payload = {
      category: forceCover ? "cover" : draft.category,
      altText: draft.altText,
      sortOrder: normalizeSortOrder(draft.sortOrder),
      isCover: forceCover ? true : draft.isCover
    };

    setBusy(photoId);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/destinations/${destinationId}/photos/${photoId}`, {
        method: "PATCH",
        headers: {
          ...(await authHeaders()),
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as PhotoResponse;
      if (!response.ok || !result.ok || !result.photo) throw new Error(result.message ?? "图片保存失败。");

      const nextPhotos = sortPhotos(
        photos.map((photo) => {
          if (photo.id === photoId) return result.photo as DestinationPhoto;
          return result.photo?.isCover ? { ...photo, isCover: false, category: photo.category === "cover" ? "gallery" : photo.category } : photo;
        })
      );
      setPhotos(nextPhotos);
      setDrafts(draftsFromPhotos(nextPhotos));
      setMessage(forceCover ? "已设为封面。" : result.message ?? "图片信息已保存。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "图片保存失败。");
    } finally {
      setBusy("");
    }
  }

  async function deletePhoto(photo: DestinationPhoto) {
    if (!window.confirm("确定删除这张图片记录吗？Storage 文件会保留。")) return;

    setBusy(photo.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/destinations/${destinationId}/photos/${photo.id}`, {
        method: "DELETE",
        headers: await authHeaders(),
        credentials: "include"
      });
      const result = (await response.json()) as PhotoResponse;
      if (!response.ok || !result.ok) throw new Error(result.message ?? "图片删除失败。");

      const nextPhotos = photos.filter((item) => item.id !== photo.id);
      setPhotos(nextPhotos);
      setDrafts(draftsFromPhotos(nextPhotos));
      setMessage(result.message ?? "图片记录已删除。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "图片删除失败。");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">图片管理</h3>
          <p className="mt-1 text-xs text-slate-500">一次可以选择多张图片，第一张会作为默认封面（已有封面时不会替换）。</p>
        </div>
        <label className="inline-flex cursor-pointer rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
          选择图片
          <input type="file" accept="image/*" multiple onChange={addPreviews} className="sr-only" />
        </label>
      </div>

      {message ? <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700">{message}</p> : null}

      {previews.length > 0 ? (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-emerald-900">上传新图片</p>
              <p className="mt-1 text-xs text-emerald-800">已选择 {previews.length} 张，上传前可调整分类、排序和封面。</p>
            </div>
            <button
              type="button"
              onClick={uploadSelected}
              disabled={busy === "upload"}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "upload" ? "上传中..." : "开始上传"}
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {previews.map((preview) => (
              <div key={preview.id} className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
                <div className="relative h-36 bg-slate-100">
                  <img src={preview.previewUrl} alt={preview.file.name} className="h-full w-full object-cover" />
                  {preview.isCover ? <span className="absolute left-2 top-2 rounded-full bg-emerald-700 px-2 py-1 text-xs font-bold text-white">默认封面</span> : null}
                </div>
                <div className="space-y-2 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="text-xs font-bold text-slate-700">
                      分类
                      <select value={preview.category} onChange={(event) => updatePreview(preview.id, { category: event.target.value as PhotoCategory })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5">
                        {photoCategories.map((category) => (
                          <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-bold text-slate-700">
                      排序
                      <input type="number" value={preview.sortOrder} onChange={(event) => updatePreview(preview.id, { sortOrder: normalizeSortOrder(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5" />
                    </label>
                  </div>
                  <label className="block text-xs font-bold text-slate-700">
                    图片说明
                    <input value={preview.altText} onChange={(event) => updatePreview(preview.id, { altText: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5" />
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <button type="button" onClick={() => updatePreview(preview.id, { isCover: true })} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60" disabled={preview.isCover}>
                      {preview.isCover ? "已是封面" : "设为封面"}
                    </button>
                    <button type="button" onClick={() => removePreview(preview.id)} className="text-xs font-semibold text-rose-600">取消移除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-sm font-bold text-slate-900">当前图片列表</p>
        {photos.length > 0 ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {photos.map((photo) => {
              const draft = drafts[photo.id] ?? makeDraft(photo);
              return (
                <div key={photo.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="relative h-36 bg-slate-100">
                    <DestinationImage src={photo.imageUrl} alt={photo.altText || destinationName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    {photo.isCover ? <span className="absolute left-2 top-2 rounded-full bg-emerald-700 px-2 py-1 text-xs font-bold text-white">当前封面</span> : null}
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold">{photoLabel(photo.category)}</span>
                      {photo.isCover ? <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">封面图</span> : null}
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <label className="text-xs font-bold text-slate-700">
                        分类
                        <select value={draft.category} onChange={(event) => updateDraft(photo.id, { category: event.target.value as PhotoCategory })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5">
                          {photoCategories.map((category) => (
                            <option key={category.value} value={category.value}>{category.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-bold text-slate-700">
                        排序
                        <input type="number" value={draft.sortOrder} onChange={(event) => updateDraft(photo.id, { sortOrder: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5" />
                      </label>
                    </div>
                    <label className="block text-xs font-bold text-slate-700">
                      图片说明
                      <input value={draft.altText} onChange={(event) => updateDraft(photo.id, { altText: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5" />
                    </label>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button type="button" onClick={() => void savePhoto(photo.id, true)} disabled={busy === photo.id || photo.isCover} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60">
                        {photo.isCover ? "已是封面" : "设为封面"}
                      </button>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => void savePhoto(photo.id)} disabled={busy === photo.id} className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-60">
                          保存图片
                        </button>
                        <button type="button" onClick={() => void deletePhoto(photo)} disabled={busy === photo.id} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 disabled:opacity-60">
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">暂无图片，请先上传目的地封面或图库图片。</p>
        )}
      </div>
    </div>
  );
}

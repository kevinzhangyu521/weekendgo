"use client";

import { TouchEvent, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { DestinationImage } from "@/components/destinations/destination-image";
import type { DestinationPhoto } from "@/features/destinations/types";

const categoryLabels: Record<DestinationPhoto["category"], string> = {
  cover: "封面图",
  gallery: "图库",
  play: "游玩场景",
  parking: "停车信息",
  toilet: "卫生间信息",
  food: "餐饮",
  camping: "露营",
  water: "玩水"
};

function sortPhotos(photos: DestinationPhoto[]) {
  return [...photos].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });
}

export function DestinationPhotoGallery({
  photos,
  title = "图片"
}: {
  photos: DestinationPhoto[];
  title?: string;
}) {
  const sortedPhotos = useMemo(() => sortPhotos(photos), [photos]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const activePhoto = sortedPhotos[Math.min(activeIndex, Math.max(sortedPhotos.length - 1, 0))];
  const previewPhoto = previewIndex === null ? null : sortedPhotos[previewIndex] ?? null;
  const previewDisplayIndex = previewIndex ?? 0;
  const hasMultiplePhotos = sortedPhotos.length > 1;

  function previousIndex(current: number) {
    return current === 0 ? sortedPhotos.length - 1 : current - 1;
  }

  function nextIndex(current: number) {
    return current === sortedPhotos.length - 1 ? 0 : current + 1;
  }

  function showPreviousPhoto() {
    if (!hasMultiplePhotos) return;
    setActiveIndex((current) => previousIndex(current));
  }

  function showNextPhoto() {
    if (!hasMultiplePhotos) return;
    setActiveIndex((current) => nextIndex(current));
  }

  function showPreviousPreview() {
    if (!hasMultiplePhotos) return;
    setPreviewIndex((current) => (current === null ? current : previousIndex(current)));
  }

  function showNextPreview() {
    if (!hasMultiplePhotos) return;
    setPreviewIndex((current) => (current === null ? current : nextIndex(current)));
  }

  function openPreview(index: number) {
    setActiveIndex(index);
    setPreviewIndex(index);
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>, mode: "page" | "preview") {
    if (touchStartX === null || !hasMultiplePhotos) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (Math.abs(deltaX) < 40) return;
    if (mode === "preview") {
      if (deltaX > 0) showPreviousPreview();
      else showNextPreview();
      return;
    }
    if (deltaX > 0) showPreviousPhoto();
    else showNextPhoto();
  }

  if (!activePhoto) {
    return (
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">暂无图片</p>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {activeIndex + 1} / {sortedPhotos.length}
        </span>
      </div>

      <figure className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="relative aspect-[4/3] bg-slate-100">
          <button
            type="button"
            onClick={() => openPreview(activeIndex)}
            onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
            onTouchEnd={(event) => handleTouchEnd(event, "page")}
            className="flex h-full w-full touch-pan-y items-center justify-center p-2"
            aria-label="查看完整图片"
          >
            <DestinationImage
              src={activePhoto.imageUrl}
              alt={activePhoto.altText || title}
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          </button>

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">
              {categoryLabels[activePhoto.category]}
            </span>
            {activePhoto.isCover ? (
              <span className="rounded-full bg-emerald-700/90 px-3 py-1 text-xs font-bold text-white shadow-sm">封面</span>
            ) : null}
          </div>

          {hasMultiplePhotos ? (
            <>
              <button
                type="button"
                onClick={showPreviousPhoto}
                className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white md:inline-flex"
                aria-label="上一张图片"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNextPhoto}
                className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white md:inline-flex"
                aria-label="下一张图片"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        <figcaption className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm text-slate-600">
          <span>{activePhoto.altText || "目的地图片"}</span>
        </figcaption>
      </figure>

      {hasMultiplePhotos ? (
        <div className="mt-3 flex max-w-full snap-x gap-3 overflow-x-auto pb-2">
          {sortedPhotos.map((photo, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => openPreview(index)}
                className={`relative h-20 w-28 shrink-0 snap-start overflow-hidden rounded-xl border bg-slate-100 p-1 transition ${
                  isActive ? "border-emerald-600 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"
                }`}
                aria-label={`查看第 ${index + 1} 张图片`}
              >
                <DestinationImage
                  src={photo.imageUrl}
                  alt={photo.altText || "目的地缩略图"}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
                <span className="absolute bottom-1 left-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {categoryLabels[photo.category]}
                </span>
                {photo.isCover ? (
                  <span className="absolute right-1 top-1 rounded-full bg-emerald-700/90 px-2 py-0.5 text-[10px] font-bold text-white">封面</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {previewPhoto ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/85 p-4" onClick={() => setPreviewIndex(null)}>
          <div className="flex max-h-full w-full max-w-6xl flex-col gap-3" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{previewPhoto.altText || title}</p>
                <p className="mt-1 text-xs text-white/70">
                  {previewDisplayIndex + 1} / {sortedPhotos.length} · {categoryLabels[previewPhoto.category]}
                  {previewPhoto.isCover ? " · 封面" : ""}
                </p>
              </div>
              <button type="button" onClick={() => setPreviewIndex(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="关闭预览">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="relative flex min-h-[280px] touch-pan-y items-center justify-center rounded-2xl bg-white/5 p-3"
              onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
              onTouchEnd={(event) => handleTouchEnd(event, "preview")}
            >
              {hasMultiplePhotos ? (
                <button type="button" onClick={showPreviousPreview} className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-sm hover:bg-white" aria-label="上一张图片">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : null}
              <DestinationImage
                src={previewPhoto.imageUrl}
                alt={previewPhoto.altText || title}
                loading="eager"
                decoding="async"
                className="max-h-[78vh] max-w-full object-contain"
              />
              {hasMultiplePhotos ? (
                <button type="button" onClick={showNextPreview} className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow-sm hover:bg-white" aria-label="下一张图片">
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

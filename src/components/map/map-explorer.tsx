"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MapPinned, Star } from "lucide-react";
import type { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { DestinationItem } from "@/features/destinations/types";
import type { Locale } from "@/lib/i18n/config";
import { setupMapboxToken } from "@/lib/mapbox/client";
import { DEFAULT_CITY } from "@/lib/mapbox/constants";

type Props = {
  items: DestinationItem[];
  locale: Locale;
};

function displayName(item: DestinationItem) {
  return item.nameZh || item.name;
}

function displayCity(item: DestinationItem) {
  const province = item.provinceZh || item.province || "";
  const city = item.cityZh || item.city;
  if (!province || province === city) return city;
  return `${province} ${city}`;
}

function formatDistance(distanceKm: number) {
  if (!distanceKm || distanceKm <= 0) return "\u8ddd\u79bb\u5f85\u8ba1\u7b97";
  return `\u7ea6 ${distanceKm}km`;
}

export function MapExplorer({ items, locale }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const mapToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const activeItem = useMemo(() => items.find((item) => item.id === activeId) ?? null, [activeId, items]);

  useEffect(() => {
    if (!containerRef.current || !mapToken || mapRef.current) return;

    const mapboxgl = setupMapboxToken();
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [DEFAULT_CITY.longitude, DEFAULT_CITY.latitude],
      zoom: DEFAULT_CITY.zoom
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    items.forEach((item) => {
      const marker = new mapboxgl.Marker({ color: "#16a34a" })
        .setLngLat([item.longitude, item.latitude])
        .setPopup(new mapboxgl.Popup({ offset: 24 }).setHTML(`<strong>${displayName(item)}</strong><br/>${formatDistance(item.distanceKm)}`))
        .addTo(map);

      marker.getElement().addEventListener("click", () => setActiveId(item.id));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [items, mapToken]);

  useEffect(() => {
    if (!mapRef.current || !activeItem) return;
    mapRef.current.flyTo({
      center: [activeItem.longitude, activeItem.latitude],
      zoom: Math.max(11, mapRef.current.getZoom()),
      essential: true
    });
  }, [activeItem]);

  if (!mapToken) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        {"\u7f3a\u5c11 Mapbox Token\uff0c\u8bf7\u5728 Vercel \u73af\u5883\u53d8\u91cf\u4e2d\u914d\u7f6e NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN \u540e\u518d\u67e5\u770b\u5730\u56fe\u3002"}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <div className="max-h-[70vh] space-y-3 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border p-3 transition ${
              activeId === item.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <button onClick={() => setActiveId(item.id)} className="w-full text-left">
              <div className="flex items-center justify-between">
                <p className="line-clamp-1 text-sm font-semibold text-slate-900">{displayName(item)}</p>
                <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                  <Star className="h-3.5 w-3.5 fill-current text-amber-500" />
                  {item.rating.toFixed(1)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {displayCity(item)} - {formatDistance(item.distanceKm)}
              </p>
            </button>
            <Link href={`/destinations/${item.id}`} className="mt-2 inline-flex text-xs font-medium text-emerald-700">
              {"\u67e5\u770b\u8be6\u60c5"}
            </Link>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm text-slate-700">
          <span className="inline-flex items-center gap-2">
            <MapPinned className="h-4 w-4" />
            {"\u5730\u56fe\u63a2\u7d22"}
          </span>
          <span>{items.length} {"\u4e2a\u5730\u70b9"}</span>
        </div>
        <div ref={containerRef} className="h-[70vh] w-full" />
      </div>
    </div>
  );
}

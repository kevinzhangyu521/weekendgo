import mapboxgl from "mapbox-gl";

export function setupMapboxToken() {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";
  return mapboxgl;
}

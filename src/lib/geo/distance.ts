import type { DestinationItem } from "@/features/destinations/types";

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export const DEFAULT_HOME_CITY = "\u6b66\u6c49";

export const knownCityCoordinates: Record<string, Coordinate> = {
  "\u6b66\u6c49": { latitude: 30.5928, longitude: 114.3055 },
  Wuhan: { latitude: 30.5928, longitude: 114.3055 },
  "\u4e0a\u6d77": { latitude: 31.2304, longitude: 121.4737 },
  Shanghai: { latitude: 31.2304, longitude: 121.4737 },
  "\u5317\u4eac": { latitude: 39.9042, longitude: 116.4074 },
  Beijing: { latitude: 39.9042, longitude: 116.4074 },
  "\u676d\u5dde": { latitude: 30.2741, longitude: 120.1551 },
  Hangzhou: { latitude: 30.2741, longitude: 120.1551 },
  "\u6210\u90fd": { latitude: 30.5728, longitude: 104.0668 },
  Chengdu: { latitude: 30.5728, longitude: 104.0668 },
  "\u5e7f\u5dde": { latitude: 23.1291, longitude: 113.2644 },
  Guangzhou: { latitude: 23.1291, longitude: 113.2644 },
  "\u6df1\u5733": { latitude: 22.5431, longitude: 114.0579 },
  Shenzhen: { latitude: 22.5431, longitude: 114.0579 }
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function hasValidCoordinate(coordinate: Coordinate) {
  return (
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    Math.abs(coordinate.latitude) <= 90 &&
    Math.abs(coordinate.longitude) <= 180 &&
    (coordinate.latitude !== 0 || coordinate.longitude !== 0)
  );
}

export function getKnownCityCoordinate(city: string) {
  return knownCityCoordinates[city] ?? null;
}

export function getCityCoordinateOrDefault(city: string) {
  return getKnownCityCoordinate(city) ?? knownCityCoordinates[DEFAULT_HOME_CITY];
}

export function calculateStraightLineDistanceKm(origin: Coordinate, destination: Coordinate) {
  if (!hasValidCoordinate(origin) || !hasValidCoordinate(destination)) return 0;

  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusKm * c * 10) / 10;
}

export function withDistanceFromCity<T extends DestinationItem>(items: T[], city: string): T[] {
  const origin = getCityCoordinateOrDefault(city);

  return items.map((item) => ({
    ...item,
    distanceKm: calculateStraightLineDistanceKm(origin, {
      latitude: item.latitude,
      longitude: item.longitude
    })
  }));
}

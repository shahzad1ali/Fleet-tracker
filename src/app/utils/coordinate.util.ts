import {
  DecimalDegreePattern,
  MaximumLatitude,
  MaximumLongitude,
  MinimumLatitude,
  MinimumLongitude,
} from '../constants/coordinate.constants';
import { Coordinate } from '../models/vehicle.model';

export type CoordinateParseResult =
  | { ok: true; coordinate: Coordinate }
  | { ok: false; error: string };

export function parseCoordinate(value: string): CoordinateParseResult {
  const parts = value.split(',').map((part) => part.trim());
  if (parts.length !== 2 || parts.some((part) => !DecimalDegreePattern.test(part))) {
    return { ok: false, error: 'Enter coordinates as latitude, longitude.' };
  }

  const [lat, lng] = parts.map((part) => Number(part));
  if (lat < MinimumLatitude || lat > MaximumLatitude) {
    return { ok: false, error: 'Latitude must be between -90 and 90 degrees.' };
  }

  if (lng < MinimumLongitude || lng > MaximumLongitude) {
    return { ok: false, error: 'Longitude must be between -180 and 180 degrees.' };
  }

  return { ok: true, coordinate: { lat, lng } };
}

export function sameCoordinate(first: Coordinate, second: Coordinate): boolean {
  return first.lat === second.lat && first.lng === second.lng;
}

export function formatCoordinate(coordinate: Coordinate): string {
  return `${coordinate.lat}, ${coordinate.lng}`;
}

import { Coordinate } from '../models/vehicle.model';

/** Nearest-neighbor visit order: closest to start, then closest to each previous stop. */
export function orderNearestNeighbor(start: Coordinate, destinations: Coordinate[]): Coordinate[] {
  const remaining = [...destinations];
  const ordered: Coordinate[] = [];
  let current = start;

  while (remaining.length) {
    let nearestIndex = 0;
    let nearestDistance = distanceMeters(current, remaining[0]);

    for (let index = 1; index < remaining.length; index += 1) {
      const distance = distanceMeters(current, remaining[index]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    const [nextStop] = remaining.splice(nearestIndex, 1);
    ordered.push(nextStop);
    current = nextStop;
  }

  return ordered;
}

function distanceMeters(from: Coordinate, to: Coordinate): number {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const originLatitude = toRadians(from.lat);
  const destinationLatitude = toRadians(to.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

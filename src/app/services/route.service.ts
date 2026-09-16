import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { OsrmRouteOptions, OsrmRouteUrl } from '../constants/route.constants';
import { Coordinate, RouteResult } from '../models/vehicle.model';

interface OsrmRouteResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
}

@Injectable({ providedIn: 'root' })
export class RouteService {
  constructor(private readonly http: HttpClient) {}

  calculateRoute(startCoordinate: Coordinate, destinations: Coordinate[], optimize = false): Observable<RouteResult> {
    const orderedDestinations = optimize
      ? this.orderNearestNeighbor(startCoordinate, destinations)
      : destinations;
    const coordinates = [startCoordinate, ...orderedDestinations]
      .map((coordinate) => `${coordinate.lng},${coordinate.lat}`)
      .join(';');
    const url = `${OsrmRouteUrl}/${coordinates}?${OsrmRouteOptions}`;

    return this.http.get<OsrmRouteResponse>(url).pipe(
      map((response) => {
        const route = response.routes?.[0];
        if (response.code !== 'Ok' || !route) {
          throw new Error('OSRM did not return a route for these coordinates.');
        }

        return {
          distanceKm: route.distance / 1000,
          etaMinutes: route.duration / 60,
          geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
          destinations: orderedDestinations,
          mode: optimize ? ('optimized' as const) : ('destination' as const),
        };
      }),
      catchError(() =>
        throwError(() => new Error('Unable to calculate the route. Please try again.')),
      ),
    );
  }

  private orderNearestNeighbor(start: Coordinate, destinations: Coordinate[]): Coordinate[] {
    const remaining = [...destinations];
    const ordered: Coordinate[] = [];
    let current = start;

    while (remaining.length) {
      let nearestIndex = 0;
      let nearestDistance = this.distanceMeters(current, remaining[0]);

      for (let index = 1; index < remaining.length; index += 1) {
        const distance = this.distanceMeters(current, remaining[index]);
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

  private distanceMeters(from: Coordinate, to: Coordinate): number {
    const earthRadiusMeters = 6371000;
    const latitudeDelta = this.toRadians(to.lat - from.lat);
    const longitudeDelta = this.toRadians(to.lng - from.lng);
    const originLatitude = this.toRadians(from.lat);
    const destinationLatitude = this.toRadians(to.lat);
    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;

    return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}

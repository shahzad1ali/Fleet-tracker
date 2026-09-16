import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { OsrmRouteOptions, OsrmRouteUrl } from '../constants/route.constants';
import { Coordinate, RouteResult } from '../models/vehicle.model';
import { orderNearestNeighbor } from '../utils/route-order.util';

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
      ? orderNearestNeighbor(startCoordinate, destinations)
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
      catchError((error: unknown) => {
        console.error('Route calculation failed', error);
        return throwError(() => new Error('Unable to calculate the route. Please try again.'));
      }),
    );
  }
}

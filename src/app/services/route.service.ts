import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
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
  private readonly osrmUrl = 'https://router.project-osrm.org/route/v1/driving';

  constructor(private readonly http: HttpClient) {}

  calculateRoute(start: Coordinate, end: Coordinate): Observable<RouteResult> {
    const url = `${this.osrmUrl}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

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
        };
      }),
      catchError(() =>
        throwError(() => new Error('Unable to calculate the route. Please try again.')),
      ),
    );
  }
}

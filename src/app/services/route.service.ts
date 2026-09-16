import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { OsrmRouteOptions, OsrmRouteUrl, OsrmTripUrl } from '../constants/route.constants';
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
  trips?: Array<{
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
    const coordinates = [startCoordinate, ...destinations]
      .map((coordinate) => `${coordinate.lng},${coordinate.lat}`)
      .join(';');
    const useTripEndpoint = optimize && destinations.length > 1;
    const baseUrl = useTripEndpoint ? OsrmTripUrl : OsrmRouteUrl;
    const options = useTripEndpoint ? `${OsrmRouteOptions}&roundtrip=false&source=first&destination=last` : OsrmRouteOptions;
    const url = `${baseUrl}/${coordinates}?${options}`;

    return this.http.get<OsrmRouteResponse>(url).pipe(
      map((response) => {
        const route = (useTripEndpoint ? response.trips?.[0] : response.routes?.[0]);
        if (response.code !== 'Ok' || !route) {
          throw new Error('OSRM did not return a route for these coordinates.');
        }

        return {
          distanceKm: route.distance / 1000,
          etaMinutes: route.duration / 60,
          geometry: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
          destinations,
          mode: optimize ? ('optimized' as const) : ('destination' as const),
        };
      }),
      catchError(() =>
        throwError(() => new Error('Unable to calculate the route. Please try again.')),
      ),
    );
  }
}

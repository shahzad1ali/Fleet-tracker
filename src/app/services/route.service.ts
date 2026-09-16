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
    waypoints?: Array<{
      waypoint_index: number;
      location: [number, number];
    }>;
  }>;
  trips?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
    waypoints?: Array<{
      waypoint_index: number;
      location: [number, number];
    }>;
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

        const orderedDestinations = useTripEndpoint
          ? this.getOptimizedDestinations(destinations, route.waypoints)
          : destinations;

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

  private getOptimizedDestinations(
    destinations: Coordinate[],
    waypoints?: Array<{ waypoint_index: number; location: [number, number] }>,
  ): Coordinate[] {
    if (!waypoints || waypoints.length !== destinations.length + 1) {
      return destinations;
    }

    // OSRM returns waypoints in input order; waypoint_index is their optimized visit order.
    return waypoints
      .map((waypoint, inputIndex) => ({ waypoint, inputIndex }))
      .filter(({ inputIndex }) => inputIndex > 0)
      .sort((first, second) => first.waypoint.waypoint_index - second.waypoint.waypoint_index)
      .map(({ inputIndex }) => destinations[inputIndex - 1]);
  }
}

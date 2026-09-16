import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';
import { VehicleService } from './vehicle.service';
import { RouteService } from './route.service';
import { Coordinate, RouteResult, Vehicle } from '../models/vehicle.model';
import { formatCoordinate, parseCoordinate, sameCoordinate } from '../utils/coordinate.util';

export interface FleetViewState {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  destinationTexts: string[];
  destinations: Coordinate[];
  routeResult: RouteResult | null;
  routeMode: 'destination' | 'optimized' | null;
  loading: boolean;
  errorMessage: string;
  hasUserSelectedVehicle: boolean;
}

@Injectable({ providedIn: 'root' })
export class FleetStateService {
  private readonly vehicleService = inject(VehicleService);
  private readonly routeService = inject(RouteService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly vehicles = this.vehicleService.getVehicles();
  private readonly stateSubject = new BehaviorSubject<FleetViewState>({
    vehicles: this.vehicles,
    selectedVehicleId: this.vehicles[0].id,
    destinationTexts: [],
    destinations: [],
    routeResult: null,
    routeMode: null,
    loading: false,
    errorMessage: '',
    hasUserSelectedVehicle: false,
  });

  private readonly routeRequest$ = new Subject<{ optimize: boolean }>();

  readonly state$ = this.stateSubject.asObservable();

  constructor() {
    this.routeRequest$
      .pipe(
        switchMap(({ optimize }) => {
          const state = this.stateSubject.value;
          const destinations = this.resolveDestinations(state.destinationTexts);
          if (!destinations.ok) {
            this.patch({
              loading: false,
              errorMessage: destinations.error,
              routeResult: null,
              routeMode: null,
              destinations: [],
            });
            return EMPTY;
          }

          const vehicle = this.findVehicle(state.selectedVehicleId);
          if (!vehicle) {
            this.patch({
              loading: false,
              errorMessage: 'Selected vehicle was not found.',
              routeResult: null,
            });
            return EMPTY;
          }

          this.patch({
            loading: true,
            errorMessage: '',
            routeResult: null,
            destinations: destinations.coordinates,
            routeMode: optimize ? 'optimized' : 'destination',
          });

          return this.routeService.calculateRoute(vehicle.liveLocation, destinations.coordinates, optimize).pipe(
            tap((result) => {
              const destinationTexts =
                result.mode === 'optimized'
                  ? this.reorderDestinationTexts(state.destinationTexts, destinations.coordinates, result.destinations)
                  : state.destinationTexts;

              this.patch({
                loading: false,
                routeResult: result,
                destinations: result.destinations,
                destinationTexts,
                routeMode: result.mode,
                errorMessage: '',
              });
            }),
            catchError((error: Error) => {
              this.patch({
                loading: false,
                routeResult: null,
                routeMode: null,
                errorMessage: error.message,
              });
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  get snapshot(): FleetViewState {
    return this.stateSubject.value;
  }

  selectVehicle(vehicleId: string): void {
    const vehicle = this.findVehicle(vehicleId);
    if (!vehicle) {
      return;
    }

    const { destinationTexts } = this.stateSubject.value;
    this.patch({
      selectedVehicleId: vehicle.id,
      hasUserSelectedVehicle: true,
      routeResult: null,
      routeMode: null,
      errorMessage: '',
      destinations: destinationTexts.length ? this.stateSubject.value.destinations : [],
    });

    if (destinationTexts.length) {
      this.requestRoute(false);
    } else {
      this.patch({ destinations: [] });
    }
  }

  addDestination(rawValue: string): void {
    const draft = rawValue.trim();
    const parsed = parseCoordinate(draft);
    if (!parsed.ok) {
      this.patch({ errorMessage: parsed.error });
      return;
    }

    const text = formatCoordinate(parsed.coordinate);
    const { destinationTexts } = this.stateSubject.value;
    if (destinationTexts.includes(text) || destinationTexts.includes(draft)) {
      this.patch({ errorMessage: '' });
      this.requestRoute(false);
      return;
    }

    this.patch({
      destinationTexts: [...destinationTexts, draft],
      errorMessage: '',
    });
    this.requestRoute(false);
  }

  removeDestination(index: number): void {
    const destinationTexts = [...this.stateSubject.value.destinationTexts];
    if (index < 0 || index >= destinationTexts.length) {
      return;
    }

    destinationTexts.splice(index, 1);
    if (!destinationTexts.length) {
      this.patch({
        destinationTexts: [],
        destinations: [],
        routeResult: null,
        routeMode: null,
        errorMessage: '',
        loading: false,
      });
      return;
    }

    this.patch({ destinationTexts, errorMessage: '' });
    this.requestRoute(false);
  }

  moveDestination(sourceIndex: number, targetIndex: number | null): void {
    const destinationTexts = [...this.stateSubject.value.destinationTexts];
    if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= destinationTexts.length) {
      return;
    }

    if (targetIndex !== null && sourceIndex === targetIndex) {
      return;
    }

    const [destination] = destinationTexts.splice(sourceIndex, 1);
    const insertionIndex =
      targetIndex === null ? destinationTexts.length : Math.min(targetIndex, destinationTexts.length);
    destinationTexts.splice(insertionIndex, 0, destination);

    this.patch({
      destinationTexts,
      routeResult: null,
      errorMessage: '',
    });
    this.requestRoute(false);
  }

  optimizeRoute(): void {
    if (!this.stateSubject.value.destinationTexts.length) {
      this.patch({ errorMessage: 'Add at least one destination before calculating a route.' });
      return;
    }
    this.requestRoute(true);
  }

  private requestRoute(optimize: boolean): void {
    this.routeRequest$.next({ optimize });
  }

  private resolveDestinations(
    destinationTexts: string[],
  ): { ok: true; coordinates: Coordinate[] } | { ok: false; error: string } {
    if (!destinationTexts.length) {
      return { ok: false, error: 'Add at least one destination before calculating a route.' };
    }

    const coordinates: Coordinate[] = [];
    for (const text of destinationTexts) {
      const parsed = parseCoordinate(text);
      if (!parsed.ok) {
        return { ok: false, error: parsed.error };
      }
      coordinates.push(parsed.coordinate);
    }

    return { ok: true, coordinates };
  }

  private reorderDestinationTexts(
    destinationTexts: string[],
    destinations: Coordinate[],
    orderedDestinations: Coordinate[],
  ): string[] {
    const remainingIndexes = destinations.map((_, index) => index);

    return orderedDestinations
      .map((destination) => {
        const matchingIndex = remainingIndexes.findIndex((index) =>
          sameCoordinate(destinations[index], destination),
        );
        if (matchingIndex === -1) {
          return null;
        }
        const [destinationIndex] = remainingIndexes.splice(matchingIndex, 1);
        return destinationTexts[destinationIndex];
      })
      .filter((destinationText): destinationText is string => destinationText !== null);
  }

  private findVehicle(vehicleId: string): Vehicle | undefined {
    return this.vehicles.find((vehicle) => vehicle.id === vehicleId);
  }

  private patch(partial: Partial<FleetViewState>): void {
    this.stateSubject.next({ ...this.stateSubject.value, ...partial });
  }
}

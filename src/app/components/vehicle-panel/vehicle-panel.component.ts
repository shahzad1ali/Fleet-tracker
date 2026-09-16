import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DecimalDegreePattern,
  MaximumLatitude,
  MaximumLongitude,
  MinimumLatitude,
  MinimumLongitude,
} from '../../constants/coordinate.constants';
import { DefaultDestination } from '../../constants/fleet-data';
import { Coordinate, RouteResult, Vehicle } from '../../models/vehicle.model';
import { RouteService } from '../../services/route.service';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicle-panel.component.html',
  host: { class: 'block h-full' },
})

export class VehiclePanelComponent {
  @Input() set selectedVehicleId(vehicleId: string) {
    const vehicle = this.vehicles.find((item) => item.id === vehicleId);
    if (vehicle) {
      this.selectedVehicle = vehicle;
    }
  }

  @Output() routeCalculated = new EventEmitter<RouteResult>();
  @Output() destinationChanged = new EventEmitter<Coordinate[]>();
  @Output() routeCleared = new EventEmitter<void>();
  @Output() vehicleChanged = new EventEmitter<Vehicle>();

  readonly vehicles = this.vehicleService.getVehicles();
  selectedVehicle = this.vehicles[0];
  destinationTexts: string[] = [];
  destinationRanks: number[] = [];
  draftDestinationText = DefaultDestination;
  activeRouteMode: 'destination' | 'optimized' | null = null;
  routeResult: RouteResult | null = null;
  loading = false;
  errorMessage = '';
  private routeRequestId = 0;

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly routeService: RouteService,
  ) {}

  selectVehicle(vehicleId: string): void {
    const vehicle = this.vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) {
      return;
    }

    this.selectedVehicle = vehicle;
    this.routeResult = null;
    this.activeRouteMode = null;
    this.errorMessage = '';
    this.routeRequestId += 1;
    this.vehicleChanged.emit(vehicle);
    if (this.destinationTexts.length) {
      this.calculateRoute();
    }
  }

  calculateRoute(): void {
    this.activeRouteMode = 'destination';
    this.requestRoute(false);
  }

  optimizeRoute(): void {
    this.activeRouteMode = 'optimized';
    this.requestRoute(true);
  }

  addDestination(): void {
    this.draftDestinationText = '';
    this.errorMessage = '';
  }

  removeDestination(index: number): void {
    this.destinationTexts.splice(index, 1);
    this.destinationRanks.splice(index, 1);
    this.routeResult = null;
    this.errorMessage = '';
    if (this.destinationTexts.length) {
      this.calculateRoute();
    } else {
      this.activeRouteMode = null;
      this.destinationChanged.emit([]);
      this.routeCleared.emit();
    }
  }

  commitDraftDestination(): void {
    const draft = this.draftDestinationText.trim();
    const destination = this.parseCoordinate(draft);
    if (!destination) {
      this.errorMessage = this.getCoordinateError(draft);
      return;
    }

    if (!this.destinationTexts.includes(draft)) {
      this.destinationTexts.push(draft);
      this.destinationRanks.push(this.destinationTexts.length);
    }
    this.draftDestinationText = '';
    this.errorMessage = '';
    this.calculateRoute();
  }

  startDestinationDrag(event: DragEvent, index: number): void {
    event.dataTransfer?.setData('text/plain', String(index));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  allowDestinationDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  dropDestination(event: DragEvent, targetIndex: number | null): void {
    event.preventDefault();
    event.stopPropagation();
    const sourceIndex = Number(event.dataTransfer?.getData('text/plain'));
    if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= this.destinationTexts.length) {
      return;
    }

    if (targetIndex !== null && sourceIndex === targetIndex) {
      return;
    }

    const destination = this.destinationTexts.splice(sourceIndex, 1)[0];
    const insertionIndex = targetIndex === null
      ? this.destinationTexts.length
      : Math.min(targetIndex, this.destinationTexts.length);
    this.destinationTexts.splice(insertionIndex, 0, destination);
    this.destinationRanks = this.destinationTexts.map((_, index) => index + 1);
    this.routeResult = null;
    this.errorMessage = '';
    this.calculateRoute();
  }

  private requestRoute(optimize: boolean): void {
    const destinations = this.parseDestinations();
    if (!destinations) {
      this.routeResult = null;
      return;
    }

    const requestId = ++this.routeRequestId;
    const startCoordinate = { ...this.selectedVehicle.liveLocation };
    this.destinationRanks = destinations.map((_, index) => index + 1);
    this.routeResult = null;
    this.loading = true;
    this.errorMessage = '';
    this.routeService.calculateRoute(startCoordinate, destinations, optimize).subscribe({
      next: (result) => {
        if (requestId !== this.routeRequestId) return;
        this.routeResult = result;
        if (result.mode === 'optimized') {
          this.destinationTexts = this.reorderDestinationTexts(this.destinationTexts, destinations, result.destinations);
        }
        this.destinationRanks = this.destinationTexts.map((_, index) => index + 1);
        this.destinationChanged.emit(result.destinations);
        this.routeCalculated.emit(result);
        this.loading = false;
      },
      error: (error: Error) => {
        if (requestId !== this.routeRequestId) return;
        this.errorMessage = error.message;
        this.routeResult = null;
        this.loading = false;
      },
    });
  }

  private parseDestinations(): Coordinate[] | null {
    if (!this.destinationTexts.length) {
      this.errorMessage = 'Add at least one destination before calculating a route.';
      return null;
    }

    const destinations = this.destinationTexts.map((destinationText) => this.parseCoordinate(destinationText));
    const invalidIndex = destinations.findIndex((destination) => !destination);
    if (invalidIndex !== -1) {
      this.errorMessage = this.getCoordinateError(this.destinationTexts[invalidIndex]);
      return null;
    }

    return destinations as Coordinate[];
  }

  private reorderDestinationTexts(
    destinationTexts: string[],
    destinations: Coordinate[],
    orderedDestinations: Coordinate[],
  ): string[] {
    const remainingIndexes = destinations.map((_, index) => index);

    return orderedDestinations.map((destination) => {
      const matchingIndex = remainingIndexes.findIndex((index) =>
        this.sameCoordinate(destinations[index], destination),
      );

      if (matchingIndex === -1) {
        return null;
      }

      const [destinationIndex] = remainingIndexes.splice(matchingIndex, 1);
      return destinationTexts[destinationIndex];
    }).filter((destinationText): destinationText is string => destinationText !== null);
  }

  private sameCoordinate(first: Coordinate, second: Coordinate): boolean {
    return first.lat === second.lat && first.lng === second.lng;
  }

  private parseCoordinate(value: string): Coordinate | null {
    const parts = value.split(',').map((part) => part.trim());
    if (parts.length !== 2 || parts.some((part) => !DecimalDegreePattern.test(part))) {
      return null;
    }

    const [lat, lng] = parts.map((part) => Number(part));
    if (lat < MinimumLatitude || lat > MaximumLatitude || lng < MinimumLongitude || lng > MaximumLongitude) {
      return null;
    }

    return { lat, lng };
  }

  private getCoordinateError(value: string): string {
    const parts = value.split(',').map((part) => part.trim());
    if (parts.length !== 2 || parts.some((part) => !DecimalDegreePattern.test(part))) {
      return 'Enter coordinates as latitude, longitude.';
    }

    const [lat, lng] = parts.map((part) => Number(part));
    if (lat < MinimumLatitude || lat > MaximumLatitude) {
      return 'Latitude must be between -90 and 90 degrees.';
    }

    if (lng < MinimumLongitude || lng > MaximumLongitude) {
      return 'Longitude must be between -180 and 180 degrees.';
    }

    return 'Enter a valid destination.';
  }
}

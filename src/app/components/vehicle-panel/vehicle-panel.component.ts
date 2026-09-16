import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
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
  @Output() vehicleChanged = new EventEmitter<Vehicle>();

  readonly vehicles = this.vehicleService.getVehicles();
  selectedVehicle = this.vehicles[0];
  destinationTexts: string[] = [];
  draftDestinationText = DefaultDestination;
  destinationsOpen = false;
  activeRouteMode: 'destination' | 'optimized' | null = null;
  routeResult: RouteResult | null = null;
  loading = false;
  errorMessage = '';
  private routeRequestId = 0;

  constructor(
    private readonly vehicleService: VehicleService,
    private readonly routeService: RouteService,
    private readonly elementRef: ElementRef<HTMLElement>,
  ) {}

  @HostListener('document:click', ['$event'])
  closeDestinationMenuOnOutsideClick(event: MouseEvent): void {
    if (event.target instanceof Node && !this.elementRef.nativeElement.contains(event.target)) {
      this.destinationsOpen = false;
    }
  }

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
  }

  calculateRoute(): void {
    this.activeRouteMode = 'destination';
    const destinations = this.parseDestinations();
    if (!destinations) {
      this.routeResult = null;
      return;
    }

    const requestId = ++this.routeRequestId;
    const startCoordinate = { ...this.selectedVehicle.liveLocation };
    this.routeResult = null;
    this.loading = true;
    this.errorMessage = '';
    this.routeService.calculateRoute(startCoordinate, destinations).subscribe({
      next: (result) => {
        if (requestId !== this.routeRequestId) {
          return;
        }

        this.routeResult = result;
        this.destinationChanged.emit(destinations);
        this.routeCalculated.emit(result);
        this.loading = false;
      },
      error: (error: Error) => {
        if (requestId !== this.routeRequestId) {
          return;
        }

        this.errorMessage = error.message;
        this.routeResult = null;
        this.loading = false;
      },
    });
  }

  optimizeRoute(): void {
    this.activeRouteMode = 'optimized';
    const destinations = this.parseDestinations();
    if (!destinations) {
      this.routeResult = null;
      return;
    }

    const requestId = ++this.routeRequestId;
    const startCoordinate = { ...this.selectedVehicle.liveLocation };
    this.routeResult = null;
    this.loading = true;
    this.errorMessage = '';
    this.routeService.calculateRoute(startCoordinate, destinations, true).subscribe({
      next: (result) => {
        if (requestId !== this.routeRequestId) return;
        this.routeResult = result;
        this.destinationChanged.emit(destinations);
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

  addDestination(): void {
    this.draftDestinationText = '';
    this.destinationsOpen = true;
    this.errorMessage = '';
  }

  removeDestination(index: number): void {
    this.destinationTexts.splice(index, 1);
    this.routeResult = null;
    this.errorMessage = '';
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
    }
    this.draftDestinationText = '';
    this.destinationsOpen = false;
    this.errorMessage = '';
  }

  selectDestination(index: number): void {
    this.draftDestinationText = this.destinationTexts[index];
    this.destinationsOpen = false;
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
      return 'Enter coordinates as decimal degrees: latitude, longitude.';
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

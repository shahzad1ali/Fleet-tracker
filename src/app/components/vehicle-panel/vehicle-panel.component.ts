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
})

export class VehiclePanelComponent {
  @Input() set selectedVehicleId(vehicleId: string) {
    const vehicle = this.vehicles.find((item) => item.id === vehicleId);
    if (vehicle) {
      this.selectedVehicle = vehicle;
    }
  }

  @Output() routeCalculated = new EventEmitter<RouteResult>();
  @Output() destinationChanged = new EventEmitter<Coordinate>();
  @Output() vehicleChanged = new EventEmitter<Vehicle>();

  readonly vehicles = this.vehicleService.getVehicles();
  selectedVehicle = this.vehicles[0];
  destinationText = DefaultDestination;
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
    this.errorMessage = '';
    this.routeRequestId += 1;
    this.vehicleChanged.emit(vehicle);
  }

  calculateRoute(): void {
    const destination = this.parseCoordinate(this.destinationText);
    if (!destination) {
      this.errorMessage = this.getCoordinateError(this.destinationText);
      this.routeResult = null;
      return;
    }

    const requestId = ++this.routeRequestId;
    const startCoordinate = { ...this.selectedVehicle.liveLocation };
    this.loading = true;
    this.errorMessage = '';
    this.routeService.calculateRoute(startCoordinate, destination).subscribe({
      next: (result) => {
        if (requestId !== this.routeRequestId) {
          return;
        }

        this.routeResult = result;
        this.destinationChanged.emit(destination);
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

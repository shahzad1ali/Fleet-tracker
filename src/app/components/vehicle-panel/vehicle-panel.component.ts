import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  @Output() routeCalculated = new EventEmitter<RouteResult>();
  @Output() destinationChanged = new EventEmitter<Coordinate>();
  @Output() vehicleChanged = new EventEmitter<Vehicle>();

  readonly vehicles = this.vehicleService.getVehicles();
  selectedVehicle = this.vehicles[0];
  destinationText = '31.4504, 74.2872';
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
      this.errorMessage = 'Enter a destination as latitude, longitude.';
      this.routeResult = null;
      return;
    }

    const requestId = ++this.routeRequestId;
    const start = { ...this.selectedVehicle.liveLocation };
    this.loading = true;
    this.errorMessage = '';
    this.routeService.calculateRoute(start, destination).subscribe({
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
    const parts = value.split(',').map((part) => Number(part.trim()));
    if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) {
      return null;
    }

    const [lat, lng] = parts;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }

    return { lat, lng };
  }
}

import { Component } from '@angular/core';
import { MapViewComponent } from './components/map-view/map-view.component';
import { VehiclePanelComponent } from './components/vehicle-panel/vehicle-panel.component';
import { Coordinate, RouteResult, Vehicle } from './models/vehicle.model';
import { VehicleService } from './services/vehicle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MapViewComponent, VehiclePanelComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly vehicles: Vehicle[];
  selectedVehicle: Vehicle;
  destinations: Coordinate[] = [];
  routeGeometry: Coordinate[] | null = null;
  routeMode: 'destination' | 'optimized' | null = null;
  hasUserSelectedVehicle = false;

  constructor(vehicleService: VehicleService) {
    this.vehicles = vehicleService.getVehicles();
    this.selectedVehicle = this.vehicles[0];
  }

  handleVehicleChange(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.routeGeometry = null;
    this.routeMode = null;
    this.hasUserSelectedVehicle = true;
  }

  handleRouteCalculated(result: RouteResult): void {
    this.routeGeometry = result.geometry;
    this.routeMode = result.mode;
  }

  handleDestinationChange(destinations: Coordinate[]): void {
    this.destinations = destinations;
  }

  handleRouteCleared(): void {
    this.destinations = [];
    this.routeGeometry = null;
    this.routeMode = null;
  }
}

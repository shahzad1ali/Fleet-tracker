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
  destination: Coordinate | null = null;
  routeGeometry: Coordinate[] | null = null;
  hasUserSelectedVehicle = false;

  constructor(vehicleService: VehicleService) {
    this.vehicles = vehicleService.getVehicles();
    this.selectedVehicle = this.vehicles[0];
  }

  handleVehicleChange(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.routeGeometry = null;
    this.hasUserSelectedVehicle = true;
  }

  handleRouteCalculated(result: RouteResult): void {
    this.routeGeometry = result.geometry;
  }

  handleDestinationChange(destination: Coordinate): void {
    this.destination = destination;
  }
}

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
  selectedVehicle: Vehicle;
  destination: Coordinate | null = { lat: 31.4504, lng: 74.2872 };
  routeGeometry: Coordinate[] | null = null;

  constructor(vehicleService: VehicleService) {
    this.selectedVehicle = vehicleService.getVehicles()[0];
  }

  handleVehicleChange(vehicle: Vehicle): void {
    this.selectedVehicle = vehicle;
    this.routeGeometry = null;
  }

  handleRouteCalculated(result: RouteResult): void {
    this.routeGeometry = result.geometry;
  }

  handleDestinationChange(destination: Coordinate): void {
    this.destination = destination;
  }
}

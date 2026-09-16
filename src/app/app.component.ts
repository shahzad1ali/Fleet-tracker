import { AsyncPipe, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MapViewComponent } from './components/map-view/map-view.component';
import { VehiclePanelComponent } from './components/vehicle-panel/vehicle-panel.component';
import { FleetStateService } from './services/fleet-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, NgIf, MapViewComponent, VehiclePanelComponent],
  templateUrl: './app.component.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly fleetState = inject(FleetStateService);
  readonly state$ = this.fleetState.state$;

  selectVehicle(vehicleId: string): void {
    this.fleetState.selectVehicle(vehicleId);
  }
}

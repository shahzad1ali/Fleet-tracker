import { AsyncPipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FleetStateService } from '../../services/fleet-state.service';

@Component({
  selector: 'app-vehicle-panel',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, FormsModule, NgClass, NgFor, NgIf],
  templateUrl: './vehicle-panel.component.html',
  host: { class: 'block h-full' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VehiclePanelComponent {
  private readonly fleetState = inject(FleetStateService);

  readonly state$ = this.fleetState.state$;
  draftDestinationText = '';

  selectVehicle(vehicleId: string): void {
    this.fleetState.selectVehicle(vehicleId);
  }

  optimizeRoute(): void {
    this.fleetState.optimizeRoute();
  }

  removeDestination(index: number): void {
    this.fleetState.removeDestination(index);
  }

  commitDraftDestination(): void {
    this.fleetState.addDestination(this.draftDestinationText);
    if (!this.fleetState.snapshot.errorMessage) {
      this.draftDestinationText = '';
    }
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
    this.fleetState.moveDestination(sourceIndex, targetIndex);
  }

  selectedVehicleLocation(state: { vehicles: { id: string; liveLocation: { lat: number; lng: number } }[]; selectedVehicleId: string }): string {
    const vehicle = state.vehicles.find((item) => item.id === state.selectedVehicleId);
    return vehicle ? `${vehicle.liveLocation.lat}, ${vehicle.liveLocation.lng}` : '--';
  }
}

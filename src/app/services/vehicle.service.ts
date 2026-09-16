import { Injectable } from '@angular/core';
import { FLEET_VEHICLES } from '../constants/fleet-data';
import { Vehicle } from '../models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  getVehicles(): Vehicle[] {
    return FLEET_VEHICLES.map((vehicle) => ({
      ...vehicle,
      liveLocation: { ...vehicle.liveLocation },
    }));
  }
}

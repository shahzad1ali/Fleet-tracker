import { Injectable } from '@angular/core';
import { Vehicle } from '../models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly vehicles: Vehicle[] = [
    {
      id: 'truck-104',
      name: 'Truck 104',
      driver: 'J. Alvarez',
      liveLocation: { lat: 31.5204, lng: 74.3587 },
    },
    {
      id: 'van-217',
      name: 'Van 217',
      driver: 'M. Khan',
      liveLocation: { lat: 31.5497, lng: 74.3436 },
    },
    {
      id: 'truck-305',
      name: 'Truck 305',
      driver: 'S. Patel',
      liveLocation: { lat: 31.4697, lng: 74.2728 },
    },
    {
      id: 'truck-118',
      name: 'Truck 118',
      driver: 'A. Hassan',
      liveLocation: { lat: 31.4879, lng: 74.3368 },
    },
    {
      id: 'van-442',
      name: 'Van 442',
      driver: 'R. Ahmed',
      liveLocation: { lat: 31.5342, lng: 74.3154 },
    },
    {
      id: 'truck-226',
      name: 'Truck 226',
      driver: 'N. Iqbal',
      liveLocation: { lat: 31.4586, lng: 74.3892 },
    },
    {
      id: 'van-311',
      name: 'Van 311',
      driver: 'L. Qureshi',
      liveLocation: { lat: 31.5051, lng: 74.2504 },
    },
  ];

  getVehicles(): Vehicle[] {
    return this.vehicles;
  }
}

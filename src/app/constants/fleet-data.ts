import { Vehicle } from '../models/vehicle.model';

export const DefaultDestination = '32.6164, -117.0847';

export const FLEET_VEHICLES: readonly Vehicle[] = [
  {
    id: 'truck-104',
    name: 'Truck 104',
    driver: 'J. Alvarez',
    liveLocation: { lat: 32.6401, lng: -117.0842 },
  },
  {
    id: 'van-217',
    name: 'Van 217',
    driver: 'M. Khan',
    liveLocation: { lat: 32.6277, lng: -117.0894 },
  },
  {
    id: 'truck-305',
    name: 'Truck 305',
    driver: 'S. Patel',
    liveLocation: { lat: 32.6719, lng: -117.0922 },
  },
  {
    id: 'truck-118',
    name: 'Truck 118',
    driver: 'A. Hassan',
    liveLocation: { lat: 32.6118, lng: -117.0623 },
  },
  {
    id: 'van-442',
    name: 'Van 442',
    driver: 'R. Ahmed',
    liveLocation: { lat: 32.6547, lng: -117.1047 },
  },
  {
    id: 'truck-226',
    name: 'Truck 226',
    driver: 'N. Iqbal',
    liveLocation: { lat: 32.5857, lng: -117.0821 },
  },
  {
    id: 'van-311',
    name: 'Van 311',
    driver: 'L. Qureshi',
    liveLocation: { lat: 32.6827, lng: -117.0844 },
  },
];

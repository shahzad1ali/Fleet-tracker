export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Vehicle {
  id: string;
  name: string;
  driver: string;
  liveLocation: Coordinate;
}

export interface RouteResult {
  distanceKm: number;
  etaMinutes: number;
  geometry: Coordinate[];
}

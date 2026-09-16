import { Coordinate } from '../models/vehicle.model';

export const DefaultMapCenter: Coordinate = { lat: 32.6401, lng: -117.0842 };
export const DefaultMapZoom = 12;
export const MapMaximumZoom = 19;
export const MapFitMaximumZoom = 14;
export const MapFitPadding: [number, number] = [32, 32];
export const MapTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MapAttribution = '&copy; OpenStreetMap contributors';
export const RouteColor = '#1776d2';
export const OptimizedRouteColor = '#e0522d';
export const RouteWeight = 4;
export const RouteOpacity = 0.9;

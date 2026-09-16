import { environment } from '../../environments/environment';
import { Coordinate } from '../models/vehicle.model';

export const DefaultMapCenter: Coordinate = { lat: 32.6401, lng: -117.0842 };
export const DefaultMapZoom = 12;
export const MapMaximumZoom = 19;
export const MapFitMaximumZoom = 14;
export const MapFitPadding: [number, number] = [32, 32];
export const MapTileUrl = environment.mapTileUrl;
export const MapAttribution = environment.mapAttribution;
export const RouteColor = '#1776d2';
export const OptimizedRouteColor = '#e0522d';
export const RouteWeight = 4;
export const RouteOpacity = 0.9;
export const VehicleMarkerStroke = '#ffffff';
export const SelectedVehicleFill = '#0f766e';
export const VehicleFill = '#22c55e';
export const DestinationMarkerStroke = '#14532d';
export const DestinationMarkerFill = '#1f9d75';

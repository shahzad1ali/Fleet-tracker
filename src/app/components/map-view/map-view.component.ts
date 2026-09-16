import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import {
  DefaultMapCenter,
  DefaultMapZoom,
  MapAttribution,
  MapFitMaximumZoom,
  MapFitPadding,
  MapMaximumZoom,
  MapTileUrl,
  RouteColor,
  RouteOpacity,
  RouteWeight,
} from '../../constants/map.constants';
import { Coordinate, Vehicle } from '../../models/vehicle.model';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss',
})
export class MapViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Output() vehicleSelected = new EventEmitter<Vehicle>();
  @Input() vehicles: Vehicle[] = [];
  @Input() selectedVehicleLocation: Coordinate | null = null;
  @Input() destination: Coordinate | null = null;
  @Input() routeGeometry: Coordinate[] | null = null;
  @Input() focusOnSelectedVehicle = false;
  @ViewChild('mapElement', { static: true }) private readonly mapElement!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private destinationMarker: L.CircleMarker | null = null;
  private routePolyline: L.Polyline | null = null;
  private vehicleMarkers: L.CircleMarker[] = [];

  ngAfterViewInit(): void {
    this.initializeMap();
    this.updateLayers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && (changes['vehicles'] || changes['selectedVehicleLocation'] || changes['destination'] || changes['routeGeometry'] || changes['focusOnSelectedVehicle'])) {
      this.updateLayers();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initializeMap(): void {
    this.map = L.map(this.mapElement.nativeElement, {
      zoomControl: false,
      attributionControl: true,
    }).setView([DefaultMapCenter.lat, DefaultMapCenter.lng], DefaultMapZoom);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer(MapTileUrl, {
      maxZoom: MapMaximumZoom,
      attribution: MapAttribution,
    }).addTo(this.map);
  }

  private updateLayers(): void {
    if (!this.map) {
      return;
    }

    this.destinationMarker?.remove();
    this.routePolyline?.remove();
    this.vehicleMarkers.forEach((marker) => marker.remove());
    this.vehicleMarkers = [];

    this.vehicles.forEach((vehicle) => {
      const isSelected = this.selectedVehicleLocation && vehicle.liveLocation.lat === this.selectedVehicleLocation.lat && vehicle.liveLocation.lng === this.selectedVehicleLocation.lng;
      const marker = L.circleMarker(this.toLeafletCoordinates(vehicle.liveLocation), {
        radius: isSelected ? 10 : 7,
        color: '#ffffff',
        weight: 3,
        fillColor: isSelected ? '#0f766e' : '#22c55e',
        fillOpacity: 1,
      }).addTo(this.map!);

      marker.on('click', () => {
        this.map?.flyTo(this.toLeafletCoordinates(vehicle.liveLocation), 14, { duration: 0.8 });
        this.vehicleSelected.emit(vehicle);
      });

      if (isSelected) {
        marker.bindTooltip(vehicle.name, {
          permanent: true,
          direction: 'bottom',
          offset: [0, 16],
          className: 'vehicle-name-tooltip',
        }).openTooltip();
      }

      this.vehicleMarkers.push(marker);
    });

    if (this.destination && this.routeGeometry?.length) {
      this.destinationMarker = L.circleMarker(this.toLeafletCoordinates(this.destination), {
        radius: 12,
        color: '#14532d',
        weight: 2,
        fillColor: '#1f9d75',
        fillOpacity: 0.95,
      }).addTo(this.map);
    }

    if (this.routeGeometry?.length) {
      this.routePolyline = L.polyline(this.routeGeometry.map((point) => this.toLeafletCoordinates(point)), {
        color: RouteColor,
        weight: RouteWeight,
        opacity: RouteOpacity,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(this.map);
    }

    this.fitMapToContent();
  }

  private fitMapToContent(): void {
    if (!this.map) {
      return;
    }

    const points: L.LatLngExpression[] = [];

    if (this.routeGeometry?.length) {
      if (this.selectedVehicleLocation) points.push(this.toLeafletCoordinates(this.selectedVehicleLocation));
      if (this.destination) points.push(this.toLeafletCoordinates(this.destination));
      points.push(...this.routeGeometry.map((point) => this.toLeafletCoordinates(point)));
    } else if (this.focusOnSelectedVehicle && this.selectedVehicleLocation) {
      points.push(this.toLeafletCoordinates(this.selectedVehicleLocation));
    } else if (this.vehicles.length) {
      points.push(...this.vehicles.map((vehicle) => this.toLeafletCoordinates(vehicle.liveLocation)));
    }

    if (points.length > 1) {
      this.map.fitBounds(L.latLngBounds(points), { padding: MapFitPadding, maxZoom: MapFitMaximumZoom });
    } else if (points.length === 1) {
      this.map.setView(points[0], 12);
    }
  }

  private toLeafletCoordinates(coordinate: Coordinate): L.LatLngExpression {
    return [coordinate.lat, coordinate.lng];
  }
}

import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
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
  @Input() vehicles: { id: string; name: string; driver: string; liveLocation: Coordinate }[] = [];
  @Input() truckLocation: Coordinate | null = null;
  @Input() driverName = '';
  @Input() destination: Coordinate | null = null;
  @Input() routeGeometry: Coordinate[] | null = null;
  @Input() focusOnSelectedVehicle = false;
  @ViewChild('mapElement', { static: true }) private readonly mapElement!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private truckMarker: L.CircleMarker | null = null;
  private destinationMarker: L.CircleMarker | null = null;
  private routeLine: L.Polyline | null = null;
  private vehicleMarkers: L.CircleMarker[] = [];

  ngAfterViewInit(): void {
    this.initializeMap();
    this.updateLayers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && (changes['vehicles'] || changes['truckLocation'] || changes['driverName'] || changes['destination'] || changes['routeGeometry'] || changes['focusOnSelectedVehicle'])) {
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
    }).setView([31.5204, 74.3587], 11);

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
  }

  private updateLayers(): void {
    if (!this.map) {
      return;
    }

    this.truckMarker?.remove();
    this.destinationMarker?.remove();
    this.routeLine?.remove();
    this.vehicleMarkers.forEach((marker) => marker.remove());
    this.vehicleMarkers = [];

    this.vehicles.forEach((vehicle) => {
      const isSelected = this.truckLocation && vehicle.liveLocation.lat === this.truckLocation.lat && vehicle.liveLocation.lng === this.truckLocation.lng;
      const marker = L.circleMarker(this.toLatLng(vehicle.liveLocation), {
        radius: isSelected ? 10 : 7,
        color: '#ffffff',
        weight: 3,
        fillColor: isSelected ? '#0f766e' : '#22c55e',
        fillOpacity: 1,
      }).addTo(this.map!);

      marker.on('click', () => {
        this.map?.flyTo(this.toLatLng(vehicle.liveLocation), 14, { duration: 0.8 });
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
      this.destinationMarker = L.circleMarker(this.toLatLng(this.destination), {
        radius: 12,
        color: '#14532d',
        weight: 2,
        fillColor: '#1f9d75',
        fillOpacity: 0.95,
      }).addTo(this.map);
    }

    if (this.routeGeometry?.length) {
      this.routeLine = L.polyline(this.routeGeometry.map((point) => this.toLatLng(point)), {
        color: '#1776d2',
        weight: 4,
        opacity: 0.9,
        dashArray: '9 9',
        lineCap: 'round',
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
      if (this.truckLocation) points.push(this.toLatLng(this.truckLocation));
      if (this.destination) points.push(this.toLatLng(this.destination));
      points.push(...this.routeGeometry.map((point) => this.toLatLng(point)));
    } else if (this.focusOnSelectedVehicle && this.truckLocation) {
      points.push(this.toLatLng(this.truckLocation));
    } else if (this.vehicles.length) {
      points.push(...this.vehicles.map((vehicle) => this.toLatLng(vehicle.liveLocation)));
    }

    if (points.length > 1) {
      this.map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14 });
    } else if (points.length === 1) {
      this.map.setView(points[0], 12);
    }
  }

  private toLatLng(coordinate: Coordinate): L.LatLngExpression {
    return [coordinate.lat, coordinate.lng];
  }
}

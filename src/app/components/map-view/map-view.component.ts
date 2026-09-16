import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, AfterViewInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import {
  DefaultMapCenter,
  DefaultMapZoom,
  DestinationMarkerFill,
  DestinationMarkerStroke,
  MapAttribution,
  MapFitMaximumZoom,
  MapFitPadding,
  MapMaximumZoom,
  MapTileUrl,
  OptimizedRouteColor,
  RouteColor,
  RouteOpacity,
  RouteWeight,
  SelectedVehicleFill,
  VehicleFill,
  VehicleMarkerStroke,
} from '../../constants/map.constants';
import { Coordinate, Vehicle } from '../../models/vehicle.model';

@Component({
  selector: 'app-map-view',
  standalone: true,
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapViewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Output() vehicleSelected = new EventEmitter<Vehicle>();
  @Input() vehicles: Vehicle[] = [];
  @Input() selectedVehicleId: string | null = null;
  @Input() destinations: Coordinate[] = [];
  @Input() routeGeometry: Coordinate[] | null = null;
  @Input() routeMode: 'destination' | 'optimized' | null = null;
  @Input() focusOnSelectedVehicle = false;
  @ViewChild('mapElement', { static: true }) private readonly mapElement!: ElementRef<HTMLDivElement>;

  private map: L.Map | null = null;
  private destinationMarkers: L.CircleMarker[] = [];
  private routePolyline: L.Polyline | null = null;
  private vehicleMarkers: L.CircleMarker[] = [];
  private resizeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    this.initializeMap();
    this.updateLayers();
    window.addEventListener('resize', this.onWindowResize);
    this.resizeTimeoutId = setTimeout(() => this.map?.invalidateSize());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.map &&
      (changes['vehicles'] ||
        changes['selectedVehicleId'] ||
        changes['destinations'] ||
        changes['routeGeometry'] ||
        changes['routeMode'] ||
        changes['focusOnSelectedVehicle'])
    ) {
      this.updateLayers();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
    if (this.resizeTimeoutId !== null) {
      clearTimeout(this.resizeTimeoutId);
    }
    this.map?.remove();
  }

  private readonly onWindowResize = (): void => {
    this.map?.invalidateSize();
  };

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

    this.destinationMarkers.forEach((marker) => marker.remove());
    this.destinationMarkers = [];
    this.routePolyline?.remove();
    this.vehicleMarkers.forEach((marker) => marker.remove());
    this.vehicleMarkers = [];

    const selectedVehicle = this.vehicles.find((vehicle) => vehicle.id === this.selectedVehicleId) ?? null;

    this.vehicles.forEach((vehicle) => {
      const isSelected = vehicle.id === this.selectedVehicleId;
      const marker = L.circleMarker(this.toLeafletCoordinates(vehicle.liveLocation), {
        radius: isSelected ? 10 : 7,
        color: VehicleMarkerStroke,
        weight: 3,
        fillColor: isSelected ? SelectedVehicleFill : VehicleFill,
        fillOpacity: 1,
      }).addTo(this.map!);

      marker.on('click', () => {
        this.map?.flyTo(this.toLeafletCoordinates(vehicle.liveLocation), 14, { duration: 0.8 });
        this.vehicleSelected.emit(vehicle);
      });

      if (isSelected) {
        marker
          .bindTooltip(vehicle.name, {
            permanent: true,
            direction: 'bottom',
            offset: [0, 16],
            className: 'vehicle-name-tooltip',
          })
          .openTooltip();
      }

      this.vehicleMarkers.push(marker);
    });

    if (this.destinations.length && this.routeGeometry?.length) {
      this.destinationMarkers = this.destinations.map((destination, index) =>
        L.circleMarker(this.toLeafletCoordinates(destination), {
          radius: 12,
          color: DestinationMarkerStroke,
          weight: 2,
          fillColor: DestinationMarkerFill,
          fillOpacity: 0.95,
        })
          .bindTooltip(`${index + 1}`, {
            permanent: true,
            direction: 'center',
            className: 'destination-number-tooltip',
          })
          .addTo(this.map!),
      );
    }

    if (this.routeGeometry?.length) {
      this.routePolyline = L.polyline(
        this.routeGeometry.map((point) => this.toLeafletCoordinates(point)),
        {
          color: this.routeMode === 'optimized' ? OptimizedRouteColor : RouteColor,
          weight: RouteWeight,
          opacity: RouteOpacity,
          lineCap: 'round',
          lineJoin: 'round',
        },
      ).addTo(this.map);
    }

    this.fitMapToContent(selectedVehicle);
  }

  private fitMapToContent(selectedVehicle: Vehicle | null): void {
    if (!this.map) {
      return;
    }

    const points: L.LatLngExpression[] = [];

    if (this.routeGeometry?.length) {
      if (selectedVehicle) {
        points.push(this.toLeafletCoordinates(selectedVehicle.liveLocation));
      }
      points.push(...this.destinations.map((destination) => this.toLeafletCoordinates(destination)));
      points.push(...this.routeGeometry.map((point) => this.toLeafletCoordinates(point)));
    } else if (this.focusOnSelectedVehicle && selectedVehicle) {
      points.push(this.toLeafletCoordinates(selectedVehicle.liveLocation));
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

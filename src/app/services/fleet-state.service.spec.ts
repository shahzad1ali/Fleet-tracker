/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FleetStateService } from './fleet-state.service';

describe('FleetStateService', () => {
  let service: FleetStateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), FleetStateService],
    });
    service = TestBed.inject(FleetStateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should clear route state when selecting another vehicle with no destinations', () => {
    const nextVehicle = service.snapshot.vehicles[1];
    service.selectVehicle(nextVehicle.id);

    expect(service.snapshot.selectedVehicleId).toBe(nextVehicle.id);
    expect(service.snapshot.hasUserSelectedVehicle).toBeTrue();
    expect(service.snapshot.routeResult).toBeNull();
    expect(service.snapshot.destinations).toEqual([]);
  });

  it('should recalculate the route when selecting another vehicle with destinations', () => {
    service.addDestination('32.639034, -117.088016');
    const firstRequest = httpMock.expectOne((req) => req.url.includes('/route/v1/driving/'));
    firstRequest.flush({
      code: 'Ok',
      routes: [
        {
          distance: 1000,
          duration: 60,
          geometry: { coordinates: [[-117.088016, 32.639034]] },
        },
      ],
    });

    const nextVehicle = service.snapshot.vehicles[1];
    service.selectVehicle(nextVehicle.id);

    expect(service.snapshot.selectedVehicleId).toBe(nextVehicle.id);
    expect(service.snapshot.routeResult).toBeNull();
    expect(service.snapshot.loading).toBeTrue();

    const secondRequest = httpMock.expectOne((req) => req.url.includes('/route/v1/driving/'));
    secondRequest.flush({
      code: 'Ok',
      routes: [
        {
          distance: 1200,
          duration: 90,
          geometry: { coordinates: [[-117.088016, 32.639034]] },
        },
      ],
    });

    expect(service.snapshot.loading).toBeFalse();
    expect(service.snapshot.routeResult?.distanceKm).toBe(1.2);
  });

  it('should reject invalid destination coordinates', () => {
    service.addDestination('invalid');
    expect(service.snapshot.errorMessage).toContain('latitude, longitude');
    expect(service.snapshot.destinationTexts).toEqual([]);
  });
});

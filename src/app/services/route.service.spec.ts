/// <reference types="jasmine" />

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { OsrmRouteOptions, OsrmRouteUrl } from '../constants/route.constants';
import { RouteService } from './route.service';

describe('RouteService', () => {
  let service: RouteService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RouteService],
    });
    service = TestBed.inject(RouteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should map a successful OSRM response', () => {
    const start = { lat: 32.64, lng: -117.08 };
    const destinations = [{ lat: 32.639, lng: -117.088 }];

    service.calculateRoute(start, destinations, false).subscribe((result) => {
      expect(result.distanceKm).toBe(1.5);
      expect(result.etaMinutes).toBe(3);
      expect(result.mode).toBe('destination');
      expect(result.geometry).toEqual([{ lat: 32.64, lng: -117.08 }, { lat: 32.639, lng: -117.088 }]);
      expect(result.destinations).toEqual(destinations);
    });

    const request = httpMock.expectOne(
      `${OsrmRouteUrl}/-117.08,32.64;-117.088,32.639?${OsrmRouteOptions}`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      code: 'Ok',
      routes: [
        {
          distance: 1500,
          duration: 180,
          geometry: {
            coordinates: [
              [-117.08, 32.64],
              [-117.088, 32.639],
            ],
          },
        },
      ],
    });
  });

  it('should reorder destinations with nearest-neighbor when optimizing', () => {
    const start = { lat: 32.6401, lng: -117.0842 };
    const destinations = [
      { lat: 32.642497, lng: -117.089411 },
      { lat: 32.639034, lng: -117.088016 },
      { lat: 32.635572, lng: -117.086714 },
    ];

    service.calculateRoute(start, destinations, true).subscribe((result) => {
      expect(result.mode).toBe('optimized');
      expect(result.destinations[0]).toEqual(destinations[1]);
      expect(result.destinations[1]).toEqual(destinations[2]);
      expect(result.destinations[2]).toEqual(destinations[0]);
      expect(result.destinations.length).toBe(3);
    });

    const request = httpMock.expectOne((req) => req.url.startsWith(OsrmRouteUrl));
    request.flush({
      code: 'Ok',
      routes: [
        {
          distance: 1600,
          duration: 120,
          geometry: { coordinates: [[-117.0842, 32.6401]] },
        },
      ],
    });
  });

  it('should surface a user-safe error when OSRM fails', () => {
    const start = { lat: 32.64, lng: -117.08 };
    const destinations = [{ lat: 32.639, lng: -117.088 }];
    spyOn(console, 'error');

    service.calculateRoute(start, destinations, false).subscribe({
      next: () => fail('expected an error'),
      error: (error: Error) => {
        expect(error.message).toBe('Unable to calculate the route. Please try again.');
      },
    });

    const request = httpMock.expectOne((req) => req.url.startsWith(OsrmRouteUrl));
    request.flush({ message: 'down' }, { status: 500, statusText: 'Server Error' });
  });
});

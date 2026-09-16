/// <reference types="jasmine" />

import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { FleetStateService } from './services/fleet-state.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the fleet tracker dashboard', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-vehicle-panel')).not.toBeNull();
    expect(compiled.querySelector('app-map-view')).not.toBeNull();
  });

  it('should keep the fleet visible by default and not preselect a destination', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const fleetState = TestBed.inject(FleetStateService);

    expect(fleetState.snapshot.vehicles.length).toBeGreaterThan(1);
    expect(fleetState.snapshot.destinations).toEqual([]);
  });
});

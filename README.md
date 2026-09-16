# Fleet tracker

Angular 17 app for selecting a fleet vehicle, adding destination stops, and drawing a driving route on a Leaflet map.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests (Karma/Jasmine) |
| `npm run lint` | ESLint |

## Optimize route

**Optimize route** orders stops with a nearest-neighbor heuristic:

1. Closest stop to the selected vehicle
2. Closest remaining stop to that stop
3. Repeat until all stops are visited

Then OSRM returns the driving geometry for that order (`continue_straight=false` so U-turns at stops are allowed).

## Routing / map configuration

OSRM and map tile URLs live in:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

The default OSRM host (`router.project-osrm.org`) is a **public demo**. It is fine for local demos only—not production (rate limits, no SLA). Point production builds at your own OSRM instance via `environment.prod.ts`.

## Architecture

- `FleetStateService` — single source of truth for vehicles, destinations, and route state
- `RouteService` — OSRM HTTP client
- `VehiclePanelComponent` / `MapViewComponent` — presentational UI bound to shared state

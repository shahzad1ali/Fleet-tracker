export const environment = {
  production: true,
  // Replace with your own OSRM endpoint before production use.
  // The public demo server is not production-grade (rate limits, no SLA).
  osrmRouteUrl: 'https://router.project-osrm.org/route/v1/driving',
  osrmRouteOptions: 'overview=full&geometries=geojson&continue_straight=false',
  mapTileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  mapAttribution: '&copy; OpenStreetMap contributors',
};

/// <reference types="jasmine" />

import { parseCoordinate } from './coordinate.util';

describe('parseCoordinate', () => {
  it('should parse valid decimal coordinates', () => {
    const result = parseCoordinate('32.6401, -117.0842');
    expect(result).toEqual({ ok: true, coordinate: { lat: 32.6401, lng: -117.0842 } });
  });

  it('should reject malformed input', () => {
    const result = parseCoordinate('not-a-coordinate');
    expect(result.ok).toBeFalse();
    if (!result.ok) {
      expect(result.error).toContain('latitude, longitude');
    }
  });

  it('should reject out-of-range latitude', () => {
    const result = parseCoordinate('120, -117.0842');
    expect(result.ok).toBeFalse();
    if (!result.ok) {
      expect(result.error).toContain('Latitude');
    }
  });
});

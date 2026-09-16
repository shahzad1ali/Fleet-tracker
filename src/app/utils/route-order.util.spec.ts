/// <reference types="jasmine" />

import { orderNearestNeighbor } from './route-order.util';

describe('orderNearestNeighbor', () => {
  it('should visit the closest stop first, then the next closest remaining stop', () => {
    const start = { lat: 32.6401, lng: -117.0842 };
    const farNorth = { lat: 32.642497, lng: -117.089411 };
    const nearWest = { lat: 32.639034, lng: -117.088016 };
    const farSouth = { lat: 32.635572, lng: -117.086714 };

    const ordered = orderNearestNeighbor(start, [farNorth, nearWest, farSouth]);

    expect(ordered[0]).toEqual(nearWest);
    expect(ordered[1]).toEqual(farSouth);
    expect(ordered[2]).toEqual(farNorth);
  });
});

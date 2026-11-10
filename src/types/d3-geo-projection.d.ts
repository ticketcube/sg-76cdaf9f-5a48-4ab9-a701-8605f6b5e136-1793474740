declare module 'd3-geo-projection' {
  import { GeoProjection } from 'd3-geo';
  
  export function geoNaturalEarth2(): GeoProjection;
  export function geoRobinson(): GeoProjection;
  export function geoEqualEarth(): GeoProjection;
  
  // Add other projections as needed
}
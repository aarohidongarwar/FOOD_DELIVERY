/**
 * Utility functions for interacting with the OSRM (Open Source Routing Machine) API
 */

/**
 * Fetches a driving route between two points using OSRM.
 * @param {Array<number>} start [lat, lng]
 * @param {Array<number>} end [lat, lng]
 * @returns {Promise<Object>} An object containing route coordinates (for Leaflet), distance, and duration.
 */
export async function fetchOSRMRoute(start, end) {
  try {
    // OSRM expects coordinates in lon,lat order
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('OSRM Route not found, falling back to straight line.');
      return null;
    }

    const route = data.routes[0];
    
    // OSRM GeoJSON geometry returns [lng, lat]. Leaflet needs [lat, lng].
    const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
    
    return {
      coordinates, // Array of [lat, lng]
      distance: route.distance, // distance in meters
      duration: route.duration  // duration in seconds
    };
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    return null;
  }
}

/**
 * Interpolates points along a polyline to create smooth animation steps.
 * @param {Array<Array<number>>} path Array of [lat, lng] points
 * @param {number} totalSteps Total number of steps desired for the animation
 * @returns {Array<Array<number>>} Interpolated array of [lat, lng] points of length totalSteps
 */
export function interpolateRoute(path, totalSteps) {
  if (!path || path.length < 2) return path;

  // Calculate distances between consecutive points
  const segments = [];
  let totalDistance = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    // Haversine formula or simple Euclidean (fine for small city distances)
    // We'll use simple Euclidean for interpolation weights to be fast
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    segments.push({ p1, p2, dist });
    totalDistance += dist;
  }

  if (totalDistance === 0) return Array(totalSteps).fill(path[0]);

  const stepDistance = totalDistance / totalSteps;
  const interpolated = [path[0]];
  
  let currentSegmentIdx = 0;
  let distanceAlongSegment = 0;

  for (let i = 1; i < totalSteps - 1; i++) {
    const targetDist = i * stepDistance;
    let accumulatedDist = 0;

    // Find which segment the target distance falls into
    for (let j = 0; j < segments.length; j++) {
      if (accumulatedDist + segments[j].dist >= targetDist) {
        currentSegmentIdx = j;
        distanceAlongSegment = targetDist - accumulatedDist;
        break;
      }
      accumulatedDist += segments[j].dist;
    }

    const seg = segments[currentSegmentIdx];
    const ratio = seg.dist === 0 ? 0 : distanceAlongSegment / seg.dist;
    
    const lat = seg.p1[0] + (seg.p2[0] - seg.p1[0]) * ratio;
    const lng = seg.p1[1] + (seg.p2[1] - seg.p1[1]) * ratio;
    
    interpolated.push([lat, lng]);
  }

  interpolated.push(path[path.length - 1]);
  return interpolated;
}

/**
 * NAVLUNAR Geodetic Engine
 * Reference: Mean Lunar Radius 1737.4 km
 * Datum: IAU_Moon_2000
 */

export const LUNAR_RADIUS_KM = 1737.4;

export function geodeticToCartesian(lat: number, lng: number, radius = LUNAR_RADIUS_KM) {
  const phi = (lat * Math.PI) / 180;
  const theta = (lng * Math.PI) / 180;

  return {
    x: radius * Math.cos(phi) * Math.cos(theta),
    y: radius * Math.sin(phi),
    z: radius * Math.cos(phi) * Math.sin(theta)
  };
}

export function cartesianToGeodetic(x: number, y: number, z: number, radius = LUNAR_RADIUS_KM) {
  const lat = Math.asin(y / radius) * (180 / Math.PI);
  const lng = Math.atan2(x, z) * (180 / Math.PI);
  return { lat, lng };
}

/**
 * Calcula el círculo máximo del terminador solar
 * Se incrementa a 360 puntos para máxima suavidad en proyecciones polares
 */
export function getTerminatorPoints(subSolarLat: number, subSolarLon: number, points = 360): [number, number][] {
  const lat1 = (subSolarLat * Math.PI) / 180;
  const lon1 = (subSolarLon * Math.PI) / 180;
  const result: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // Ecuación del terminador en una esfera
    const lat = Math.asin(Math.cos(lat1) * Math.cos(angle));
    let lon = Math.atan2(Math.sin(angle), -Math.sin(lat1) * Math.cos(angle)) + lon1;
    
    let lonDeg = (lon * 180) / Math.PI;
    let latDeg = (lat * 180) / Math.PI;
    
    // Normalizar longitud al rango [-180, 180]
    while (lonDeg > 180) lonDeg -= 360;
    while (lonDeg < -180) lonDeg += 360;
    
    result.push([latDeg, lonDeg]);
  }
  return result;
}

/**
 * Calcula la distancia geodésica entre dos puntos (Haversine).
 */
export function calculateGeodesicDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return LUNAR_RADIUS_KM * c;
}

/**
 * Simulación de iluminación solar basada en geometría planetaria
 */
export function calculateSimulatedIllumination(lat: number, lng: number, timestamp: number): number {
  const cycle = 708.7; // Mes sinódico lunar en horas
  const phase = ((timestamp + (lng / 360) * cycle) % cycle) / cycle;
  const latFactor = Math.cos((lat * Math.PI) / 180);
  const illumination = Math.max(0, Math.sin(phase * 2 * Math.PI) * latFactor);
  return Math.floor(illumination * 100);
}

/**
 * Calcula el ángulo de elevación solar en un punto específico
 */
export function calculateSolarElevation(lat: number, subSolarLat: number, lon: number, subSolarLon: number): number {
  const phi = (lat * Math.PI) / 180;
  const delta = (subSolarLat * Math.PI) / 180;
  const h = ((lon - subSolarLon) * Math.PI) / 180;
  
  const sinAlpha = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h);
  return Math.asin(Math.max(-1, Math.min(1, sinAlpha))) * (180 / Math.PI);
}

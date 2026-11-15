/**
 * NAVLUNAR Geodetic Engine
 * Reference: Mean Lunar Radius 1737.4 km
 * Datum: IAU_Moon_2000
 */

import { MASTER_CATALOG } from '@/data/lunar-features';
import { calculateLunarEphemeris } from './lunar-ephemeris';

export const LUNAR_RADIUS_KM = 1737.4;
export const R_MOON_M = 1737400.0;
export const OBSERVER_HEIGHT_M = 2.0;

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
 */
export function getTerminatorPoints(subSolarLat: number, subSolarLon: number, points = 360): [number, number][] {
  const lat1 = (subSolarLat * Math.PI) / 180;
  const lon1 = (subSolarLon * Math.PI) / 180;
  const result: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const lat = Math.asin(Math.cos(lat1) * Math.cos(angle));
    let lon = Math.atan2(Math.sin(angle), -Math.sin(lat1) * Math.cos(angle)) + lon1;
    
    let lonDeg = (lon * 180) / Math.PI;
    let latDeg = (lat * 180) / Math.PI;
    
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
  const cycle = 708.7; 
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

/**
 * Calcula la posición local del Sol (Azimut y Elevación) para un observador lunar.
 */
export function getLocalSolarPosition(lat: number, lng: number, subSolarLat: number, subSolarLon: number) {
  const phi = (lat * Math.PI) / 180;
  const delta = (subSolarLat * Math.PI) / 180;
  const h = ((lng - subSolarLon) * Math.PI) / 180;

  const sinAlpha = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h);
  const alpha = Math.asin(Math.max(-1, Math.min(1, sinAlpha)));

  const cosAlpha = Math.cos(alpha);
  const cosAz = (Math.sin(delta) - Math.sin(phi) * sinAlpha) / (Math.cos(phi) * cosAlpha);
  const sinAz = (Math.cos(delta) * Math.sin(h)) / cosAlpha;

  let az = Math.atan2(sinAz, cosAz) * (180 / Math.PI);
  if (az < 0) az += 360;

  return {
    azimuth: az,
    elevation: alpha * (180 / Math.PI)
  };
}

/**
 * Generación sintética determinista de perfil de horizonte 360°
 */
export function getHorizonProfile(lat: number, lng: number, siteId?: string): number[] {
  if (siteId) {
    const feature = MASTER_CATALOG.find(f => f.id === siteId);
    if (feature?.horizon_profile) return feature.horizon_profile;
  }

  const profile: number[] = [];
  const seed = Math.abs(lat * 123.45 + lng * 67.89);
  
  for (let az = 0; az < 360; az++) {
    const val = 
      Math.sin(az * 0.05 + seed) * 4.0 + 
      Math.sin(az * 0.2 + seed * 2) * 1.5 + 
      Math.sin(az * 0.8 + seed * 3) * 0.5;
    
    const roughness = Math.abs(lat) > 80 ? 12 : 3;
    const offset = Math.abs(lat) > 85 ? 5 : 0;
    
    const angle = roughness + val + offset;
    profile.push(Number(Math.max(0.2, angle).toFixed(3)));
  }
  
  return profile;
}

/**
 * Calcula la idoneidad de aterrizaje para un punto y tiempo dados.
 * Retorna true si es apto, false si no.
 */
export function checkLandingSuitability(lat: number, lng: number, timestamp: number): boolean {
  const ephemeris = calculateLunarEphemeris(timestamp);
  const solarElev = calculateSolarElevation(lat, ephemeris.subSolarLat, lng, ephemeris.subSolarLon);
  
  // Criterio 1: Iluminación solar (Energía disponible)
  if (solarElev < 0.5) return false;

  // Criterio 2: Rugosidad del terreno (Simulación determinista)
  const seed = Math.abs(Math.sin(lat * 12.34) * Math.cos(lng * 56.78));
  const roughness = (seed * 100) % 30; // 0-30° slope simulation
  if (roughness > 15) return false;

  // Criterio 3: Latitud extrema (Dificultad de navegación)
  if (Math.abs(lat) > 88.5) return false; // Zonas ultra-polares son de alto riesgo

  return true;
}

'use client';

import { LUNAR_FEATURES } from '@/data/lunar-features';
import { LUNAR_MISSIONS } from '@/data/lunar-data';
import { calculateGeodesicDistance } from '@/lib/lunar-engine';
import { LunarFeature, Mission } from '@/types/lunar';

export interface CellData {
  features: (LunarFeature & { distance: number })[];
  missions: (Mission & { distance: number })[];
}

/**
 * Obtiene misiones y accidentes geográficos dentro o cerca de una celda.
 */
export function getCellScientificData(
  centerLat: number, 
  centerLng: number, 
  latMin: number, 
  latMax: number, 
  lngMin: number, 
  lngMax: number
): CellData {
  // Búsqueda de accidentes geográficos (Cráteres, etc)
  const features = LUNAR_FEATURES.map(f => ({
    ...f,
    distance: calculateGeodesicDistance(centerLat, centerLng, f.latitude, f.longitude)
  }))
  .filter(f => {
    const isInside = f.latitude >= latMin && f.latitude <= latMax && 
                    f.longitude >= lngMin && f.longitude <= lngMax;
    // También incluimos los que están a menos de 50km
    return isInside || f.distance < 50;
  })
  .sort((a, b) => a.distance - b.distance);

  // Búsqueda de misiones misiones
  const missions = LUNAR_MISSIONS.map(m => ({
    ...m,
    distance: calculateGeodesicDistance(centerLat, centerLng, m.coordinates.lat, m.coordinates.lng)
  }))
  .filter(m => {
    const isInside = m.coordinates.lat >= latMin && m.coordinates.lat <= latMax && 
                    m.coordinates.lng >= lngMin && m.coordinates.lng <= lngMax;
    return isInside || m.distance < 100;
  })
  .sort((a, b) => a.distance - b.distance);

  return { features, missions };
}

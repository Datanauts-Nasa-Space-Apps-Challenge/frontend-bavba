import {
    LunarGridReference,
    LunarGridSystem,
    encodeLGRS,
    decodeLGRSFull,
    getLgrsCellBounds,
    getLgrsNeighbors,
  } from './lgrs-service';
  import { POLAR_LATITUDE_THRESHOLD, TRANSITION_MAX_LATITUDE } from './moon-projections';
  
  export type { LunarGridReference, LunarGridSystem };
  
  export interface LunarGridService {
    encode(lat: number, lon: number, precisionDigits?: number): LunarGridReference;
    decode(code: string): {
      lat: number;
      lon: number;
    };
    getCellBounds(code: string): GeoJSON.Polygon;
    getNeighbors(code: string): string[];
  }
  
  /**
   * Determina el sistema proyectado activo según la latitud planetocéntrica.
   * - [-80°, +80°]: LTM
   * - > +80° (incluyendo franja 80°–82°): LPS_NORTH
   * - < -80° (incluyendo franja -80°–-82°): LPS_SOUTH
   */
  export function resolveLunarGridSystem(lat: number): {
    system: LunarGridSystem;
    inTransitionZone: boolean;
  } {
    const absLat = Math.abs(lat);
    const inTransitionZone = absLat > POLAR_LATITUDE_THRESHOLD && absLat <= TRANSITION_MAX_LATITUDE;
  
    if (lat > POLAR_LATITUDE_THRESHOLD) {
      return { system: 'LPS_NORTH', inTransitionZone };
    }
    if (lat < -POLAR_LATITUDE_THRESHOLD) {
      return { system: 'LPS_SOUTH', inTransitionZone };
    }
    return { system: 'LTM', inTransitionZone: false };
  }
  
  export const lunarGridService: LunarGridService = {
    encode(lat: number, lon: number, precisionDigits = 3): LunarGridReference {
      return encodeLGRS(lat, lon, precisionDigits);
    },
  
    decode(code: string): { lat: number; lon: number } {
      const { lat, lon } = decodeLGRSFull(code);
      return { lat, lon };
    },
  
    getCellBounds(code: string): GeoJSON.Polygon {
      return getLgrsCellBounds(code);
    },
  
    getNeighbors(code: string): string[] {
      return getLgrsNeighbors(code);
    },
  };
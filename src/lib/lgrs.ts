'use client';

import {
  lunarGridService,
  LunarGridReference,
  LunarGridSystem,
} from './lunar-grid-router';
import {
  LTM_LATITUDE_BANDS,
  decodeLGRSFull,
  getLgrsCellBounds,
  getLtmCentralMeridian,
} from './lgrs-service';
import {
  POLAR_LATITUDE_THRESHOLD,
  normalizeLongitude,
} from './moon-projections';

export type { LunarGridReference, LunarGridSystem };
export { lunarGridService };

export interface LGRSResult {
  code: string;
  system: LunarGridSystem;
  gzd: string;
  squareId: string;
  band: string;
  sector: string;
  easting: number;
  northing: number;
  precision: number;
}

export const BANDS = Array.from(LTM_LATITUDE_BANDS).map((code, idx) => {
  const min = -80 + idx * 8;
  const max = min + 8;
  return {
    min,
    max,
    code,
    label: `LTM Band ${code} (${min}° to ${max}°)`,
  };
});

export function normalizeLng(lng: number): number {
  return normalizeLongitude(lng);
}

/**
 * Precisión LGRS (en metros) asociada al nivel de zoom de la vista:
 * - zoom < 3: 100 km (zonas/bandas)
 * - zoom 3..4: 10 km
 * - zoom 5..7: 1 km
 * - zoom >= 8: 100 m
 */
export function zoomToGridResolutionMeters(zoom: number): number {
  if (zoom < 3) return 100_000;
  if (zoom < 5) return 10_000;
  if (zoom < 8) return 1_000;
  return 100;
}

export function getLGRSCode(lat: number, lng: number, precisionDigits = 3): LGRSResult {
  const ref = lunarGridService.encode(lat, lng, precisionDigits);
  const sectorMatch = ref.gzd.match(/^(\d{2})([A-Z])$/);

  return {
    code: ref.code,
    system: ref.system,
    gzd: ref.gzd,
    squareId: ref.squareId,
    band: sectorMatch ? sectorMatch[2] : ref.gzd,
    sector: sectorMatch ? sectorMatch[1] : ref.gzd,
    easting: Math.round(ref.easting),
    northing: Math.round(ref.northing),
    precision: ref.precision,
  };
}

export function decodeLGRS(code: string): { lat: number; lng: number } | null {
  try {
    const { lat, lon } = lunarGridService.decode(code);
    return { lat, lng: lon };
  } catch {
    return null;
  }
}

export function parseLgrsCell(code: string): {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
  centerLat: number;
  centerLng: number;
  band: string;
  sector: string;
  system: LunarGridSystem;
  gzd: string;
  squareId: string;
  precision: number;
  polygon: [number, number][];
} | null {
  try {
    const decoded = decodeLGRSFull(code);
    const bounds = getLgrsCellBounds(code);
    const ring = bounds.coordinates[0];

    const lons = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);

    const sectorMatch = decoded.gzd.match(/^(\d{2})([A-Z])$/);

    return {
      latMin: Math.min(...lats),
      latMax: Math.max(...lats),
      lngMin: Math.min(...lons),
      lngMax: Math.max(...lons),
      centerLat: decoded.lat,
      centerLng: decoded.lon,
      band: sectorMatch ? sectorMatch[2] : decoded.gzd,
      sector: sectorMatch ? sectorMatch[1] : decoded.gzd,
      system: decoded.system,
      gzd: decoded.gzd,
      squareId: decoded.squareId,
      precision: decoded.precision,
      polygon: ring.map(([lon, lat]) => [lat, lon]),
    };
  } catch {
    return null;
  }
}

/**
 * Obtiene los datos de celdas LGRS dentro de un área delimitada.
 * Utilizado principalmente para el renderizado de la cuadrícula en el globo 3D.
 */
export function getLGRSCellsInBounds(
  bounds: { north: number; south: number; west: number; east: number },
  digits: number,
  limit: number = 200
): any[] {
  const cells: Map<string, any> = new Map();
  
  // Tamaño aproximado de paso basado en los dígitos de precisión
  // 100km (digits 0) ~ 3.3 grados | 10km (digits 1) ~ 0.33 grados
  const step = digits === 0 ? 3.0 : 0.3;
  
  for (let lat = bounds.south; lat <= bounds.north; lat += step) {
    for (let lng = bounds.west; lng <= bounds.east; lng += step) {
      if (cells.size >= limit) break;
      
      const res = getLGRSCode(lat, lng, digits);
      if (!cells.has(res.code)) {
        const cellData = parseLgrsCell(res.code);
        if (cellData) {
          cells.set(res.code, cellData);
        }
      }
    }
    if (cells.size >= limit) break;
  }
  
  return Array.from(cells.values());
}

export function getNeighborCells(currentCode: string): {
  north: string | null;
  south: string | null;
  east: string | null;
  west: string | null;
  all: string[];
} {
  try {
    const all = lunarGridService.getNeighbors(currentCode);
    return {
      north: all[0] ?? null,
      east: all[2] ?? null,
      south: all[4] ?? null,
      west: all[6] ?? null,
      all,
    };
  } catch {
    return { north: null, south: null, east: null, west: null, all: [] };
  }
}

/**
 * Genera líneas de cuadrícula LGRS limpias y continuas según el nivel de detalle:
 * - Zona LTM (-80°..+80°): bandas de 8° y zonas de 6°, subdividiéndose al acercar el zoom.
 * - Regiones polares LPS (|lat| >= 80°): anillos concéntricos y radios polares.
 */
export function getLGRSGridLines(level: 1 | 2 | 3 | 4 = 1, mode: 'EQ' | 'NP' | 'SP' = 'EQ') {
  if (mode === 'EQ') {
    const latStep = level === 1 ? 8 : level === 2 ? 4 : level === 3 ? 2 : 1;
    const lngStep = level === 1 ? 6 : level === 2 ? 6 : level === 3 ? 3 : 1.5;

    const lats: { value: number; isMajor: boolean; isPolarBoundary?: boolean }[] = [];
    for (let lat = -POLAR_LATITUDE_THRESHOLD; lat <= POLAR_LATITUDE_THRESHOLD; lat += latStep) {
      lats.push({
        value: lat,
        isMajor: lat % 8 === 0 || lat === 0,
        isPolarBoundary: Math.abs(lat) === POLAR_LATITUDE_THRESHOLD,
      });
    }

    const lngs: { value: number; isMajor: boolean }[] = [];
    for (let lng = -180; lng < 180; lng += lngStep) {
      lngs.push({
        value: lng,
        isMajor: lng % 6 === 0,
      });
    }

    return { lat: lats, lng: lngs, boundary: POLAR_LATITUDE_THRESHOLD };
  }

  const isNorth = mode === 'NP';
  const latLimit = isNorth ? 60 : -60;
  const latStep = level === 1 ? 5 : level === 2 ? 2.5 : 1;

  const lats: { value: number; isMajor: boolean; isPolarBoundary?: boolean }[] = [];
  for (
    let lat = isNorth ? 90 : -90;
    isNorth ? lat >= latLimit : lat <= latLimit;
    lat += isNorth ? -latStep : latStep
  ) {
    if (Math.abs(lat) === 90) continue;
    lats.push({
      value: lat,
      isMajor: Math.abs(lat) === 80 || Math.abs(lat) === 82 || Math.abs(lat) % 10 === 0,
      isPolarBoundary: Math.abs(lat) === POLAR_LATITUDE_THRESHOLD,
    });
  }

  const lngStep = level === 1 ? 30 : level === 2 ? 15 : 6;
  const lngs: { value: number; isMajor: boolean }[] = [];
  for (let lng = -180; lng < 180; lng += lngStep) {
    lngs.push({
      value: lng,
      isMajor: lng % 30 === 0 || lng === 0,
    });
  }

  return {
    lat: lats,
    lng: lngs,
    boundary: isNorth ? POLAR_LATITUDE_THRESHOLD : -POLAR_LATITUDE_THRESHOLD,
  };
}

export function getLtmZoneLabels() {
  return Array.from({ length: 60 }, (_, idx) => {
    const zone = idx + 1;
    return {
      zone,
      code: zone.toString().padStart(2, '0'),
      centralMeridian: getLtmCentralMeridian(zone),
    };
  });
}

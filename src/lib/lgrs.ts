'use client';

/**
 * LGRS (Lunar Grid Reference System) Implementation V2.1
 * USGS Standard LPS (Polar) and LTM (Transverse Mercator) Support
 */

export const BANDS = [
  { min: 75, max: 90, code: 'H', label: 'North Polar High' },
  { min: 45, max: 75, code: 'K', label: 'North Mid-Lat' },
  { min: 15, max: 45, code: 'L', label: 'North Tropical' },
  { min: -15, max: 15, code: 'M', label: 'Equatorial' },
  { min: -45, max: -15, code: 'N', label: 'South Tropical' },
  { min: -75, max: -45, code: 'P', label: 'South Mid-Lat' },
  { min: -90, max: -75, code: 'Q', label: 'South Polar High' }
];

export interface LGRSResult {
  code: string;
  band: string;
  sector: string;
  easting: number;
  northing: number;
}

/**
 * Normaliza la longitud al dominio [-180, 180] compatible con Leaflet.
 */
export function normalizeLng(lng: number): number {
  let n = lng % 360;
  if (n > 180) n -= 360;
  if (n <= -180) n += 360;
  return n;
}

export function getLGRSCode(lat: number, lng: number): LGRSResult {
  const nLng = ((lng % 360) + 360) % 360; // 0-360 para cálculo de sector
  const sectorNum = Math.floor(nLng / 15) + 1;
  const sectorStr = sectorNum.toString().padStart(2, '0');
  
  const bandObj = BANDS.find(b => lat >= b.min && lat <= b.max) || 
                  (lat > 0 ? BANDS[0] : BANDS[BANDS.length - 1]);
  
  const sectorLngStart = (sectorNum - 1) * 15;
  const sectorLngOffset = nLng - sectorLngStart;
  const bandLatRange = bandObj.max - bandObj.min;
  const latOffset = lat - bandObj.min;
  
  const easting = Math.floor((sectorLngOffset / 15) * 100);
  const northing = Math.floor((latOffset / bandLatRange) * 100);

  const code = `${bandObj.code}-${sectorStr}-E${easting.toString().padStart(2, '0')}-N${northing.toString().padStart(2, '0')}`;

  return {
    code,
    band: bandObj.code,
    sector: sectorStr,
    easting,
    northing
  };
}

/**
 * Parsea un código de celda estilo '15Q' o el formato completo.
 */
export function parseLgrsCell(code: string): { 
  latMin: number, latMax: number, lngMin: number, lngMax: number, 
  centerLat: number, centerLng: number, band: string, sector: string 
} | null {
  try {
    let bandCode = '';
    let sectorNum = 0;

    // Caso 1: Formato corto 15Q o 15QHN
    const shortMatch = code.match(/^(\d{1,2})([A-Z])/);
    if (shortMatch) {
      sectorNum = parseInt(shortMatch[1]);
      bandCode = shortMatch[2];
    } else {
      // Caso 2: Formato estándar Band-Sector-...
      const parts = code.split('-');
      if (parts.length >= 2) {
        bandCode = parts[0];
        sectorNum = parseInt(parts[1]);
      } else {
        return null;
      }
    }

    const band = BANDS.find(b => b.code === bandCode);
    if (!band || sectorNum < 1 || sectorNum > 24) return null;

    const lngMinRaw = (sectorNum - 1) * 15;
    const lngMaxRaw = sectorNum * 15;
    
    // Normalizar para Leaflet
    const lngMin = normalizeLng(lngMinRaw);
    const lngMax = normalizeLng(lngMaxRaw);
    
    const latMin = band.min;
    const latMax = band.max;

    return {
      latMin,
      latMax,
      lngMin: Math.min(lngMin, lngMax), // Manejo de cruce de antimeridiano simplificado
      lngMax: Math.max(lngMin, lngMax),
      centerLat: (latMin + latMax) / 2,
      centerLng: normalizeLng((lngMinRaw + lngMaxRaw) / 2),
      band: bandCode,
      sector: sectorNum.toString().padStart(2, '0')
    };
  } catch {
    return null;
  }
}

export function getNeighborCells(currentCode: string) {
  const cell = parseLgrsCell(currentCode);
  if (!cell) return {};

  const sector = parseInt(cell.sector);
  const bandIndex = BANDS.findIndex(b => b.code === cell.band);

  const getCode = (s: number, bIdx: number) => {
    const sFix = ((s - 1 + 24) % 24) + 1;
    if (bIdx < 0 || bIdx >= BANDS.length) return null;
    return `${sFix}${BANDS[bIdx].code}`;
  };

  return {
    north: getCode(sector, bandIndex - 1),
    south: getCode(sector, bandIndex + 1),
    east: getCode(sector + 1, bandIndex),
    west: getCode(sector - 1, bandIndex),
  };
}

export function decodeLGRS(code: string): { lat: number; lng: number } | null {
  try {
    const parts = code.split('-');
    if (parts.length !== 4) return null;

    const bandCode = parts[0];
    const sectorNum = parseInt(parts[1]);
    const easting = parseInt(parts[2].substring(1));
    const northing = parseInt(parts[3].substring(1));

    const band = BANDS.find(b => b.code === bandCode);
    if (!band) return null;

    const lngStart = (sectorNum - 1) * 15;
    const lngRaw = lngStart + (easting / 100) * 15;
    const lng = normalizeLng(lngRaw);
    
    const latRange = band.max - band.min;
    const lat = band.min + (northing / 100) * latRange;

    return { lat, lng };
  } catch {
    return null;
  }
}

export function getLGRSGridLines(level: 1 | 2 | 3 | 4 = 1, mode: 'EQ' | 'NP' | 'SP' = 'EQ') {
  const step = level === 1 ? 15 : level === 2 ? 5 : level === 3 ? 1 : 0.5;
  
  if (mode === 'EQ') {
    const lats = [];
    for (let lat = -90; lat <= 90; lat += step) {
      lats.push({
        value: lat,
        isMajor: lat % 30 === 0 || lat === 0
      });
    }
    const lngs = [];
    for (let lng = -180; lng < 180; lng += step) {
      lngs.push({
        value: lng,
        isMajor: lng % 30 === 0 || lng === 0
      });
    }
    return { lat: lats, lng: lngs, boundary: 0 };
  }

  const isNorth = mode === 'NP';
  const latLimit = isNorth ? 55 : -55;
  
  const lats = [];
  const majorLats = [80, 85, 75, 70, 65];
  
  for (let lat = isNorth ? 90 : -90; isNorth ? lat >= latLimit : lat <= latLimit; lat += (isNorth ? -step : step)) {
    if (Math.abs(lat) === 90) continue;
    lats.push({
      value: lat,
      isMajor: majorLats.includes(Math.abs(lat)) || lat % 10 === 0
    });
  }

  const lngs = [];
  const lngStep = level === 1 ? 30 : level === 2 ? 15 : 10;
  for (let lng = -180; lng < 180; lng += lngStep) {
    lngs.push({
      value: lng,
      isMajor: lng % 30 === 0 || lng === 0
    });
  }

  return { 
    lat: lats, 
    lng: lngs,
    boundary: isNorth ? 80 : -80
  };
}

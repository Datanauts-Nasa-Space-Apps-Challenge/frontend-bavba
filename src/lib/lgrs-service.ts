import {
    POLAR_LATITUDE_THRESHOLD,
    forwardLTM,
    inverseLTM,
    forwardLPS,
    inverseLPS,
    normalizeLongitude,
    clampLatitude,
  } from './moon-projections';
  
  export type LunarGridSystem = 'LTM' | 'LPS_NORTH' | 'LPS_SOUTH';
  
  export interface LunarGridReference {
    system: LunarGridSystem;
    code: string;
    gzd: string;          // Grid Zone Designator (ej. "23M", "Z", "A")
    squareId: string;     // 100-km Grid Square ID (2 letras, ej. "PN")
    easting: number;      // Coordenada métrica proyectada E (m)
    northing: number;     // Coordenada métrica proyectada N (m)
    precision: number;    // Tamaño de celda en metros (100000, 10000, 1000, 100, 10, 1)
  }
  
  export interface DecodedLGRS {
    lat: number;
    lon: number;
    system: LunarGridSystem;
    gzd: string;
    squareId: string;
    easting: number;
    northing: number;
    precision: number;
  }
  
  /**
   * Bandas de latitud LGRS/MGRS entre -80° y +80° (20 bandas de 8° cada una).
   * Se omiten 'I' y 'O' por estándar cartográfico.
   */
  export const LTM_LATITUDE_BANDS = 'CDEFGHJKLMNPQRSTUVWX';
  
  /**
   * Alfabetos de 100 km (24 letras sin I ni O)
   */
  const E100K_LETTERS = [
    'ABCDEFGH', // Set 1 (zone % 3 === 1)
    'JKLMNPQR', // Set 2 (zone % 3 === 2)
    'STUVWXYZ', // Set 3 (zone % 3 === 0)
  ];
  
  const N100K_LETTERS = [
    'ABCDEFGHJKLMNPQRSTUV', // Zonas impares
    'FGHJKLMNPQRSTUVABCDE', // Zonas pares
  ];
  
  // Alfabetos polares LPS (24 letras horizontales x 24 verticales)
  const POLAR_X_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const POLAR_Y_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  
  const SQUARE_SIZE = 100_000; // 100 km
  
  export function precisionDigitsToMeters(digits: number): number {
    const clamped = Math.max(0, Math.min(5, Math.floor(digits)));
    return Math.pow(10, 5 - clamped);
  }
  
  export function metersToPrecisionDigits(meters: number): number {
    if (meters >= 100_000) return 0;
    if (meters >= 10_000) return 1;
    if (meters >= 1_000) return 2;
    if (meters >= 100) return 3;
    if (meters >= 10) return 4;
    return 5;
  }
  
  /**
   * Calcula la zona longitudinal LTM (1..60, ancho 6° desde -180°).
   */
  export function getLtmZoneNumber(lonDeg: number): number {
    const lon = normalizeLongitude(lonDeg);
    const zone = Math.floor((lon + 180) / 6) + 1;
    return Math.max(1, Math.min(60, zone));
  }
  
  export function getLtmCentralMeridian(zoneNumber: number): number {
    return (zoneNumber - 1) * 6 - 180 + 3;
  }
  
  /**
   * Obtiene la banda de latitud LTM ('C'..'X') para latitudes en [-80°, +80°].
   */
  export function getLtmLatitudeBand(latDeg: number): string {
    const clamped = Math.max(-POLAR_LATITUDE_THRESHOLD, Math.min(POLAR_LATITUDE_THRESHOLD - 1e-9, latDeg));
    const idx = Math.floor((clamped + POLAR_LATITUDE_THRESHOLD) / 8);
    return LTM_LATITUDE_BANDS[Math.max(0, Math.min(LTM_LATITUDE_BANDS.length - 1, idx))];
  }
  
  function getLtm100kSquareId(zoneNumber: number, easting: number, northing: number): string {
    const setParm = zoneNumber % 3;
    const eSet = setParm === 1 ? E100K_LETTERS[0] : setParm === 2 ? E100K_LETTERS[1] : E100K_LETTERS[2];
    const nSet = zoneNumber % 2 === 1 ? N100K_LETTERS[0] : N100K_LETTERS[1];
  
    const col = Math.floor(easting / SQUARE_SIZE) - 1; // E100k = 1..8
    const row = Math.floor(northing / SQUARE_SIZE) % 20;
  
    const colChar = eSet[((col % 8) + 8) % 8];
    const rowChar = nSet[((row % 20) + 20) % 20];
    return `${colChar}${rowChar}`;
  }
  
  function getPolar100kSquareId(easting: number, northing: number): string {
    // Falso origen en (2,000,000, 2,000,000) -> índice 20 en cuadrícula de 100 km
    const colIdx = Math.floor(easting / SQUARE_SIZE);
    const rowIdx = Math.floor(northing / SQUARE_SIZE);
  
    const colChar = POLAR_X_LETTERS[((colIdx % 24) + 24) % 24];
    const rowChar = POLAR_Y_LETTERS[((rowIdx % 24) + 24) % 24];
    return `${colChar}${rowChar}`;
  }
  
  /**
   * Codifica (lat, lon) al estándar LGRS lunar (LTM entre -80° y +80°, LPS fuera).
   * @param precisionDigits 0 (100km), 1 (10km), 2 (1km), 3 (100m), 4 (10m), 5 (1m). Default: 3 (100m).
   */
  export function encodeLGRS(lat: number, lon: number, precisionDigits = 3): LunarGridReference {
    const cLat = clampLatitude(lat);
    const nLon = normalizeLongitude(lon);
    const digits = Math.max(0, Math.min(5, Math.floor(precisionDigits)));
    const precision = precisionDigitsToMeters(digits);
  
    // Regiones polares: |lat| > 80° (en la franja 80°–82° se prefiere LPS según USGS/NASA)
    if (cLat > POLAR_LATITUDE_THRESHOLD) {
      const system: LunarGridSystem = 'LPS_NORTH';
      const gzd = nLon < 0 ? 'Y' : 'Z';
      const { easting, northing } = forwardLPS(cLat, nLon, 'NORTH');
      const squareId = getPolar100kSquareId(easting, northing);
      const code = formatLgrsString(gzd, squareId, easting, northing, digits);
  
      return { system, code, gzd, squareId, easting, northing, precision };
    }
  
    if (cLat < -POLAR_LATITUDE_THRESHOLD) {
      const system: LunarGridSystem = 'LPS_SOUTH';
      const gzd = nLon < 0 ? 'A' : 'B';
      const { easting, northing } = forwardLPS(cLat, nLon, 'SOUTH');
      const squareId = getPolar100kSquareId(easting, northing);
      const code = formatLgrsString(gzd, squareId, easting, northing, digits);
  
      return { system, code, gzd, squareId, easting, northing, precision };
    }
  
    // Región central y latitudes medias: LTM (-80° <= lat <= +80°)
    const system: LunarGridSystem = 'LTM';
    const zoneNumber = getLtmZoneNumber(nLon);
    const bandLetter = getLtmLatitudeBand(cLat);
    const gzd = `${zoneNumber.toString().padStart(2, '0')}${bandLetter}`;
    const centralMeridian = getLtmCentralMeridian(zoneNumber);
  
    const { easting, northing: rawNorthing } = forwardLTM(cLat, nLon, centralMeridian, 0);
    // En LTM hemisferio sur, normalizamos northing positivo (falso norte +5,000,000 m > cuarto de circunferencia lunar ~2.73M m)
    const northing = cLat < 0 ? rawNorthing + 5_000_000 : rawNorthing;
  
    const squareId = getLtm100kSquareId(zoneNumber, easting, northing);
    const code = formatLgrsString(gzd, squareId, easting, northing, digits);
  
    return { system, code, gzd, squareId, easting, northing, precision };
  }
  
  function formatLgrsString(
    gzd: string,
    squareId: string,
    easting: number,
    northing: number,
    digits: number
  ): string {
    if (digits === 0) {
      return `${gzd}${squareId}`;
    }
    const eWithin100k = ((easting % SQUARE_SIZE) + SQUARE_SIZE) % SQUARE_SIZE;
    const nWithin100k = ((northing % SQUARE_SIZE) + SQUARE_SIZE) % SQUARE_SIZE;
  
    const scale = Math.pow(10, 5 - digits);
    const eStr = Math.floor(eWithin100k / scale)
      .toString()
      .padStart(digits, '0');
    const nStr = Math.floor(nWithin100k / scale)
      .toString()
      .padStart(digits, '0');
  
    return `${gzd}${squareId}${eStr}${nStr}`;
  }
  
  /**
   * Decodifica una cadena LGRS (ej. "31MCG452108", "ZMN500500", "31M", "Z") al centro de la celda.
   */
  export function decodeLGRSFull(rawCode: string): DecodedLGRS {
    const clean = rawCode.replace(/[\s-]+/g, '').toUpperCase();
  
    // Caso 1: Polar LPS (empieza por A, B, Y o Z)
    const polarMatch = clean.match(/^([ABYZ])([A-Z]{2})?(\d*)$/);
    if (polarMatch) {
      const gzd = polarMatch[1];
      const squareId = polarMatch[2] || 'UU'; // 'UU' ≈ origen (2,000,000, 2,000,000)
      const numericPart = polarMatch[3] || '';
  
      if (numericPart.length % 2 !== 0) {
        throw new Error(`Invalid LGRS numeric precision length in code: ${rawCode}`);
      }
  
      const hemisphere = gzd === 'Y' || gzd === 'Z' ? 'NORTH' : 'SOUTH';
      const system: LunarGridSystem = hemisphere === 'NORTH' ? 'LPS_NORTH' : 'LPS_SOUTH';
  
      const colIdx = POLAR_X_LETTERS.indexOf(squareId[0]);
      const rowIdx = POLAR_Y_LETTERS.indexOf(squareId[1]);
      if (colIdx < 0 || rowIdx < 0) {
        throw new Error(`Invalid polar 100km square ID: ${squareId}`);
      }
  
      const digits = numericPart.length / 2;
      const precision = polarMatch[2] ? precisionDigitsToMeters(digits) : 1_000_000;
      const scale = Math.pow(10, 5 - digits);
  
      const eOffset = digits > 0 ? parseInt(numericPart.slice(0, digits), 10) * scale + precision / 2 : SQUARE_SIZE / 2;
      const nOffset = digits > 0 ? parseInt(numericPart.slice(digits), 10) * scale + precision / 2 : SQUARE_SIZE / 2;
  
      const easting = colIdx * SQUARE_SIZE + eOffset;
      const northing = rowIdx * SQUARE_SIZE + nOffset;
  
      const { lat, lon } = inverseLPS(easting, northing, hemisphere);
      return { lat, lon, system, gzd, squareId, easting, northing, precision };
    }
  
    // Caso 2: LTM Zona + Banda (ej. "01C" .. "60X")
    const ltmMatch = clean.match(/^(\d{1,2})([C-HJ-NP-X])([A-Z]{2})?(\d*)$/);
    if (!ltmMatch) {
      throw new Error(`Unsupported or invalid Lunar Grid Reference: ${rawCode}`);
    }
  
    const zoneNumber = parseInt(ltmMatch[1], 10);
    const bandLetter = ltmMatch[2];
    if (zoneNumber < 1 || zoneNumber > 60) {
      throw new Error(`Invalid LTM zone number: ${zoneNumber}`);
    }
  
    const gzd = `${zoneNumber.toString().padStart(2, '0')}${bandLetter}`;
    const centralMeridian = getLtmCentralMeridian(zoneNumber);
    const bandIdx = LTM_LATITUDE_BANDS.indexOf(bandLetter);
    const isSouth = bandIdx < 10; // C..M = sur (-80°..0°), N..X = norte (0°..+80°)
  
    // Si solo es GZD (ej. "31M"), devolvemos el centro geográfico de la zona/banda
    if (!ltmMatch[3]) {
      const latMin = -80 + bandIdx * 8;
      const latCenter = latMin + 4;
      const { easting, northing: rawN } = forwardLTM(latCenter, centralMeridian, centralMeridian, 0);
      const northing = isSouth ? rawN + 5_000_000 : rawN;
      return {
        lat: latCenter,
        lon: centralMeridian,
        system: 'LTM',
        gzd,
        squareId: '',
        easting,
        northing,
        precision: 240_000,
      };
    }
  
    const squareId = ltmMatch[3];
    const numericPart = ltmMatch[4] || '';
    if (numericPart.length % 2 !== 0) {
      throw new Error(`Invalid LGRS numeric precision length in code: ${rawCode}`);
    }
  
    const setParm = zoneNumber % 3;
    const eSet = setParm === 1 ? E100K_LETTERS[0] : setParm === 2 ? E100K_LETTERS[1] : E100K_LETTERS[2];
    const nSet = zoneNumber % 2 === 1 ? N100K_LETTERS[0] : N100K_LETTERS[1];
  
    const colIdx = eSet.indexOf(squareId[0]);
    const rowIdx = nSet.indexOf(squareId[1]);
    if (colIdx < 0 || rowIdx < 0) {
      throw new Error(`Invalid LTM 100km square ID "${squareId}" for zone ${zoneNumber}`);
    }
  
    const digits = numericPart.length / 2;
    const precision = precisionDigitsToMeters(digits);
    const scale = Math.pow(10, 5 - digits);
  
    const eWithin = digits > 0 ? parseInt(numericPart.slice(0, digits), 10) * scale + precision / 2 : SQUARE_SIZE / 2;
    const nWithin = digits > 0 ? parseInt(numericPart.slice(digits), 10) * scale + precision / 2 : SQUARE_SIZE / 2;
  
    const easting = (colIdx + 1) * SQUARE_SIZE + eWithin;
  
    // Estimar el ciclo de 2,000,000 m de northing correspondiente a la banda de latitud
    const bandCenterLat = -80 + bandIdx * 8 + 4;
    const { northing: approxRawN } = forwardLTM(bandCenterLat, centralMeridian, centralMeridian, 0);
    const approxNorthing = isSouth ? approxRawN + 5_000_000 : approxRawN;
  
    const cycle = 2_000_000;
    const baseRowNorthing = rowIdx * SQUARE_SIZE + nWithin;
    const k = Math.round((approxNorthing - baseRowNorthing) / cycle);
    const northing = baseRowNorthing + k * cycle;
  
    const rawNorthing = isSouth ? northing - 5_000_000 : northing;
    const { lat, lon } = inverseLTM(easting, rawNorthing, centralMeridian, 0);
  
    return {
      lat,
      lon,
      system: 'LTM',
      gzd,
      squareId,
      easting,
      northing,
      precision,
    };
  }
  
  /**
   * Devuelve el polígono GeoJSON exacto de los límites de una celda LGRS en coordenadas (lon, lat).
   */
  export function getLgrsCellBounds(code: string): GeoJSON.Polygon {
    const decoded = decodeLGRSFull(code);
    const half = decoded.precision / 2;
  
    const cornersMetric: [number, number][] = [
      [decoded.easting - half, decoded.northing - half],
      [decoded.easting + half, decoded.northing - half],
      [decoded.easting + half, decoded.northing + half],
      [decoded.easting - half, decoded.northing + half],
      [decoded.easting - half, decoded.northing - half],
    ];
  
    const ring: [number, number][] = cornersMetric.map(([e, n]) => {
      if (decoded.system === 'LPS_NORTH') {
        const p = inverseLPS(e, n, 'NORTH');
        return [p.lon, p.lat];
      }
      if (decoded.system === 'LPS_SOUTH') {
        const p = inverseLPS(e, n, 'SOUTH');
        return [p.lon, p.lat];
      }
      const zoneNumber = parseInt(decoded.gzd.slice(0, 2), 10);
      const bandLetter = decoded.gzd.slice(2);
      const isSouth = LTM_LATITUDE_BANDS.indexOf(bandLetter) < 10;
      const rawN = isSouth ? n - 5_000_000 : n;
      const p = inverseLTM(e, rawN, getLtmCentralMeridian(zoneNumber), 0);
      return [p.lon, p.lat];
    });
  
    return {
      type: 'Polygon',
      coordinates: [ring],
    };
  }
  
  /**
   * Devuelve las 8 celdas vecinas inmediatas en el plano proyectado de la celda.
   */
  export function getLgrsNeighbors(code: string): string[] {
    const decoded = decodeLGRSFull(code);
    const step = decoded.precision;
    const digits = metersToPrecisionDigits(step);
  
    const offsets: [number, number][] = [
      [0, step],      // N
      [step, step],   // NE
      [step, 0],      // E
      [step, -step],  // SE
      [0, -step],     // S
      [-step, -step], // SW
      [-step, 0],     // W
      [-step, step],  // NW
    ];
  
    const neighbors: string[] = [];
    for (const [de, dn] of offsets) {
      const ne = decoded.easting + de;
      const nn = decoded.northing + dn;
  
      let pt: { lat: number; lon: number };
      if (decoded.system === 'LPS_NORTH') {
        pt = inverseLPS(ne, nn, 'NORTH');
      } else if (decoded.system === 'LPS_SOUTH') {
        pt = inverseLPS(ne, nn, 'SOUTH');
      } else {
        const zoneNumber = parseInt(decoded.gzd.slice(0, 2), 10);
        const bandLetter = decoded.gzd.slice(2);
        const isSouth = LTM_LATITUDE_BANDS.indexOf(bandLetter) < 10;
        const rawN = isSouth ? nn - 5_000_000 : nn;
        pt = inverseLTM(ne, rawN, getLtmCentralMeridian(zoneNumber), 0);
      }
  
      const neighborRef = encodeLGRS(pt.lat, pt.lon, digits);
      if (neighborRef.code !== decoded.code && !neighbors.includes(neighborRef.code)) {
        neighbors.push(neighborRef.code);
      }
    }
  
    return neighbors;
  }
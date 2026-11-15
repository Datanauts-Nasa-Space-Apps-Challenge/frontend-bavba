import proj4 from 'proj4';

/**
 * NAVLUNAR Geodetic Projections & Reference Frame
 * Datum: Spherical Moon (IAU Moon 2000), Mean Lunar Radius R = 1,737,400 m
 */

export const LUNAR_RADIUS = 1737400; // meters
export const LTM_SCALE_FACTOR = 0.9996;
export const LPS_SCALE_FACTOR = 0.994;
export const LTM_FALSE_EASTING = 500000;
export const LTM_FALSE_NORTHING_SOUTH = 5000000;
export const LPS_FALSE_EASTING = 2000000;
export const LPS_FALSE_NORTHING = 2000000;

export const POLAR_LATITUDE_THRESHOLD = 80;
export const TRANSITION_MAX_LATITUDE = 82;

// Equirectangular (Plate Carrée)
export const LUNAR_EQ_PROJ =
  '+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=1737400 +b=1737400 +units=m +no_defs';

// North Polar Stereographic (compatible con mosaicos polares y proyecciones de vista)
export const LUNAR_NP_PROJ =
  '+proj=stere +lat_0=90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=1737400 +b=1737400 +units=m +no_defs';

// South Polar Stereographic (compatible con mosaicos polares y proyecciones de vista)
export const LUNAR_SP_PROJ =
  '+proj=stere +lat_0=-90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=1737400 +b=1737400 +units=m +no_defs';

// Proyecciones métricas LPS con factor k0 = 0.994 para cálculo de celdas LGRS
export const LGRS_LPS_NORTH_PROJ =
  '+proj=stere +lat_0=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +a=1737400 +b=1737400 +units=m +no_defs';

export const LGRS_LPS_SOUTH_PROJ =
  '+proj=stere +lat_0=-90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +a=1737400 +b=1737400 +units=m +no_defs';

export function getLtmProjString(centralMeridianDeg: number, isSouthernHemisphere = false): string {
  const falseNorthing = isSouthernHemisphere ? LTM_FALSE_NORTHING_SOUTH : 0;
  return `+proj=tmerc +lat_0=0 +lon_0=${centralMeridianDeg} +k=${LTM_SCALE_FACTOR} +x_0=${LTM_FALSE_EASTING} +y_0=${falseNorthing} +a=${LUNAR_RADIUS} +b=${LUNAR_RADIUS} +units=m +no_defs`;
}

if (typeof window !== 'undefined') {
  proj4.defs('LUNAR_EQ', LUNAR_EQ_PROJ);
  proj4.defs('LUNAR_NP', LUNAR_NP_PROJ);
  proj4.defs('LUNAR_SP', LUNAR_SP_PROJ);
  proj4.defs('LGRS_LPS_NP', LGRS_LPS_NORTH_PROJ);
  proj4.defs('LGRS_LPS_SP', LGRS_LPS_SOUTH_PROJ);
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export function normalizeLongitude(lon: number): number {
  let n = (((lon + 180) % 360) + 360) % 360 - 180;
  if (n === -180 && lon > 0) n = 180;
  return n;
}

export function clampLatitude(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

export function forwardLTM(
  latDeg: number,
  lonDeg: number,
  centralMeridianDeg: number,
  falseNorthing = 0
): { easting: number; northing: number } {
  const phi = clampLatitude(latDeg) * DEG2RAD;
  const dLambda = normalizeLongitude(lonDeg - centralMeridianDeg) * DEG2RAD;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const B = cosPhi * Math.sin(dLambda);
  const clampedB = Math.max(-0.999999999999, Math.min(0.999999999999, B));

  const x = 0.5 * LUNAR_RADIUS * LTM_SCALE_FACTOR * Math.log((1 + clampedB) / (1 - clampedB));
  const y = LUNAR_RADIUS * LTM_SCALE_FACTOR * Math.atan2(sinPhi, cosPhi * Math.cos(dLambda));

  return {
    easting: x + LTM_FALSE_EASTING,
    northing: y + falseNorthing,
  };
}

export function inverseLTM(
  easting: number,
  northing: number,
  centralMeridianDeg: number,
  falseNorthing = 0
): { lat: number; lon: number } {
  const x = easting - LTM_FALSE_EASTING;
  const y = northing - falseNorthing;

  const D = y / (LUNAR_RADIUS * LTM_SCALE_FACTOR);
  const xNorm = x / (LUNAR_RADIUS * LTM_SCALE_FACTOR);

  const sinD = Math.sin(D);
  const cosD = Math.cos(D);
  const sinhX = Math.sinh(xNorm);
  const coshX = Math.cosh(xNorm);

  const phi = Math.asin(Math.max(-1, Math.min(1, sinD / coshX)));
  const dLambda = Math.atan2(sinhX, cosD);

  return {
    lat: clampLatitude(phi * RAD2DEG),
    lon: normalizeLongitude(centralMeridianDeg + dLambda * RAD2DEG),
  };
}

export function forwardLPS(
  latDeg: number,
  lonDeg: number,
  hemisphere: 'NORTH' | 'SOUTH'
): { easting: number; northing: number } {
  const phi = clampLatitude(latDeg) * DEG2RAD;
  const lambda = normalizeLongitude(lonDeg) * DEG2RAD;

  if (hemisphere === 'NORTH') {
    const rho = 2 * LUNAR_RADIUS * LPS_SCALE_FACTOR * Math.tan(Math.PI / 4 - phi / 2);
    const x = rho * Math.sin(lambda);
    const y = -rho * Math.cos(lambda);
    return {
      easting: x + LPS_FALSE_EASTING,
      northing: y + LPS_FALSE_NORTHING,
    };
  }

  const rho = 2 * LUNAR_RADIUS * LPS_SCALE_FACTOR * Math.tan(Math.PI / 4 + phi / 2);
  const x = rho * Math.sin(lambda);
  const y = rho * Math.cos(lambda);
  return {
    easting: x + LPS_FALSE_EASTING,
    northing: y + LPS_FALSE_NORTHING,
  };
}

export function inverseLPS(
  easting: number,
  northing: number,
  hemisphere: 'NORTH' | 'SOUTH'
): { lat: number; lon: number } {
  const x = easting - LPS_FALSE_EASTING;
  const y = northing - LPS_FALSE_NORTHING;
  const rho = Math.hypot(x, y);

  if (rho < 1e-9) {
    return { lat: hemisphere === 'NORTH' ? 90 : -90, lon: 0 };
  }

  const c = 2 * Math.atan2(rho, 2 * LUNAR_RADIUS * LPS_SCALE_FACTOR);

  if (hemisphere === 'NORTH') {
    const phi = Math.asin(Math.cos(c));
    const lambda = Math.atan2(x, -y);
    return {
      lat: clampLatitude(phi * RAD2DEG),
      lon: normalizeLongitude(lambda * RAD2DEG),
    };
  }

  const phi = Math.asin(-Math.cos(c));
  const lambda = Math.atan2(x, y);
  return {
    lat: clampLatitude(phi * RAD2DEG),
    lon: normalizeLongitude(lambda * RAD2DEG),
  };
}

export function projectToMap(lat: number, lng: number, mode: 'EQ' | 'NP' | 'SP'): [number, number] {
  const cLat = clampLatitude(lat);
  const nLon = normalizeLongitude(lng);

  if (mode === 'NP') {
    const pt = proj4('EPSG:4326', LUNAR_NP_PROJ, [nLon, cLat]);
    return [pt[0], pt[1]];
  }
  if (mode === 'SP') {
    const pt = proj4('EPSG:4326', LUNAR_SP_PROJ, [nLon, cLat]);
    return [pt[0], pt[1]];
  }
  const pt = proj4('EPSG:4326', LUNAR_EQ_PROJ, [nLon, cLat]);
  return [pt[0], pt[1]];
}
import proj4 from 'proj4';

/**
 * NAVLUNAR Geodetic Projections (IAU Moon 2000)
 * Mean Lunar Radius: 1737400 meters
 */

export const LUNAR_RADIUS = 1737400;

// Equirectangular (Plate Carrée) - Equidistant Cylindrical
export const LUNAR_EQ_PROJ = '+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +x_0=0 +y_0=0 +a=1737400 +b=1737400 +units=m +no_defs';

// North Polar Stereographic (NASA NPS / EPSG:30337 Compatible)
export const LUNAR_NP_PROJ = '+proj=stere +lat_0=90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=1737400 +b=1737400 +units=m +no_defs';

// South Polar Stereographic (NASA SPS / EPSG:30340 Compatible)
export const LUNAR_SP_PROJ = '+proj=stere +lat_0=-90 +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=1737400 +b=1737400 +units=m +no_defs';

// Registrar con proj4
if (typeof window !== 'undefined') {
  proj4.defs('LUNAR_EQ', LUNAR_EQ_PROJ);
  proj4.defs('LUNAR_NP', LUNAR_NP_PROJ);
  proj4.defs('LUNAR_SP', LUNAR_SP_PROJ);
}

/**
 * Proyecta coordenadas geodéticas (lat, lng) a las coordenadas del mapa activo.
 */
export function projectToMap(lat: number, lng: number, mode: 'EQ' | 'NP' | 'SP'): [number, number] {
  // Leaflet con Proj.CRS maneja la proyección automáticamente si pasamos LatLng.
  return [lat, lng];
}

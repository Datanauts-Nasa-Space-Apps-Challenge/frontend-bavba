/**
 * NAVLUNAR Lunar Ephemeris Engine
 * Calculations for Sun/Earth relative positions in Selenographic coordinates.
 * Reference Epoch: J2000.0
 */

export interface CelestialPositions {
  sunDirection: [number, number, number];   // Normalized vector toward Sun
  earthPosition: [number, number, number];  // Scaled Earth position in scene
  subSolarLat: number;                      // Subsolar latitude (-1.54° to +1.54°)
  subSolarLon: number;                      // Subsolar longitude (-180° to +180°)
  lunarPhaseAngle: number;                  // Phase in degrees
  illuminationFraction: number;             // % of disk illuminated
}

const SYNODIC_MONTH_MS = 29.530588853 * 24 * 60 * 60 * 1000;
const ANOMALISTIC_MONTH_MS = 27.55454988 * 24 * 60 * 60 * 1000;
const DRACONIC_MONTH_MS = 27.212220817 * 24 * 60 * 60 * 1000;
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

/**
 * Calculates realistic Sun and Earth positions in selenographic coordinates.
 * Assumes +Z is 0° Lat, 0° Lon (Near Side center) in Three.js.
 */
export function calculateLunarEphemeris(
  simTimestampMs: number,
  earthOrbitRadius: number = 80
): CelestialPositions {
  const elapsed = simTimestampMs - REFERENCE_NEW_MOON_MS;

  // Synodic phase (0 to 2π)
  const synodicPhase = ((elapsed % SYNODIC_MONTH_MS) / SYNODIC_MONTH_MS) * Math.PI * 2;
  // Draconic cycle for solar inclination (±1.54°)
  const draconicPhase = ((elapsed % DRACONIC_MONTH_MS) / DRACONIC_MONTH_MS) * Math.PI * 2;
  // Anomalistic cycle for libration in longitude
  const anomalisticPhase = ((elapsed % ANOMALISTIC_MONTH_MS) / ANOMALISTIC_MONTH_MS) * Math.PI * 2;

  // Subsolar Latitude (axial tilt oscillation)
  const subSolarLatDeg = 1.5424 * Math.sin(draconicPhase);
  const subSolarLatRad = (subSolarLatDeg * Math.PI) / 180;

  // Subsolar Longitude: At New Moon (phase=0), Sun is at 0° Lon
  let subSolarLonDeg = ((synodicPhase * 180) / Math.PI) % 360;
  if (subSolarLonDeg > 180) subSolarLonDeg -= 360;
  if (subSolarLonDeg < -180) subSolarLonDeg += 360;
  const subSolarLonRad = (subSolarLonDeg * Math.PI) / 180;

  // Unit vector toward Sun (Y-Up in Three.js, +Z towards 0° Lon)
  const sunX = Math.cos(subSolarLatRad) * Math.sin(subSolarLonRad);
  const sunY = Math.sin(subSolarLatRad);
  const sunZ = Math.cos(subSolarLatRad) * Math.cos(subSolarLonRad);

  // Earth Position with libration (around 0,0)
  const librationLonRad = ((7.9 * Math.sin(anomalisticPhase)) * Math.PI) / 180;
  const librationLatRad = ((6.7 * Math.sin(draconicPhase)) * Math.PI) / 180;

  const earthX = earthOrbitRadius * Math.cos(librationLatRad) * Math.sin(librationLonRad);
  const earthY = earthOrbitRadius * Math.sin(librationLatRad);
  const earthZ = earthOrbitRadius * Math.cos(librationLatRad) * Math.cos(librationLonRad);

  const illuminationFraction = (1 - Math.cos(synodicPhase)) / 2;

  return {
    sunDirection: [sunX, sunY, sunZ],
    earthPosition: [earthX, earthY, earthZ],
    subSolarLat: subSolarLatDeg,
    subSolarLon: subSolarLonDeg,
    lunarPhaseAngle: ((synodicPhase * 180) / Math.PI + 360) % 360,
    illuminationFraction,
  };
}

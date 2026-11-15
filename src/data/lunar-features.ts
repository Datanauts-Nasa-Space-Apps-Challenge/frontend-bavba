import { LunarFeature } from '@/types/lunar';

/**
 * NAVLUNAR Unified Scientific Catalog
 * Sources: IAU Gazetteer of Planetary Nomenclature, NASA LRO, Artemis III SDT Report.
 */
export const LUNAR_FEATURES: LunarFeature[] = [
  // --- HISTORICAL MISSIONS ---
  {
    id: 'apollo-11',
    name: 'Apollo 11 - Statio Tranquillitatis',
    latitude: 0.6741,
    longitude: 23.4730,
    type: 'landing_site',
    description: 'First crewed lunar landing. Site of the Lunar Module Eagle touchdown.',
    source: 'NASA LRO',
    mission: 'Apollo 11',
    status: 'historical',
    elevation: -2674,
    slopeAvg: 2.1,
    slopeMax: 8.4,
    hazardDensity: 12,
    sunVisibility: 48,
    earthVisibility: 100,
    psrProximity: 450,
    agency: 'NASA',
    date: '1969-07-20',
    vehicle: 'Lunar Module Eagle'
  },
  {
    id: 'luna-2',
    name: 'Luna 2 Impact Site',
    latitude: 29.1,
    longitude: 0.0,
    type: 'landing_site',
    description: 'First spacecraft to reach the surface of the Moon.',
    source: 'Roscosmos Archive',
    mission: 'Luna 2',
    status: 'historical',
    elevation: -2450,
    slopeAvg: 5.4,
    agency: 'USSR',
    date: '1959-09-13'
  },
  {
    id: 'change-4',
    name: "Chang'e 4 - Von Kármán Crater",
    latitude: -45.4561,
    longitude: 177.5885,
    type: 'landing_site',
    description: 'First soft landing on the lunar far side.',
    source: 'CNSA',
    mission: "Chang'e 4",
    status: 'active',
    elevation: -5900,
    slopeAvg: 3.2,
    agency: 'CNSA',
    date: '2019-01-03',
    vehicle: 'Yutu-2 Rover'
  },

  // --- TOPOGRAPHIC FEATURES ---
  {
    id: 'shackleton-crater',
    name: 'Shackleton Crater Rim',
    latitude: -89.67,
    longitude: 0.0,
    type: 'crater',
    description: 'Strategic peak on the rim with near-constant solar visibility and water ice potential in the interior.',
    source: 'NASA LOLA',
    status: 'historical',
    elevation: 1550,
    slopeAvg: 18.5,
    slopeMax: 34.2,
    diameter: 21,
    sunVisibility: 82,
    earthVisibility: 45,
    psrProximity: 0.1
  },
  {
    id: 'tycho-crater',
    name: 'Tycho Crater',
    latitude: -43.3,
    longitude: -11.2,
    type: 'crater',
    description: 'Prominent ray crater in the southern lunar highlands.',
    source: 'IAU Gazetteer',
    status: 'historical',
    elevation: -1500,
    diameter: 85,
    slopeAvg: 22.0
  },

  // --- PLANNED MISSIONS & ARTEMIS CANDIDATES ---
  {
    id: 'artemis-3-c1',
    name: 'Artemis III - Candidate Site 001',
    latitude: -89.44,
    longitude: 222.0,
    type: 'landing_site',
    description: 'Primary landing candidate for Artemis III. High solar illumination and close to PSRs.',
    source: 'NASA Artemis Program',
    status: 'planned',
    elevation: 850,
    slopeAvg: 4.5,
    slopeMax: 12.1,
    hazardDensity: 18,
    sunVisibility: 76,
    earthVisibility: 52,
    psrProximity: 2.4,
    agency: 'NASA',
    date: '2026-09-01'
  },
  {
    id: 'connecting-ridge',
    name: 'Connecting Ridge',
    latitude: -89.45,
    longitude: 222.5,
    type: 'mountain',
    description: 'Candidate region linking Shackleton and de Gerlache craters.',
    source: 'NASA SVS',
    status: 'proposed',
    elevation: 1200,
    slopeAvg: 8.2,
    sunVisibility: 88,
    psrProximity: 1.8
  }
];

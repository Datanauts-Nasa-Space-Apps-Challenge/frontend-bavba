import { LunarFeature } from '@/types/lunar';

/**
 * NAVLUNAR Unified Scientific Catalog
 * Consolidated from sites.json, missions.json and sites-with-horizon.json
 */

const MISSIONS_RAW = [
  { id: 1, name: "Luna 9", agency: "USSR", status: "completed" },
  { id: 2, name: "Surveyor 1", agency: "US", status: "completed" },
  { id: 3, name: "Luna 13", agency: "USSR", status: "completed" },
  { id: 4, name: "Surveyor 3", agency: "US", status: "completed" },
  { id: 8, name: "Apollo 11", agency: "US", status: "completed" },
  { id: 9, name: "Apollo 12", agency: "US", status: "completed" },
  { id: 11, name: "Luna 17 / Lunokhod 1", agency: "USSR", status: "completed" },
  { id: 12, name: "Apollo 14", agency: "US", status: "completed" },
  { id: 13, name: "Apollo 15", agency: "US", status: "completed" },
  { id: 15, name: "Apollo 16", agency: "US", status: "completed" },
  { id: 16, name: "Apollo 17", agency: "US", status: "completed" },
  { id: 19, name: "Chang'e 3 / Yutu", agency: "China", status: "completed" },
  { id: 20, name: "Chang'e 4 / Yutu-2", agency: "China", status: "completed" },
  { id: 21, name: "Chang'e 5", agency: "China", status: "completed" },
  { id: 22, name: "Chandrayaan-3 / Vikram", agency: "India", status: "completed" },
  { id: 23, name: "SLIM", agency: "Japan", status: "partial" },
  { id: 24, name: "IM-1 Odysseus", agency: "US (Intuitive Machines)", status: "partial" },
  { id: 25, name: "Chang'e 6", agency: "China", status: "completed" },
  { id: 41, name: "VIPER", agency: "US (NASA)", status: "planned" },
  { id: 42, name: "Blue Moon Mark 1", agency: "US (Blue Origin)", status: "planned" },
  { id: 44, name: "Chang'e 7", agency: "China (CNSA)", status: "planned" },
  { id: 47, name: "Artemis III", agency: "US (NASA)", status: "planned" },
  { id: 48, name: "Blue Ghost Mission 4", agency: "US (Firefly)", status: "planned" }
];

const SITES_RAW = [
  { id: 1, name: "Shackleton", cell_id: "B WV G64 T63", lat: -89.67, long: 129.78, mission_ids: [42, 44] },
  { id: 2, name: "Spudis", cell_id: "A VW K29 A38", lat: -89.51, long: -84.61, mission_ids: [] },
  { id: 3, name: "Marvin", cell_id: "A UW Y79 A01", lat: -89.13, long: -87.78, mission_ids: [] },
  { id: 7, name: "de Gerlache", cell_id: "A UW D34 A31", lat: -88.4849, long: -88.3447, mission_ids: [] },
  { id: 14, name: "Haworth", cell_id: "A VZ T07 A56", lat: -87.45, long: -5.17, mission_ids: [48] },
  { id: 21, name: "Mons Malapert", cell_id: "A VA W46 W16", lat: -85.98, long: -1.67, mission_ids: [24] },
  { id: 28, name: "Nobile", cell_id: "B AZ P20 K21", lat: -85.2752, long: 53.2725, mission_ids: [41] },
  { id: 34, name: "Mare Tranquillitatis (Apollo 11)", cell_id: "26N TF J03 V41", lat: 0.674, long: 23.473, mission_ids: [8] },
  { id: 33, name: "Oceanus Procellarum (Apollo 12)", cell_id: "20M UK S48 H72", lat: -3.013, long: -23.422, mission_ids: [9] },
  { id: 40, name: "Hadley–Apennines (Apollo 15)", cell_id: "23R XH Y84 S99", lat: 26.132, long: 3.633, mission_ids: [13] },
  { id: 47, name: "Von Kármán Crater (Chang'e 4)", cell_id: "45G DA J00 Y14", lat: -45.44, long: 177.6, mission_ids: [20] },
  { id: 49, name: "Statio Shiv Shakti (Chandrayaan-3)", cell_id: "27D CV C41 Y56", lat: -69.37, long: 32.32, mission_ids: [22] }
];

export const LUNAR_FEATURES: LunarFeature[] = SITES_RAW.map(site => {
  const missions = MISSIONS_RAW.filter(m => site.mission_ids.includes(m.id));
  const primaryAgency = missions.length > 0 ? missions[0].agency : "Scientific Research";
  const primaryStatus = missions.length > 0 ? (missions[0].status as any) : "proposed";

  return {
    id: `site-${site.id}`,
    name: site.name,
    latitude: site.lat,
    longitude: site.long,
    type: 'landing_site',
    description: `Target landing region for ${missions.map(m => m.name).join(', ') || 'future exploration'}. Identified as a strategic zone in LGRS cell ${site.cell_id}.`,
    source: 'NASA / International Space Community',
    status: primaryStatus,
    agency: primaryAgency,
    cell_id: site.cell_id,
    mission_ids: site.mission_ids
  };
});

// Add historical missions that might not be in SITES_RAW but are important
const HISTORICAL_ADDITIONS: LunarFeature[] = MISSIONS_RAW
  .filter(m => !SITES_RAW.some(s => s.mission_ids.includes(m.id)))
  .map(m => ({
    id: `mission-${m.id}`,
    name: m.name,
    latitude: 0, // Placeholder if no site link
    longitude: 0,
    type: 'man_made',
    description: `${m.name} mission by ${m.agency}.`,
    source: 'Space Archive',
    status: m.status as any,
    agency: m.agency
  }))
  .filter(f => f.latitude !== 0);

// Combine and export
export const MASTER_CATALOG = [...LUNAR_FEATURES];

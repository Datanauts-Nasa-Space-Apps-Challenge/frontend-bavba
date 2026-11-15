export type LayerProjection = 'EQ' | 'NP' | 'SP';
export type LayerType = 'base' | 'overlay';
export type LayerCategory = 'imagery' | 'topography' | 'illumination' | 'thermal' | 'resources' | 'geophysics' | 'lgrs';
export type BlendMode = 'normal' | 'multiply' | 'screen';

export interface NasaLayerInfo {
  id: string;
  name: string;
  projection: LayerProjection;
  type: LayerType;
  category: LayerCategory;
  format: 'png' | 'jpg';
  tileMatrixSet: string;
  description: string;
  verified: boolean;
  latBounds: [number, number];
  blendMode: BlendMode;
  defaultOpacity: number;
  defaultVisible: boolean;
  minZoom: number;
  maxZoom: number;
}

export const NASA_TREK_LAYERS: Record<string, NasaLayerInfo> = {
  LRO_WAC_Mosaic_Global_303ppd_v02: {
    id: 'LRO_WAC_Mosaic_Global_303ppd_v02',
    name: 'LRO WAC Global Mosaic',
    projection: 'EQ',
    type: 'base',
    category: 'imagery',
    format: 'jpg',
    tileMatrixSet: 'default028mm',
    description: 'Global optical mosaic derived from LRO Wide Angle Camera.',
    verified: true,
    latBounds: [-90, 90],
    blendMode: 'normal',
    defaultOpacity: 1.0,
    defaultVisible: true,
    minZoom: 0,
    maxZoom: 8,
  },
  LRO_LOLA_ClrShade_Global_128ppd_v06: {
    id: 'LRO_LOLA_ClrShade_Global_128ppd_v06',
    name: 'LOLA Color Shaded Relief',
    projection: 'EQ',
    type: 'overlay',
    category: 'topography',
    format: 'png',
    tileMatrixSet: 'default028mm',
    description: 'Global hypsometric elevation map from LOLA altimetry.',
    verified: true,
    latBounds: [-90, 90],
    blendMode: 'normal',
    defaultOpacity: 0.6,
    defaultVisible: false,
    minZoom: 0,
    maxZoom: 7,
  },
  LRO_WAC_Mosaic_North_Pole_60N_2015: {
    id: 'LRO_WAC_Mosaic_North_Pole_60N_2015',
    name: 'LRO WAC North Pole',
    projection: 'NP',
    type: 'base',
    category: 'imagery',
    format: 'png',
    tileMatrixSet: 'default028mm',
    description: 'Stereographic North Pole mosaic (60N-90N).',
    verified: true,
    latBounds: [60, 90],
    blendMode: 'normal',
    defaultOpacity: 1.0,
    defaultVisible: true,
    minZoom: 2,
    maxZoom: 10,
  },
  LRO_LOLA_Shade_N60_v04: {
    id: 'LRO_LOLA_Shade_N60_v04',
    name: 'LOLA North Pole Relief',
    projection: 'NP',
    type: 'overlay',
    category: 'topography',
    format: 'jpg',
    tileMatrixSet: 'default028mm',
    description: 'High-resolution shaded relief for the North Pole.',
    verified: true,
    latBounds: [60, 90],
    blendMode: 'multiply',
    defaultOpacity: 0.7,
    defaultVisible: false,
    minZoom: 2,
    maxZoom: 10,
  },
  LRO_WAC_Mosaic_South_Pole_60S_2015: {
    id: 'LRO_WAC_Mosaic_South_Pole_60S_2015',
    name: 'LRO WAC South Pole',
    projection: 'SP',
    type: 'base',
    category: 'imagery',
    format: 'png',
    tileMatrixSet: 'default028mm',
    description: 'Stereographic South Pole mosaic (60S-90S).',
    verified: true,
    latBounds: [-90, -60],
    blendMode: 'normal',
    defaultOpacity: 1.0,
    defaultVisible: true,
    minZoom: 2,
    maxZoom: 10,
  },
  LRO_LOLA_Shade_60S_4mp_v04: {
    id: 'LRO_LOLA_Shade_60S_4mp_v04',
    name: 'LOLA South Pole Relief',
    projection: 'SP',
    type: 'overlay',
    category: 'topography',
    format: 'jpg',
    tileMatrixSet: 'default028mm',
    description: 'High-res relief derived from LOLA 4m/px digital elevation.',
    verified: true,
    latBounds: [-90, -60],
    blendMode: 'multiply',
    defaultOpacity: 0.7,
    defaultVisible: false,
    minZoom: 2,
    maxZoom: 10,
  },
  WAC_POLE_ILL_PCT_SOUTH_100M: {
    id: 'WAC_POLE_ILL_PCT_SOUTH_100M',
    name: 'South Pole Illumination (%)',
    projection: 'SP',
    type: 'overlay',
    category: 'illumination',
    format: 'png',
    tileMatrixSet: 'default028mm',
    description: 'Solar illumination percentage at 100m resolution.',
    verified: true,
    latBounds: [-90, -60],
    blendMode: 'screen',
    defaultOpacity: 0.8,
    defaultVisible: false,
    minZoom: 2,
    maxZoom: 10,
  },
  LOLA_PSR_SP_80S: {
    id: 'LOLA_PSR_SP_80S',
    name: 'South Pole PSR',
    projection: 'SP',
    type: 'overlay',
    category: 'illumination',
    format: 'png',
    tileMatrixSet: 'default028mm',
    description: 'Permanently Shadowed Regions in the South Polar region.',
    verified: false,
    latBounds: [-90, -80],
    blendMode: 'normal',
    defaultOpacity: 0.7,
    defaultVisible: false,
    minZoom: 3,
    maxZoom: 10,
  }
};

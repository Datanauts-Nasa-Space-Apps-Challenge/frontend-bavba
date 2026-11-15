import { LayerCategory, BlendMode } from '@/lib/moon-wmts-catalog';

export type LunarFeatureType = 'crater' | 'landing_site' | 'mountain' | 'mare' | 'rille' | 'man_made' | 'scientific_region';
export type LunarFeatureStatus = 'historical' | 'active' | 'planned' | 'proposed' | 'unknown';

export type MapViewMode = 'globe' | 'central' | 'north_pole' | 'south_pole' | 'quad';

export interface LayerState {
  id: string;
  active: boolean;
  opacity: number;
  loading: boolean;
  version: string;
  source: string;
  category: LayerCategory;
  blendMode: BlendMode;
}

export type MapLayersConfig = Record<string, LayerState>;

export interface EvaluationPoint {
  id: string;
  siteId?: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  horizon: number;
  color: string;
}

export interface LunarFeature {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: LunarFeatureType;
  description: string;
  source: string;
  mission?: string;
  status: LunarFeatureStatus;
  elevation?: number;
  slopeAvg?: number;
  slopeMax?: number;
  roughness?: number;
  hazardDensity?: number;
  sunVisibility?: number;
  earthVisibility?: number;
  psrProximity?: number;
  diameter?: number;
  date?: string;
  agency?: string;
  vehicle?: string;
}

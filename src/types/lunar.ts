import { LayerCategory, BlendMode } from '@/lib/moon-wmts-catalog';

export type LunarFeatureType = 'crater' | 'landing_site' | 'mountain' | 'mare' | 'rille' | 'man_made' | 'scientific_region';
export type LunarFeatureStatus = 'historical' | 'active' | 'planned' | 'proposed' | 'unknown' | 'completed' | 'failed' | 'partial';

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
  horizon_profile?: number[];
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
  mission_ids?: number[];
  cell_id?: string;
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
  horizon_profile?: number[];
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Mission {
  id: string;
  name: string;
  year?: number;
  agency: string;
  type: string;
  coordinates: Coordinate;
  description: string;
  status?: string;
}

'use client';

import { MapViewMode, LunarFeature, MapLayersConfig, EvaluationPoint } from '@/types/lunar';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('./LeafletMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#050505] flex items-center justify-center">
      <div className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-mono">
        INITIALIZING CARTOGRAPHIC ENGINE...
      </div>
    </div>
  )
});

interface ProjectionView2DProps {
  mode: MapViewMode;
  features: LunarFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (id: string | null) => void;
  layers?: MapLayersConfig;
  simTime?: number;
  evaluationPoints?: EvaluationPoint[];
  onInspectPoint?: (lat: number, lng: number) => void;
  isMini?: boolean;
}

export default function ProjectionView2D({ 
  mode, 
  features, 
  selectedFeatureId, 
  onSelectFeature, 
  layers,
  simTime = 0,
  evaluationPoints = [],
  onInspectPoint,
  isMini = false
}: ProjectionView2DProps) {
  
  if (!layers) return null;

  return (
    <div className="w-full h-full relative">
      <LeafletMap
        key={`${mode}-${isMini}`}
        mode={mode}
        features={features}
        selectedFeatureId={selectedFeatureId}
        onSelectFeature={onSelectFeature}
        layers={layers}
        evaluationPoints={evaluationPoints}
        simTime={simTime}
        onInspectPoint={onInspectPoint}
        isMini={isMini}
      />
      
      {!isMini && mode === 'central' && (
        <div className="absolute bottom-14 left-6 z-[1000] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 text-[8px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-mono shadow-2xl max-w-[80vw] md:max-w-none">
            Basemap: NASA Trek · LRO LROC WAC mosaic (NASA/GSFC/ASU) · Grid: USGS LGRS · Names: IAU/USGS
          </div>
        </div>
      )}

      {!isMini && mode === 'north_pole' && (
        <div className="absolute bottom-14 left-6 z-[1000] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 text-[8px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-mono shadow-2xl max-w-[80vw] md:max-w-none">
            Basemap: NASA Trek LRO_WAC_Mosaic_NPole60_100m_v02 · LROC WAC (NASA/GSFC/ASU) · Grid: USGS LGRS · Names: IAU/USGS
          </div>
        </div>
      )}

      {!isMini && mode === 'south_pole' && (
        <div className="absolute bottom-14 left-6 z-[1000] pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 text-[8px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-mono shadow-2xl max-w-[80vw] md:max-w-none">
            Basemap: NASA Trek LRO_WAC_Mosaic_SPole60_100m_v02 · LROC WAC (NASA/GSFC/ASU) · Grid: USGS LGRS · Names: IAU/USGS
          </div>
        </div>
      )}
    </div>
  );
}

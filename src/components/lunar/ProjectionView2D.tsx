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
  ),
});

interface ProjectionView2DProps {
  mode: MapViewMode;
  features: LunarFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (id: string | null) => void;
  layers?: MapLayersConfig;
  evaluationPoints: EvaluationPoint[];
  simTime?: number;
  onInspectPoint?: (lat: number, lng: number) => void;
  isMini?: boolean;
}

export default function ProjectionView2D({
  mode,
  features,
  selectedFeatureId,
  onSelectFeature,
  layers,
  evaluationPoints,
  simTime = 0,
  onInspectPoint,
  isMini = false,
}: ProjectionView2DProps) {
  if (!layers) return null;

  return (
    <div className="w-full h-full relative" key={`proj-wrap-${mode}-${isMini ? 'mini' : 'full'}`}>
      <LeafletMap
        key={`leaflet-${mode}-${isMini ? 'mini' : 'full'}`}
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

      {!isMini && (
        <div className="absolute bottom-6 right-6 z-[1000] pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md border border-white/10 p-3 shadow-2xl flex flex-col items-end gap-1.5 rounded">
            <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] font-bold">
               <span className="text-blue-400">BASEMAP:</span>
               <span className="text-white/80">NASA LRO WAC</span>
            </div>
            <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] font-bold">
               <span className="text-blue-400">GRID:</span>
               <span className="text-white/80">USGS LGRS V2.1</span>
            </div>
            <div className="mt-1 h-px w-full bg-white/5" />
            <div className="text-[8px] text-white/30 uppercase tracking-widest font-mono">
              IAU_Moon_2000 • {mode.replace('_', ' ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

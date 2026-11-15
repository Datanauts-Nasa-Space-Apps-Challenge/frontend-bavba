'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapViewMode, MapLayersConfig, EvaluationPoint } from '@/types/lunar';
import { LUNAR_FEATURES } from '@/data/lunar-features';
import { NASA_TREK_LAYERS, LayerCategory } from '@/lib/moon-wmts-catalog';
import GlobeView from './GlobeView';
import ProjectionView2D from './ProjectionView2D';
import { LayerPanel, InfoPanel } from './SidebarPanels';
import StatusBar from './StatusBar';
import { cn } from '@/lib/utils';
import { Layers, Menu, Search, LayoutGrid } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { CelestialPositions, calculateLunarEphemeris } from '@/lib/lunar-ephemeris';
import Image from 'next/image';

export default function MapInterface() {
  const [viewMode, setViewMode] = useState<MapViewMode>('quad');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [inspectedPoint, setInspectedPoint] = useState<{ lat: number; lng: number; telemetry: CelestialPositions } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Simulation State (Lifted for 2D/3D sync)
  const [simTime, setSimTime] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const [isSimActive, setIsSimActive] = useState(true);

  const [evaluationPoints, setEvaluationPoints] = useState<EvaluationPoint[]>([]);

  useEffect(() => {
    // Initialize simulation time only on client to avoid hydration mismatch
    setSimTime(Date.now());
  }, []);

  const [layers, setLayers] = useState<MapLayersConfig>(() => {
    const initialState: MapLayersConfig = {
      lgrs: {
        id: 'lgrs',
        active: true,
        opacity: 0.4,
        loading: false,
        version: 'V2.1',
        source: 'USGS/McClernan',
        category: 'lgrs',
        blendMode: 'normal'
      },
      daynight: {
        id: 'daynight',
        active: true,
        opacity: 0.6,
        loading: false,
        version: 'Ephemeris V1',
        source: 'NAVLUNAR Engine',
        category: 'illumination',
        blendMode: 'screen'
      }
    };
    Object.values(NASA_TREK_LAYERS).forEach(layer => {
      initialState[layer.id] = {
        id: layer.id,
        active: layer.defaultVisible,
        opacity: layer.defaultOpacity,
        loading: false,
        version: 'LRO/Trek',
        source: layer.id.includes('LRO') ? 'NASA LRO' : 'NASA Trek',
        category: layer.category,
        blendMode: layer.blendMode
      };
    });
    return initialState;
  });

  const filteredFeatures = useMemo(() => {
    if (!searchQuery) return LUNAR_FEATURES;
    return LUNAR_FEATURES.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const isAnyLayerLoading = useMemo(() => {
    return Object.values(layers).some(l => l.loading);
  }, [layers]);

  const activePoint = useMemo(() => {
    if (selectedFeatureId) {
      const f = LUNAR_FEATURES.find(f => f.id === selectedFeatureId);
      if (f) return { lat: f.latitude, lng: f.longitude };
    }
    if (inspectedPoint) {
      return { lat: inspectedPoint.lat, lng: inspectedPoint.lng };
    }
    return null;
  }, [selectedFeatureId, inspectedPoint]);

  const toggleLayer = (id: string) => {
    setLayers(prev => ({ 
      ...prev, 
      [id]: { ...prev[id], active: !prev[id].active } 
    }));
  };

  const setLayerOpacity = (id: string, val: number) => {
    setLayers(prev => ({ 
      ...prev, 
      [id]: { ...prev[id], opacity: val } 
    }));
  };

  const handleInspect = (lat: number, lng: number, telemetry: CelestialPositions) => {
    setInspectedPoint({ lat, lng, telemetry });
    setSelectedFeatureId(null);
  };

  const handle2DInspect = (lat: number, lng: number) => {
    // Current telemetry at click time
    const telemetry = calculateLunarEphemeris(simTime || Date.now());
    handleInspect(lat, lng, telemetry);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    // Trigger window resize event after state update to let maps know they need to re-calc size
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-mono">
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black z-[100]">
        <div className="flex items-center gap-10">
          <div className="flex items-center">
            <Image 
              src="/logo/datanauts-logo.png" 
              alt="Datanauts Logo" 
              width={140} 
              height={40} 
              className="h-8 w-auto object-contain"
              priority
            />
          </div>

          <nav className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-sm border border-white/5">
            <ViewToggle active={viewMode === 'quad'} onClick={() => setViewMode('quad')} icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Quad" />
            <ViewToggle active={viewMode === 'globe'} onClick={() => setViewMode('globe')} label="3D" />
            <ViewToggle active={viewMode === 'central'} onClick={() => setViewMode('central')} label="Global" />
            <ViewToggle active={viewMode === 'north_pole'} onClick={() => setViewMode('north_pole')} label="NORTH" />
            <ViewToggle active={viewMode === 'south_pole'} onClick={() => setViewMode('south_pole')} label="SOUTH" />
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-40">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <Input 
              placeholder="search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border-white/10 pl-8 h-8 text-[10px] tracking-widest rounded-none"
            />
          </div>
          <button onClick={toggleSidebar} className="p-1.5 border border-white/10 hover:bg-white/5 transition-all">
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {isSidebarOpen && (
          <aside className="w-72 border-r border-white/10 bg-[#0a0a0a] flex flex-col divide-y divide-white/10 z-20">
            <div className="p-4 flex-1 overflow-y-auto">
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4 flex items-center gap-2">
                <Layers className="w-3 h-3" /> LAYERS
              </h3>
              <LayerPanel 
                layers={layers} 
                onToggle={toggleLayer} 
                onOpacityChange={setLayerOpacity} 
              />
            </div>
            <div className="p-4 h-[60%] overflow-y-auto bg-black/40">
              <InfoPanel 
                feature={LUNAR_FEATURES.find(f => f.id === selectedFeatureId) || null} 
                inspectedPoint={inspectedPoint}
                simTime={simTime} 
                onAddPoint={(p) => setEvaluationPoints(prev => [...prev, { ...p, id: Math.random().toString(), color: '#3b82f6' }])} 
                evaluationPoints={evaluationPoints} 
                onRemovePoint={(id) => setEvaluationPoints(prev => prev.filter(p => p.id !== id))} 
              />
            </div>
          </aside>
        )}

        <main className="flex-1 relative bg-black">
          {viewMode === 'quad' ? (
            <div className="grid grid-cols-12 h-full gap-px bg-white/5">
              <div className="col-span-8 h-full bg-black relative border-r border-white/5">
                <GlobeView 
                  features={filteredFeatures} 
                  selectedFeatureId={selectedFeatureId} 
                  onSelectFeature={setSelectedFeatureId} 
                  layers={layers}
                  onInspectPoint={handleInspect}
                  simTime={simTime}
                  onSimTimeChange={setSimTime}
                  simSpeed={simSpeed}
                  onSimSpeedChange={setSimSpeed}
                  isSimActive={isSimActive}
                  onToggleSim={() => setIsSimActive(!isSimActive)}
                />
              </div>
              <div className="col-span-4 grid grid-rows-3 h-full gap-px">
                <div className="relative h-full">
                  <ProjectionView2D key="quad-central-map" mode="central" features={filteredFeatures} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} layers={layers} simTime={simTime} evaluationPoints={evaluationPoints} onInspectPoint={handle2DInspect} isMini />
                  <div className="absolute top-2 left-2 z-[1000] bg-black/60 border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-widest pointer-events-none">Global</div>
                </div>
                <div className="relative h-full">
                  <ProjectionView2D key="quad-north-map" mode="north_pole" features={filteredFeatures} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} layers={layers} simTime={simTime} evaluationPoints={evaluationPoints} onInspectPoint={handle2DInspect} isMini />
                  <div className="absolute top-2 left-2 z-[1000] bg-black/60 border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-widest pointer-events-none">North Pole</div>
                </div>
                <div className="relative h-full">
                  <ProjectionView2D key="quad-south-map" mode="south_pole" features={filteredFeatures} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} layers={layers} simTime={simTime} evaluationPoints={evaluationPoints} onInspectPoint={handle2DInspect} isMini />
                  <div className="absolute top-2 left-2 z-[1000] bg-black/60 border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-widest pointer-events-none">South Pole</div>
                </div>
              </div>
            </div>
          ) : viewMode === 'globe' ? (
            <GlobeView 
              features={filteredFeatures} 
              selectedFeatureId={selectedFeatureId} 
              onSelectFeature={setSelectedFeatureId} 
              layers={layers}
              onInspectPoint={handleInspect}
              simTime={simTime}
              onSimTimeChange={setSimTime}
              simSpeed={simSpeed}
              onSimSpeedChange={setSimSpeed}
              isSimActive={isSimActive}
              onToggleSim={() => setIsSimActive(!isSimActive)}
            />
          ) : (
            <ProjectionView2D key={`single-${viewMode}`} mode={viewMode} features={filteredFeatures} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} layers={layers} simTime={simTime} evaluationPoints={evaluationPoints} onInspectPoint={handle2DInspect} />
          )}
        </main>
      </div>

      <StatusBar 
        selectedPoint={activePoint} 
        viewMode={viewMode} 
        isLoading={isAnyLayerLoading}
      />
    </div>
  );
}

function ViewToggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon?: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-widest transition-all", active ? "bg-white text-black font-bold" : "text-white/30 hover:text-white/50")}>
      {icon} <span>{label}</span>
    </button>
  );
}

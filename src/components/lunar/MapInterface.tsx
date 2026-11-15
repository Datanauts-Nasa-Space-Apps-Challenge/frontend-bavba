'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { MapViewMode, MapLayersConfig, EvaluationPoint } from '@/types/lunar';
import { MASTER_CATALOG } from '@/data/lunar-features';
import { NASA_TREK_LAYERS } from '@/lib/moon-wmts-catalog';
import GlobeView from './GlobeView';
import ProjectionView2D from './ProjectionView2D';
import { LayerPanel, InfoPanel } from './SidebarPanels';
import StatusBar from './StatusBar';
import ComparisonWorkspace from './LandingAnalysis/ComparisonWorkspace';
import { cn } from '@/lib/utils';
import { Menu, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { CelestialPositions, calculateLunarEphemeris } from '@/lib/lunar-ephemeris';
import Image from 'next/image';

const EVAL_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function MapInterface() {
  const [viewMode, setViewMode] = useState<MapViewMode>('quad');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [inspectedPoint, setInspectedPoint] = useState<{ lat: number; lng: number; telemetry: CelestialPositions } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
<<<<<<< HEAD
=======
  // Simulation State
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
  const [simTime, setSimTime] = useState(0);
  const [simSpeed, setSimSpeed] = useState(1);
  const [isSimActive, setIsSimActive] = useState(true);

  const [evaluationPoints, setEvaluationPoints] = useState<EvaluationPoint[]>([]);

  useEffect(() => {
    setSimTime(Date.now());
  }, []);

  const [layers, setLayers] = useState<MapLayersConfig>(() => {
    const initialState: MapLayersConfig = {
<<<<<<< HEAD
      lgrs: { id: 'lgrs', active: true, opacity: 0.4, loading: false, version: 'V2.1', source: 'USGS', category: 'lgrs', blendMode: 'normal' },
      missions: { id: 'missions', active: true, opacity: 1, loading: false, version: 'V1.0', source: 'NAVLUNAR', category: 'imagery', blendMode: 'normal' },
      daynight: { id: 'daynight', active: true, opacity: 0.6, loading: false, version: 'Eph V1', source: 'Engine', category: 'illumination', blendMode: 'screen' },
      suitability: { id: 'suitability', active: false, opacity: 0.8, loading: false, version: 'V1.0', source: 'NavLunar Analysis', category: 'illumination', blendMode: 'normal' }
=======
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
      missions: {
        id: 'missions',
        active: true,
        opacity: 1,
        loading: false,
        version: 'V1.0',
        source: 'NAVLUNAR Archive',
        category: 'imagery',
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
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
    };
    Object.values(NASA_TREK_LAYERS).forEach(layer => {
      initialState[layer.id] = {
        id: layer.id,
        active: layer.defaultVisible,
        opacity: layer.defaultOpacity,
        loading: false,
        version: 'NASA',
        source: 'NASA Trek',
        category: layer.category,
        blendMode: layer.blendMode
      };
    });
    return initialState;
  });

  const filteredFeatures = useMemo(() => {
    if (!searchQuery) return MASTER_CATALOG;
    return MASTER_CATALOG.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.agency && f.agency.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  const activePoint = useMemo(() => {
    if (selectedFeatureId) {
      const f = MASTER_CATALOG.find(f => f.id === selectedFeatureId);
      if (f) return { lat: f.latitude, lng: f.longitude };
    }
    if (inspectedPoint) return { lat: inspectedPoint.lat, lng: inspectedPoint.lng };
    return null;
  }, [selectedFeatureId, inspectedPoint]);

<<<<<<< HEAD
=======
  // Automatic Projection Switching Logic
  const handleRegionChange = useCallback((lat: number, lng: number) => {
    if (viewMode === 'quad') return; 
    
    let targetMode: MapViewMode = viewMode;
    if (lat > 60) targetMode = 'north_pole';
    else if (lat < -60) targetMode = 'south_pole';
    else targetMode = 'central';

    if (targetMode !== viewMode && viewMode !== 'globe' && viewMode !== 'quad') {
      setViewMode(targetMode);
    }
  }, [viewMode]);

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

>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
  const handleInspect = (lat: number, lng: number, telemetry: CelestialPositions) => {
    setInspectedPoint({ lat, lng, telemetry });
    setSelectedFeatureId(null);
    handleRegionChange(lat, lng);
  };

<<<<<<< HEAD
  const handleAddEvalPoint = (point: Omit<EvaluationPoint, 'id' | 'color'>) => {
    if (evaluationPoints.length >= 4) return;
    const newPoint: EvaluationPoint = {
      ...point,
      id: Math.random().toString(36).substr(2, 9),
      color: EVAL_COLORS[evaluationPoints.length]
    };
    setEvaluationPoints(prev => [...prev, newPoint]);
=======
  const handle2DInspect = (lat: number, lng: number) => {
    const telemetry = calculateLunarEphemeris(simTime || Date.now());
    handleInspect(lat, lng, telemetry);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden font-mono">
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-black z-[100] relative">
        <div className="flex-1 flex items-center justify-start">
          <nav className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-sm border border-white/5">
            <ViewToggle active={viewMode === 'quad'} onClick={() => setViewMode('quad')} label="Quad" />
            <ViewToggle active={viewMode === 'globe'} onClick={() => setViewMode('globe')} label="3D" />
            <ViewToggle active={viewMode === 'central'} onClick={() => setViewMode('central')} label="Global" />
            <ViewToggle active={viewMode === 'north_pole'} onClick={() => setViewMode('north_pole')} label="NORTH" />
            <ViewToggle active={viewMode === 'south_pole'} onClick={() => setViewMode('south_pole')} label="SOUTH" />
          </nav>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
<<<<<<< HEAD
          <Image src="/logo/datanauts-logo.png" alt="Datanauts" width={400} height={120} className="h-16 w-auto object-contain" priority />
=======
          <Image 
            src="/logo/datanauts-logo.png" 
            alt="Datanauts Logo" 
            width={400} 
            height={120} 
            className="h-16 w-auto object-contain"
            priority
          />
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
        </div>

        <div className="flex-1 flex items-center justify-end gap-6">
          <div className="flex items-center gap-4">
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
<<<<<<< HEAD
              <Input placeholder="search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white/5 border-white/10 pl-8 h-9 text-[10px] tracking-widest rounded-none" />
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 border border-white/10 hover:bg-white/5 transition-all">
=======
              <Input 
                placeholder="search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 pl-8 h-9 text-[10px] tracking-widest rounded-none"
              />
            </div>
            <button onClick={toggleSidebar} className="p-2 border border-white/10 hover:bg-white/5 transition-all">
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {isSidebarOpen && (
          <aside className="w-80 border-r border-white/10 bg-[#0a0a0a] flex flex-col divide-y divide-white/10 z-20">
            <div className="p-4 h-1/2 overflow-y-auto">
<<<<<<< HEAD
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4">LAYERS</h3>
              <LayerPanel layers={layers} onToggle={(id: string) => setLayers(prev => ({...prev, [id]: {...prev[id], active: !prev[id].active}}))} onOpacityChange={(id: string, val: number) => setLayers(prev => ({...prev, [id]: {...prev[id], opacity: val}}))} />
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-black/40">
              <InfoPanel feature={MASTER_CATALOG.find(f => f.id === selectedFeatureId) || null} inspectedPoint={inspectedPoint} simTime={simTime} onAddPoint={handleAddEvalPoint} evaluationPoints={evaluationPoints} onRemovePoint={(id) => setEvaluationPoints(prev => prev.filter(p => p.id !== id))} onOpenWorkspace={() => setIsWorkspaceOpen(true)} />
=======
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-white/30 mb-4 flex items-center gap-2">
                <Layers className="w-3 h-3" /> LAYERS
              </h3>
              <LayerPanel 
                layers={layers} 
                onToggle={toggleLayer} 
                onOpacityChange={setLayerOpacity} 
              />
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-black/40">
              <InfoPanel 
                feature={MASTER_CATALOG.find(f => f.id === selectedFeatureId) || null} 
                inspectedPoint={inspectedPoint}
                simTime={simTime} 
                onAddPoint={(p) => setEvaluationPoints(prev => [...prev, { ...p, id: Math.random().toString(), color: '#3b82f6' }])} 
                evaluationPoints={evaluationPoints} 
                onRemovePoint={(id) => setEvaluationPoints(prev => prev.filter(p => p.id !== id))} 
              />
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
            </div>
          </aside>
        )}

        <main className="flex-1 relative bg-black">
          {viewMode === 'quad' ? (
            <div className="grid grid-cols-12 h-full gap-px bg-white/5">
              <div className="col-span-8 h-full bg-black relative border-r border-white/5">
                <GlobeView features={filteredFeatures} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} layers={layers} evaluationPoints={evaluationPoints} onInspectPoint={handleInspect} simTime={simTime} onSimTimeChange={setSimTime} simSpeed={simSpeed} onSimSpeedChange={setSimSpeed} isSimActive={isSimActive} onToggleSim={() => setIsSimActive(!isSimActive)} />
              </div>
              <div className="col-span-4 grid grid-rows-3 h-full gap-px">
                {['central', 'north_pole', 'south_pole'].map(m => (
                  <div key={m} className="relative h-full">
                    <ProjectionView2D mode={m as any} features={filteredFeatures} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} layers={layers} evaluationPoints={evaluationPoints} simTime={simTime} onInspectPoint={(lat, lng) => handleInspect(lat, lng, calculateLunarEphemeris(simTime))} isMini />
                    <div className="absolute top-2 left-2 z-[1000] bg-black/60 border border-white/10 px-2 py-0.5 text-[8px] uppercase tracking-widest pointer-events-none">{m.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : viewMode === 'globe' ? (
            <GlobeView features={filteredFeatures} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} layers={layers} evaluationPoints={evaluationPoints} onInspectPoint={handleInspect} simTime={simTime} onSimTimeChange={setSimTime} simSpeed={simSpeed} onSimSpeedChange={setSimSpeed} isSimActive={isSimActive} onToggleSim={() => setIsSimActive(!isSimActive)} />
          ) : (
<<<<<<< HEAD
            <ProjectionView2D mode={viewMode} features={filteredFeatures} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} layers={layers} evaluationPoints={evaluationPoints} simTime={simTime} onInspectPoint={(lat, lng) => handleInspect(lat, lng, calculateLunarEphemeris(simTime))} />
=======
            <ProjectionView2D 
              key={`single-${viewMode}`} 
              mode={viewMode} 
              features={filteredFeatures} 
              selectedFeatureId={selectedFeatureId} 
              onSelectFeature={setSelectedFeatureId} 
              layers={layers} 
              simTime={simTime} 
              evaluationPoints={evaluationPoints} 
              onInspectPoint={handle2DInspect} 
            />
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
          )}

          {isWorkspaceOpen && <ComparisonWorkspace evaluationPoints={evaluationPoints} onRemovePoint={(id) => setEvaluationPoints(prev => prev.filter(p => p.id !== id))} onClose={() => setIsWorkspaceOpen(false)} />}
        </main>
      </div>
      <StatusBar selectedPoint={activePoint} viewMode={viewMode} isLoading={false} />
    </div>
  );
}

function ViewToggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 px-3 py-1.5 text-[9px] uppercase tracking-widest transition-all", active ? "bg-white text-black font-bold" : "text-white/30 hover:text-white/50")}>
      <span>{label}</span>
    </button>
  );
}

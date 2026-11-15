
'use client';

import { useState, useMemo } from 'react';
import { EvaluationPoint, MapLayersConfig } from '@/types/lunar';
import { LUNAR_FEATURES } from '@/data/lunar-features';
import ProjectionView2D from '../ProjectionView2D';
import SiteCard from './SiteCard';
import ComparisonTable from './ComparisonTable';
import { cn } from '@/lib/utils';
import { Layers, ListFilter, Table as TableIcon, LayoutGrid, AlertCircle, Target, BarChart3, TrendingUp, Zap, Clock } from 'lucide-react';

interface ComparisonWorkspaceProps {
  evaluationPoints: EvaluationPoint[];
  onRemovePoint: (id: string) => void;
  onClose: () => void;
}

export default function ComparisonWorkspace({ evaluationPoints, onRemovePoint, onClose }: ComparisonWorkspaceProps) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'grid' | 'table'>('grid');

  const layers: MapLayersConfig = {
    labels: { active: true, opacity: 0.8, loading: false, source: '', version: '' },
    missions: { active: true, opacity: 1, loading: false, source: '', version: '' },
    relief: { active: true, opacity: 0.4, loading: false, source: '', version: '' },
    illumination: { active: true, opacity: 0.6, loading: false, source: '', version: '' },
    psr: { active: true, opacity: 0.6, loading: false, source: '', version: '' },
    daynight: { active: false, opacity: 0.3, loading: false, source: '', version: '' },
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col font-mono text-white animate-in fade-in duration-500">
      <header className="h-16 border-b border-white/10 bg-black flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
             </div>
             <div>
                <h2 className="text-sm font-bold uppercase tracking-[0.25em]">Site Comparison <span className="text-white/20">GIS</span></h2>
                <p className="text-[9px] text-white/40 uppercase tracking-widest">Multi-Site Landing Analysis System</p>
             </div>
          </div>

          <nav className="flex bg-white/5 rounded p-1 ml-8">
             <TabButton active={activeTab === 'grid'} onClick={() => setActiveTab('grid')} icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Profiles" />
             <TabButton active={activeTab === 'table'} onClick={() => setActiveTab('table')} icon={<TableIcon className="w-3.5 h-3.5" />} label="Matrix" />
          </nav>
        </div>

        <div className="flex items-center gap-6">
           <div className="text-[10px] text-white/20 flex gap-6 uppercase tracking-widest font-bold">
              <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> SITES: {evaluationPoints.length}</span>
              <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> DATUM: LUNAR_2000</span>
           </div>
           <button onClick={onClose} className="px-8 py-2 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/90 transition-all">Close Workspace</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-96 border-r border-white/10 bg-[#080808] flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
             <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/30 flex items-center gap-2 mb-6">
                <ListFilter className="w-3.5 h-3.5" /> Candidate Queue
             </h3>
             <div className="grid grid-cols-1 gap-4">
                {evaluationPoints.map(point => (
                  <SiteCard 
                    key={point.id} 
                    point={point} 
                    isHighlighted={highlightedId === point.id}
                    onRemove={onRemovePoint}
                    onHover={setHighlightedId}
                  />
                ))}
                {evaluationPoints.length === 0 && (
                   <div className="py-24 text-center space-y-4 opacity-20">
                      <AlertCircle className="w-8 h-8 mx-auto" />
                      <p className="text-[9px] uppercase leading-relaxed tracking-widest">No candidates in queue.</p>
                   </div>
                )}
             </div>
          </div>
          
          <div className="p-8 bg-blue-500/5 border-t border-white/5">
             <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Suitability Metric
             </h4>
             <p className="text-[9px] text-white/30 leading-relaxed uppercase tracking-widest mb-6">
                Calculated based on slope (&lt;15°), hazard density (&lt;20%), and sun visibility (&gt;70%) within analysis window.
             </p>
             <div className="space-y-4">
                <LegendItem label="Optimal" color="bg-green-500" />
                <LegendItem label="Challenging" color="bg-amber-500" />
                <LegendItem label="Restricted" color="bg-red-500" />
             </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-black relative">
          <div className="h-1/2 border-b border-white/10 relative">
             <ProjectionView2D 
                mode="south_pole"
                features={[]}
                evaluationPoints={evaluationPoints}
                selectedFeatureId={highlightedId}
                onSelectFeature={setHighlightedId}
                layers={layers}
             />
             <div className="absolute top-6 right-6 p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded flex items-center gap-4">
                <Target className="w-4 h-4 text-white/40" />
                <div className="space-y-0.5">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest">Coordinated Observer</h4>
                   <p className="text-[8px] text-white/20 uppercase tracking-widest">South Polar Stereographic · Epoch: J2000</p>
                </div>
             </div>
          </div>

          <div className="flex-1 bg-[#050505] p-8 overflow-hidden">
             {activeTab === 'grid' ? (
                <div className="h-full flex flex-col">
                   <div className="flex items-center gap-3 mb-6">
                      <LayoutGrid className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold uppercase tracking-[0.3em]">Scientific Site Matrices</h3>
                   </div>
                   <div className="grid grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar pr-4">
                      {evaluationPoints.map(point => (
                         <ProfileCard key={point.id} point={point} />
                      ))}
                   </div>
                </div>
             ) : (
                <div className="h-full flex flex-col">
                   <div className="flex items-center gap-3 mb-6">
                      <TableIcon className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold uppercase tracking-[0.3em]">Geodetic Comparison Matrix</h3>
                   </div>
                   <ComparisonTable 
                      points={evaluationPoints} 
                      highlightedId={highlightedId}
                      onHover={setHighlightedId}
                   />
                </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ProfileCard({ point }: { point: EvaluationPoint }) {
  const feature = LUNAR_FEATURES.find(f => f.id === point.siteId);
  const suitability = feature ? Math.max(0, 100 - (feature.slopeMax || 0) - (feature.hazardDensity || 0)) : 75;

  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded hover:bg-white/[0.04] transition-all group">
      <div className="flex justify-between items-start mb-6">
         <div>
            <div className="text-[8px] text-white/20 uppercase tracking-widest mb-1 font-mono">SITE-{point.id.slice(0, 4)}</div>
            <h5 className="font-bold text-sm tracking-tight">{point.name}</h5>
         </div>
         <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs" style={{ color: point.color }}>
            {suitability}%
         </div>
      </div>

      <div className="space-y-4 mb-8">
         <div className="space-y-1.5">
            <div className="flex justify-between text-[8px] uppercase text-white/40">
               <span>Lander Suitability</span>
               <span className="font-mono text-white">{suitability}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${suitability}%` }} />
            </div>
         </div>
         
         <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
            <div className="space-y-1">
               <span className="text-white/20 uppercase block">Sun Vis.</span>
               <span className="text-white">{feature?.sunVisibility || 85}%</span>
            </div>
            <div className="space-y-1">
               <span className="text-white/20 uppercase block">Max Slope</span>
               <span className="text-white">{feature?.slopeMax || 12}°</span>
            </div>
         </div>
      </div>

      <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-[9px] uppercase tracking-widest text-white/40">
         <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> T+{point.timestamp}h</div>
         <div className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> {feature?.elevation || 0}m</div>
      </div>
    </div>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
       <div className={cn("w-2 h-2 rounded-full", color)} />
       <span className="text-[8px] uppercase tracking-[0.2em] text-white/60">{label}</span>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 px-5 py-2 text-[10px] uppercase font-bold tracking-widest transition-all rounded", active ? "bg-blue-500 text-white" : "text-white/40 hover:text-white/60")}>
      {icon} {label}
    </button>
  );
}

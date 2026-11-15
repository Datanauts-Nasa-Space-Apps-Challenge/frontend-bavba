
'use client';

import { useState, useMemo } from 'react';
import { EvaluationPoint } from '@/types/lunar';
import ComparisonTable from './ComparisonTable';
import { cn } from '@/lib/utils';
import { 
  X,
  Maximize2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceDot } from 'recharts';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLocalSolarPosition } from '@/lib/lunar-engine';
import { calculateLunarEphemeris } from '@/lib/lunar-ephemeris';
import { format } from 'date-fns';

interface ComparisonWorkspaceProps {
  evaluationPoints: EvaluationPoint[];
  onRemovePoint: (id: string) => void;
  onClose: () => void;
}

export default function ComparisonWorkspace({ evaluationPoints, onRemovePoint, onClose }: ComparisonWorkspaceProps) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'grid' | 'table'>('grid');

  return (
    <div className="absolute right-6 top-24 bottom-24 w-[520px] z-[2000] bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right-10 duration-500 rounded-md overflow-hidden font-mono">
      {/* Technical Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Terrain Analysis Workspace</h2>
            <p className="text-[8px] text-white/40 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Geodetic Multi-Candidate Comparison
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
           <button className="p-2 hover:bg-white/10 text-white/40 hover:text-white transition-colors rounded-sm"><Maximize2 className="w-3.5 h-3.5" /></button>
           <button onClick={onClose} className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors rounded-sm"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Control Tabs */}
      <div className="flex bg-black/40 border-b border-white/5 p-1.5 gap-1.5">
        <button 
          onClick={() => setActiveTab('grid')}
          className={cn(
            "flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-all rounded-sm",
            activeTab === 'grid' ? "bg-blue-600 text-white shadow-lg" : "text-white/30 hover:bg-white/5"
          )}
        >
          Horizon Profiles
        </button>
        <button 
          onClick={() => setActiveTab('table')}
          className={cn(
            "flex-1 py-2 text-[9px] font-bold uppercase tracking-widest transition-all rounded-sm",
            activeTab === 'table' ? "bg-blue-600 text-white shadow-lg" : "text-white/30 hover:bg-white/5"
          )}
        >
          Matrix Analysis
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-16">
          {evaluationPoints.length === 0 ? (
            <div className="py-32 text-center space-y-6 opacity-20">
              <div className="space-y-2">
                 <p className="text-[10px] font-bold uppercase tracking-[0.3em]">No candidates in analysis queue</p>
                 <p className="text-[8px] uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">Select locations via LGRS, coordinates or catalogue from the Evaluation panel.</p>
              </div>
            </div>
          ) : activeTab === 'grid' ? (
            <div className="space-y-16">
              {evaluationPoints.map(point => (
                <HorizonViewCard 
                  key={point.id} 
                  point={point} 
                  isHighlighted={highlightedId === point.id} 
                />
              ))}
            </div>
          ) : (
            <div className="pb-8">
              <ComparisonTable 
                points={evaluationPoints} 
                highlightedId={highlightedId}
                onHover={setHighlightedId}
              />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Technical Footer */}
      <div className="px-6 py-4 bg-black/60 border-t border-white/10 flex items-center justify-between text-[8px] uppercase tracking-[0.2em] font-bold">
        <div className="flex gap-4">
           <span className="text-blue-500">DATUM: <span className="text-white/60">LUNAR_2000</span></span>
           <span className="text-blue-500">ENGINE: <span className="text-white/60">RAY_TRACING_V2</span></span>
        </div>
        <div className="text-white/20">© NAVLUNAR SCIENTIFIC GIS</div>
      </div>
    </div>
  );
}

function HorizonViewCard({ point, isHighlighted }: { point: EvaluationPoint; isHighlighted?: boolean }) {
  const ephemeris = useMemo(() => calculateLunarEphemeris(point.timestamp), [point.timestamp]);
  const sunPos = useMemo(() => getLocalSolarPosition(point.latitude, point.longitude, ephemeris.subSolarLat, ephemeris.subSolarLon), [point, ephemeris]);

  const chartData = useMemo(() => {
    if (!point.horizon_profile) return [];
    return point.horizon_profile.map((val, idx) => ({
      az: idx,
      elev: val,
    }));
  }, [point.horizon_profile]);

  const maxElev = Math.max(...(point.horizon_profile || [0]));
  const sunIndex = Math.floor(sunPos.azimuth);
  const skylineAtSun = point.horizon_profile ? point.horizon_profile[sunIndex % 360] : 0;
  const isSunVisible = sunPos.elevation > skylineAtSun;

  // Calculate projected hours of light vs shadow
  const illuminationWindow = useMemo(() => {
    const steps = point.horizon; // Interval in hours
    const windowData = [];
    let lightHours = 0;

    for (let i = 0; i < steps; i++) {
      const timeOffset = i * 3600000;
      const futureTime = point.timestamp + timeOffset;
      const futureEph = calculateLunarEphemeris(futureTime);
      const futureSun = getLocalSolarPosition(point.latitude, point.longitude, futureEph.subSolarLat, futureEph.subSolarLon);
      
      const azIdx = Math.floor(futureSun.azimuth) % 360;
      const terrainAtAz = point.horizon_profile ? point.horizon_profile[azIdx] : 0;
      const visible = futureSun.elevation > terrainAtAz;
      
      if (visible) lightHours++;
      windowData.push(visible);
    }

    return { timeline: windowData, lightHours, shadowHours: steps - lightHours };
  }, [point]);

  return (
    <div className={cn(
      "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500",
      isHighlighted && "ring-1 ring-blue-500/30 rounded-lg p-2 bg-blue-500/[0.02]"
    )}>
      {/* Header Info */}
      <div className="flex justify-between items-end border-b border-white/5 pb-2">
         <div>
            <div className="text-[7px] text-blue-500 font-bold uppercase tracking-[0.2em] mb-1">Geodetic Candidate</div>
            <h3 className="text-[12px] font-black text-white uppercase tracking-tight">
               {point.name} • {point.latitude.toFixed(4)}°, {point.longitude.toFixed(4)}°
            </h3>
         </div>
         <div className="text-[9px] text-white/40 font-mono flex flex-col items-end">
            <span>EPOCH: {format(new Date(point.timestamp), 'yyyy-MM-dd HH:mm')} UTC</span>
            <span className="text-[7px] text-blue-400 font-bold">INTERVAL: {point.horizon}H WINDOW</span>
         </div>
      </div>

      {/* Main Profile Chart */}
      <div className="h-48 w-full bg-black/40 border border-white/10 rounded-sm relative group/chart">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 30, right: 0, left: 0, bottom: 0 }}>
               <defs>
                  <linearGradient id={`glow-${point.id}`} x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stopColor={point.color} stopOpacity={0.4}/>
                     <stop offset="100%" stopColor={point.color} stopOpacity={0.02}/>
                  </linearGradient>
               </defs>
               <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={true} horizontal={false} />
               <XAxis 
                  dataKey="az" 
                  type="number"
                  domain={[0, 359]}
                  ticks={[0, 90, 180, 270]}
                  tickFormatter={(val) => {
                    if (val === 0) return 'N';
                    if (val === 90) return 'E';
                    if (val === 180) return 'S';
                    if (val === 270) return 'W';
                    return `${val}°`;
                  }}
                  axisLine={false}
                  tickLine={true}
                  tick={{ fontSize: 8, fontWeight: 'bold', fill: 'rgba(255,255,255,0.3)' }}
                  height={20}
               />
               <YAxis hide domain={[-5, 45]} />
               
               <Area 
                  type="monotone" 
                  dataKey="elev" 
                  stroke={point.color} 
                  fill={`url(#glow-${point.id})`} 
                  strokeWidth={1.5}
                  isAnimationActive={false}
                  dot={false}
               />

               <ReferenceDot 
                  x={sunPos.azimuth} 
                  y={sunPos.elevation} 
                  r={isSunVisible ? 5 : 4} 
                  fill={isSunVisible ? "#fbbf24" : "rgba(251, 191, 36, 0.15)"}
                  stroke={isSunVisible ? "#fbbf24" : "rgba(251, 191, 36, 0.3)"}
                  strokeWidth={1}
                  strokeDasharray={isSunVisible ? "" : "2 2"}
               />
            </AreaChart>
         </ResponsiveContainer>

         {/* Overlay Labels */}
         <div className="absolute top-3 left-3 flex flex-col gap-1 text-[7px] uppercase tracking-widest font-bold">
            <div className="flex items-center gap-2 text-white/40">
               <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: point.color }} />
               Skyline Elevation
            </div>
            <div className="flex items-center gap-2">
               <div className={cn("w-1.5 h-1.5 rounded-full", isSunVisible ? "bg-[#fbbf24] shadow-[0_0_5px_#fbbf24]" : "bg-blue-900 border border-white/20")} />
               <span className={isSunVisible ? "text-yellow-500" : "text-blue-500"}>Sun: {sunPos.elevation.toFixed(1)}°</span>
            </div>
         </div>
      </div>

      {/* Projected Illumination Window */}
      <div className="space-y-3 p-4 bg-white/[0.02] border border-white/5 rounded-sm">
         <div className="flex justify-between items-center mb-1">
            <h4 className="text-[8px] font-black uppercase tracking-[0.25em] text-white/40 flex items-center gap-2">
               {point.horizon}H Illumination Projection
            </h4>
            <div className="flex gap-3 text-[8px] font-bold">
               <span className="text-yellow-500">{illuminationWindow.lightHours}H LIGHT</span>
               <span className="text-blue-400">{illuminationWindow.shadowHours}H SHADOW</span>
            </div>
         </div>
         
         <div className="flex h-3 w-full gap-0.5 rounded-full overflow-hidden bg-black/40 border border-white/5 p-0.5">
            {illuminationWindow.timeline.map((isLight, idx) => (
               <div 
                  key={idx} 
                  className={cn(
                     "flex-1 h-full rounded-[1px] transition-all",
                     isLight ? "bg-yellow-500" : "bg-blue-900/40"
                  )}
                  title={`Hour ${idx + 1}: ${isLight ? 'Light' : 'Shadow'}`}
               />
            ))}
         </div>

         <div className="flex justify-between text-[6px] text-white/20 uppercase font-black tracking-widest px-1">
            <span>T +0h</span>
            <span>T +{Math.floor(point.horizon / 2)}h</span>
            <span>T +{point.horizon}h</span>
         </div>
      </div>

      {/* Analysis Conclusion */}
      <div className="space-y-2 border-t border-white/5 pt-4">
         <p className="text-[10px] leading-relaxed text-white/80">
            Analysis for epoch <span className="font-bold text-blue-400">{format(new Date(point.timestamp), 'yyyy-MM-dd')}</span>. 
            The Sun is <span className={cn("font-black", isSunVisible ? "text-yellow-500" : "text-blue-500")}>{sunPos.elevation.toFixed(1)}°</span> above the horizon 
            {isSunVisible 
              ? " and is VISIBLE from the site." 
              : ` but OCCLUDED by terrain peaks rising to ${skylineAtSun.toFixed(1)}°.`}
         </p>
         <div className="text-[7px] text-white/20 leading-normal uppercase tracking-widest flex justify-between items-center">
            <span>Terrain Sampling: ~160m res</span>
            <span>Duration: {point.horizon} Hours Analysis</span>
         </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useMemo } from 'react';
import { LunarFeature, EvaluationPoint, MapLayersConfig } from '@/types/lunar';
import { LayerCategory, NASA_TREK_LAYERS } from '@/lib/moon-wmts-catalog';
import { MASTER_CATALOG } from '@/data/lunar-features';
import { cn } from '@/lib/utils';
import { 
  Plus,
  Eye,
  EyeOff,
  HelpCircle,
  Trash2,
<<<<<<< HEAD
  AlertTriangle
=======
  Database,
  History,
  Info
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
} from 'lucide-react';
import { getLGRSCode, decodeLGRS } from '@/lib/lgrs';
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { calculateSolarElevation, getHorizonProfile } from '@/lib/lunar-engine';
import { CelestialPositions } from '@/lib/lunar-ephemeris';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Select as UISelect,
  SelectContent as UISelectContent,
  SelectItem as UISelectItem,
  SelectTrigger as UISelectTrigger,
  SelectValue as UISelectValue,
} from "@/components/ui/select";

interface InfoPanelProps {
  feature: LunarFeature | null;
  inspectedPoint?: { lat: number; lng: number; telemetry: CelestialPositions } | null;
  simTime: number;
  onAddPoint: (point: Omit<EvaluationPoint, 'id' | 'color'>) => void;
  evaluationPoints: EvaluationPoint[];
  onRemovePoint: (id: string) => void;
  onOpenWorkspace: () => void;
}

const GLOSSARY = {
  lgrs: "Lunar Grid Reference System: An indexing system for the lunar surface based on GZD sectors and latitude bands.",
  psr: "Permanently Shadowed Region: Areas near the poles that never receive sunlight, potentially containing volatiles like water ice.",
  elevation: "Height relative to the lunar mean radius (1737.4 km). Negative values indicate basins or craters.",
  slope: "Terrain incline. Slopes >15° are generally considered hazardous for soft landings.",
  sun: "Solar elevation angle. High values indicate optimal conditions for solar power generation.",
  epoch: "Simulation time offset relative to J2000.0 epoch.",
  horizon: "The time duration (in hours) to project illumination conditions into the future."
};

export function InfoPanel({ 
  feature, 
  inspectedPoint, 
  simTime, 
  onAddPoint, 
  evaluationPoints, 
  onRemovePoint,
  onOpenWorkspace 
}: InfoPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'evaluate' | 'inspector'>('info');
  
  const [evalTimeOffset, setEvalTimeOffset] = useState(0); 
  const [evalHorizon, setEvalHorizon] = useState(24);
  const [manualLgrs, setManualLgrs] = useState("");

  const southPoleSites = useMemo(() => 
    MASTER_CATALOG.filter(f => f.latitude < -80)
  , []);

  const currentEvalTimestamp = useMemo(() => {
    return simTime + (evalTimeOffset * 3600000);
  }, [simTime, evalTimeOffset]);

  const handleAddEvaluation = (type: 'feature' | 'lgrs' | 'inspected' | 'catalog', id?: string) => {
    if (evaluationPoints.length >= 4) return;

    let name = "Manual Point";
    let lat = 0, lng = 0;
    let siteId: string | undefined;

    if (type === 'catalog' && id) {
      const site = MASTER_CATALOG.find(s => s.id === id);
      if (!site) return;
      name = site.name;
      lat = site.latitude;
      lng = site.longitude;
      siteId = site.id;
    } else if (type === 'feature' && feature) {
      name = feature.name;
      lat = feature.latitude;
      lng = feature.longitude;
      siteId = feature.id;
    } else if (type === 'inspected' && inspectedPoint) {
      name = `Point ${inspectedPoint.lat.toFixed(2)}, ${inspectedPoint.lng.toFixed(2)}`;
      lat = inspectedPoint.lat;
      lng = inspectedPoint.lng;
    } else if (type === 'lgrs' && manualLgrs) {
      const decoded = decodeLGRS(manualLgrs);
      if (!decoded) return;
      name = `Grid ${manualLgrs}`;
      lat = decoded.lat;
      lng = decoded.lng;
    } else {
      return;
    }

    onAddPoint({
      name: `${name} (T+${evalTimeOffset}h)`,
      latitude: lat,
      longitude: lng,
      timestamp: currentEvalTimestamp,
      horizon: evalHorizon,
      siteId,
      horizon_profile: getHorizonProfile(lat, lng, siteId)
    });
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-mono">
      <div className="flex bg-white/5 p-1 rounded-none mb-6">
        <button 
          onClick={() => setActiveTab('info')}
          className={cn("flex-1 py-2 text-[9px] uppercase font-bold tracking-[0.1em] transition-all", activeTab === 'info' ? "bg-white/10 text-white" : "text-white/30")}
        >DATA</button>
        <button 
          onClick={() => setActiveTab('inspector')}
          className={cn("flex-1 py-2 text-[9px] uppercase font-bold tracking-[0.1em] transition-all", activeTab === 'inspector' ? "bg-white/10 text-white" : "text-white/30")}
        >INSPECT</button>
        <button 
          onClick={() => setActiveTab('evaluate')}
          className={cn("flex-1 py-2 text-[9px] uppercase font-bold tracking-[0.1em] transition-all", activeTab === 'evaluate' ? "bg-white/10 text-white" : "text-white/30")}
        >EVAL</button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {activeTab === 'info' ? (
<<<<<<< HEAD
          feature ? <FeatureDetails feature={feature} /> : <NoSelection message="SELECT A SITE ON THE MAP" />
=======
          feature ? <FeatureDetails feature={feature} /> : <NoSelection message="SELECT A SITE ON THE MAP" icon={<Database className="w-8 h-8" />} />
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
        ) : activeTab === 'inspector' ? (
          inspectedPoint ? (
            <SurfaceInspector 
              point={inspectedPoint} 
              onAdd={() => handleAddEvaluation('inspected')} 
              disabled={evaluationPoints.length >= 4}
            />
          ) : (
            <NoSelection message="CLICK GLOBE TO INSPECT" icon={<Info className="w-8 h-8" />} />
          )
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            <section className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Analysis Constraints</h4>
                <GlossaryBtn term={GLOSSARY.epoch} />
              </div>
              <div className="space-y-8 p-4 bg-white/[0.02] border border-white/5">
                <div className="space-y-4">
                  <div className="flex justify-between text-[9px] uppercase font-mono">
                    <span>Start Offset</span>
                    <span className="text-blue-400">T+{evalTimeOffset}h</span>
                  </div>
                  <Slider 
                    value={[evalTimeOffset]} 
                    onValueChange={v => setEvalTimeOffset(v[0])} 
                    max={4320} 
                    min={0}
                    step={1} 
                  />
                  <div className="text-[7px] text-white/20 uppercase tracking-widest">Calculated from simulation epoch</div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-[9px] uppercase font-mono">
                    <span>Projection Window</span>
                    <span className="text-yellow-500">{evalHorizon} Hours</span>
                  </div>
                  <Slider 
                    value={[evalHorizon]} 
                    onValueChange={v => setEvalHorizon(v[0])} 
                    max={336} 
                    min={1}
                    step={1} 
                  />
                  <div className="text-[7px] text-white/20 uppercase tracking-widest">Duration of illumination analysis</div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 border-b border-white/5 pb-2">Candidate Selection</h4>
              
              <div className="space-y-3">
                 <div className="text-[8px] text-white/20 uppercase tracking-widest font-bold">South Pole Catalog</div>
                 <UISelect onValueChange={(val) => handleAddEvaluation('catalog', val)} disabled={evaluationPoints.length >= 4}>
                    <UISelectTrigger className="bg-white/5 border-white/10 text-[10px] uppercase font-mono h-11 rounded-none">
                       <UISelectValue placeholder="Select from SP list..." />
                    </UISelectTrigger>
                    <UISelectContent className="bg-[#111] border-white/10 text-white font-mono">
                       {southPoleSites.map(s => (
                          <UISelectItem key={`${s.id}-${evalTimeOffset}`} value={s.id} className="text-[10px] uppercase">{s.name}</UISelectItem>
                       ))}
                    </UISelectContent>
                 </UISelect>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Manual LGRS Input</div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="LGRS ID..." 
                    value={manualLgrs}
                    onChange={e => setManualLgrs(e.target.value)}
                    className="bg-white/5 border-white/10 text-[10px] uppercase font-mono h-11 rounded-none"
                    disabled={evaluationPoints.length >= 4}
                  />
                  <Button 
                    onClick={() => handleAddEvaluation('lgrs')} 
                    className="h-11 bg-white/10 hover:bg-white/20 rounded-none shrink-0"
                    disabled={evaluationPoints.length >= 4 || !manualLgrs}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-[7px] text-white/20 italic">Add multiple instances of the same site to compare different timestamps.</p>
            </section>

            {evaluationPoints.length > 0 && (
              <section className="space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Evaluation Queue</h4>
                   <span className="text-[9px] text-blue-400 font-bold">{evaluationPoints.length}/4</span>
                </div>
                <div className="space-y-2">
                  {evaluationPoints.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 group">
                      <div className="truncate pr-2">
                        <div className="text-[10px] font-bold text-white truncate uppercase">{p.name}</div>
                        <div className="flex items-center gap-2 text-[7px] text-white/30 uppercase font-mono">
                           <span>{getLGRSCode(p.latitude, p.longitude).code}</span>
                           <span>•</span>
                           <span className="text-yellow-500/50">{p.horizon}H Projection</span>
                        </div>
                      </div>
                      <button onClick={() => onRemovePoint(p.id)} className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={onOpenWorkspace}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-none font-bold uppercase tracking-[0.2em] text-[10px] mt-6 shadow-xl"
                >
                  Run Landing Analysis
                </Button>
              </section>
            )}

            {evaluationPoints.length >= 4 && (
               <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-[9px] text-amber-500 uppercase leading-relaxed font-bold">
                    Queue capacity reached. Remove candidates to add new locations.
                  </p>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SurfaceInspector({ point, onAdd, disabled }: { point: { lat: number; lng: number; telemetry: CelestialPositions }; onAdd: () => void; disabled: boolean }) {
  const lgrs = getLGRSCode(point.lat, point.lng);
  const solarElev = calculateSolarElevation(point.lat, point.telemetry.subSolarLat, point.lng, point.telemetry.subSolarLon);
  const isDay = solarElev > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-white uppercase">Surface Point</h2>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onAdd} 
            disabled={disabled}
            className="h-7 text-[8px] uppercase tracking-widest border-blue-500/30 text-blue-400"
          >
             {disabled ? 'Queue Full' : 'Add to Queue'}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/10">
          <MetricBox label="LAT" value={`${point.lat.toFixed(6)}°`} />
          <MetricBox label="LON" value={`${point.lng.toFixed(6)}°`} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-1">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Solar Conditions</h4>
          <GlossaryBtn term={GLOSSARY.sun} />
        </div>
        <div className="p-4 bg-white/[0.02] border border-white/5 flex items-center justify-between">
           <div className="space-y-1">
              <div className="text-[12px] font-bold text-white uppercase">{isDay ? 'Sunlit' : 'Shadow'}</div>
              <div className="text-[9px] text-white/30 uppercase tracking-widest">Elevation: {solarElev.toFixed(2)}°</div>
           </div>
           <div className={cn("w-3 h-3 rounded-full", isDay ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" : "bg-blue-900 border border-white/10")} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-1">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">LGRS Hierarchy</h4>
          <GlossaryBtn term={GLOSSARY.lgrs} />
        </div>
        <div className="space-y-1">
          <HierarchyItem level="L1" label="Zone GZD" value={lgrs.band + '-' + lgrs.sector} />
          <HierarchyItem level="L2" label="100km SQ" value={lgrs.code.split('-').slice(0,3).join('-')} />
          <HierarchyItem level="L4" label="100m Precision" value={lgrs.code} highlight />
        </div>
      </section>
    </div>
  );
}

function HierarchyItem({ level, label, value, highlight }: { level: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/5 text-[9px] font-mono">
      <div className="flex items-center gap-3">
         <span className="text-[8px] font-bold text-white/20">{level}</span>
         <span className="text-white/40 uppercase tracking-widest">{label}</span>
      </div>
      <span className={cn("font-bold", highlight ? "text-blue-400" : "text-white")}>{value}</span>
    </div>
  );
}

function FeatureDetails({ feature }: { feature: LunarFeature }) {
  const lgrs = getLGRSCode(feature.latitude, feature.longitude);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <span className={cn(
            "px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] border",
            feature.status === 'completed' ? "bg-green-500/10 border-green-500/30 text-green-500" :
            feature.status === 'planned' ? "bg-blue-500/10 border-blue-500/30 text-blue-500" :
            feature.status === 'partial' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
            "bg-white/5 border-white/10 text-white/50"
          )}>
            {feature.status}
          </span>
          <div className="text-[10px] text-white/40 flex items-center gap-2">
<<<<<<< HEAD
=======
            <History className="w-3 h-3" />
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
            {feature.agency || 'UNKNOWN'}
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-tight">{feature.name}</h2>
        <p className="text-[11px] text-white/60 leading-relaxed uppercase tracking-tight">
          {feature.description}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-px bg-white/5 border border-white/10">
        <MetricBox label="LATITUDE" value={`${feature.latitude.toFixed(6)}°`} />
        <MetricBox label="LONGITUDE" value={`${feature.longitude.toFixed(6)}°`} />
        <MetricBox label="AGENCY" value={feature.agency || 'N/A'} />
        <MetricBox label="LGRS REF" value={feature.cell_id || lgrs.code} highlight help={GLOSSARY.lgrs} />
      </section>
      
      {feature.horizon_profile && (
<<<<<<< HEAD
        <section className="space-y-3">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 border-b border-white/5 pb-1">Horizon Elevation Profile</h4>
           <div className="h-16 flex items-end gap-px bg-white/5 p-2 border border-white/10 group relative">
              {feature.horizon_profile.slice(0, 180).map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-blue-500/40 hover:bg-blue-400 transition-colors" 
                  style={{ height: `${Math.max(2, (h / 45) * 100)}%` }}
                />
              ))}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 pointer-events-none">
                 <span className="text-[8px] uppercase tracking-widest font-bold">360° Visibility Analysis</span>
              </div>
           </div>
           <div className="flex justify-between text-[7px] text-white/20 uppercase font-mono">
              <span>0° (N)</span>
              <span>180° (S)</span>
              <span>359°</span>
           </div>
=======
        <section className="space-y-2">
           <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Horizon Elevation Profile</h4>
           <div className="h-16 flex items-end gap-px bg-white/5 p-2 border border-white/10">
              {feature.horizon_profile.slice(0, 180).map((h, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-blue-500/40" 
                  style={{ height: `${(h / 90) * 100}%` }}
                />
              ))}
           </div>
           <p className="text-[8px] text-center text-white/20">360° Panoramic Obstruction Analysis</p>
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
        </section>
      )}
    </div>
  );
}

function MetricBox({ label, value, highlight, help }: { label: string; value: string; highlight?: boolean; help?: string }) {
  return (
    <div className="p-4 bg-black flex flex-col gap-1 relative group">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">{label}</span>
        {help && <GlossaryBtn term={help} />}
      </div>
      <span className={cn("text-[11px] font-mono font-bold truncate", highlight ? "text-blue-400" : "text-white/80")}>
        {value}
      </span>
    </div>
  );
}

function NoSelection({ message, icon }: { message: string, icon?: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-20 border border-dashed border-white/10">
      {icon && <div className="mb-4">{icon}</div>}
      <p className="text-[10px] uppercase tracking-[0.3em] leading-loose">
        {message}
      </p>
    </div>
  );
}

export function LayerPanel({ layers, onToggle, onOpacityChange }: any) {
  const categories: { label: string; key: LayerCategory; help: string }[] = [
    { label: 'LGRS Grid System', key: 'lgrs', help: "Cartographic indexing grid based on the Lunar Grid Reference System V2.1." },
    { label: 'Imagery Mosaics', key: 'imagery', help: "Visible spectrum imagery from LRO Wide Angle Camera (WAC) providing global context." },
    { label: 'Topography & Relief', key: 'topography', help: "Elevation maps and shaded relief derived from LOLA laser altimetry data." },
    { label: 'Illumination & PSR', key: 'illumination', help: "Solar visibility analysis and identification of Permanently Shadowed Regions (PSRs)." },
    { label: 'Resources', key: 'resources', help: "Distribution maps of chemical abundances (FeO, TiO2) and potential volatiles." },
  ];

  return (
    <Accordion type="multiple" className="w-full">
      {categories.map((cat) => {
        const catLayers = Object.values(layers).filter((l: any) => l.category === cat.key);
        if (catLayers.length === 0) return null;

        return (
          <AccordionItem key={cat.key} value={cat.key} className="border-white/10">
            <AccordionTrigger className="hover:no-underline py-3 px-2">
              <div className="flex items-center justify-between w-full pr-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{cat.label}</span>
                <GlossaryBtn term={cat.help} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-4 space-y-2">
              {catLayers.map((l: any) => (
                <LayerItem 
                  key={l.id} 
                  layer={l} 
                  onToggle={onToggle} 
                  onOpacityChange={onOpacityChange}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function LayerItem({ layer, onToggle, onOpacityChange }: any) {
  const nasaInfo = NASA_TREK_LAYERS[layer.id];

  return (
    <div className={cn(
      "p-3 bg-white/[0.02] border border-white/5 rounded-sm transition-all group",
      layer.active ? "border-white/20" : "opacity-60"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={() => onToggle(layer.id)}
            className="shrink-0 text-white/40 hover:text-white transition-colors"
          >
            {layer.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <div className="truncate">
            <div className="text-[9px] font-bold uppercase tracking-wider text-white truncate">
              {nasaInfo?.name || layer.id}
            </div>
          </div>
        </div>
        {nasaInfo?.description && <GlossaryBtn term={nasaInfo.description} />}
      </div>

      {layer.active && (
        <div className="space-y-4 pt-2 border-t border-white/5 animate-in fade-in duration-300">
          <div className="space-y-2">
            <div className="flex justify-between text-[8px] uppercase font-bold text-white/20">
               <span>Opacity</span>
               <span className="text-white/60">{Math.round(layer.opacity * 100)}%</span>
            </div>
            <Slider 
              value={[layer.opacity]} 
              onValueChange={v => onOpacityChange(layer.id, v[0])} 
              max={1} 
              step={0.05} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GlossaryBtn({ term }: { term: string }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className="text-white/10 hover:text-blue-400 transition-colors cursor-help p-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <HelpCircle className="w-3 h-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black/90 border-white/10 text-[10px] text-white/80 p-3 max-w-[200px] leading-relaxed rounded-none backdrop-blur-md">
          {term}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

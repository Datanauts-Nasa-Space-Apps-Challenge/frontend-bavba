'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { parseLgrsCell, getNeighborCells, BANDS } from '@/lib/lgrs';
import { getCellScientificData } from '@/lib/lgrs-cell-service';
import dynamic from 'next/dynamic';
import { calculateLunarEphemeris } from '@/lib/lunar-ephemeris';
import { calculateSolarElevation } from '@/lib/lunar-engine';
import { 
  ChevronLeft, 
  Map as MapIcon, 
  Layers, 
  Info, 
  Database, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  Box, 
  Globe, 
  Sun, 
  TrendingUp, 
  History 
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapLayersConfig } from '@/types/lunar';

const CellDetailMap = dynamic(() => import('@/components/lunar/CellDetailMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-black/40 flex items-center justify-center font-mono text-[10px] animate-pulse">INITIATING MAP RENDER...</div>
});

export default function LgrsCellPage() {
  const params = useParams();
  const router = useRouter();
  const cellId = params.cellId as string;
  
  const cell = useMemo(() => parseLgrsCell(cellId), [cellId]);
  const neighbors = useMemo(() => getNeighborCells(cellId), [cellId]);

  const [simTime, setSimTime] = useState(0);
  const [layers, setLayers] = useState<MapLayersConfig>({
    lgrs: { id: 'lgrs', active: true, opacity: 0.8, loading: false, source: '', version: '', category: 'lgrs', blendMode: 'normal' },
    missions: { id: 'missions', active: true, opacity: 1, loading: false, source: '', version: '', category: 'imagery', blendMode: 'normal' },
    relief: { id: 'relief', active: false, opacity: 0.6, loading: false, source: '', version: '', category: 'topography', blendMode: 'normal' },
    daynight: { id: 'daynight', active: true, opacity: 0.4, loading: false, source: '', version: '', category: 'illumination', blendMode: 'normal' }
  });

  useEffect(() => {
    setSimTime(Date.now());
  }, []);

  const scientificData = useMemo(() => {
    if (!cell) return null;
    return getCellScientificData(cell.centerLat, cell.centerLng, cell.latMin, cell.latMax, cell.lngMin, cell.lngMax);
  }, [cell]);

  const ephemeris = useMemo(() => calculateLunarEphemeris(simTime), [simTime]);
  const solarElev = cell ? calculateSolarElevation(cell.centerLat, ephemeris.subSolarLat, cell.centerLng, ephemeris.subSolarLon) : 0;

  if (!cell) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">INVALID CELL COORDINATES</h1>
        <p className="text-white/40 max-w-md uppercase tracking-widest text-xs leading-loose">
          The requested LGRS reference or sector code could not be resolved by the current geodetic engine.
        </p>
        <Button onClick={() => router.push('/')} variant="outline" className="rounded-none border-white/20 uppercase tracking-[0.2em] h-12 px-10">Return to Global Map</Button>
      </div>
    );
  }

  const bandInfo = BANDS.find(b => b.code === cell.band);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-blue-400/30">
      <main className="container mx-auto px-6 max-w-7xl py-12">
        <nav className="flex items-center gap-4 mb-12 text-[10px] uppercase tracking-widest text-white/30">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-2 font-bold"><Globe className="w-3 h-3" /> Global View</Link>
          <span>/</span>
          <span className="text-white/60">Cell Explorer</span>
          <span>/</span>
          <span className="text-blue-400 font-bold">{cellId}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <header className="space-y-6">
              <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-7xl font-bold tracking-tighter text-white mb-2">{cellId}</h1>
                    <div className="flex gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                      <span>LGRS INDEX: {cell.sector}-{cell.band}</span>
                      <span>•</span>
                      <span>RESOLUTION: 25KM BASE</span>
                    </div>
                 </div>
                 <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg text-center min-w-[200px]">
                    <div className="text-[10px] text-white/20 uppercase tracking-widest mb-1.5">Surface Elevation</div>
                    <div className="text-3xl font-black">--- m</div>
                    <div className="text-[9px] text-blue-400/40 mt-1.5">LOLA_V06_PROCESSED</div>
                 </div>
              </div>
            </header>

            <section className="relative h-[500px] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              <CellDetailMap 
                cell={cell} 
                layers={layers} 
                simTime={simTime}
                missions={scientificData?.missions || []}
              />
              <div className="absolute top-6 left-6 z-[1000] space-y-2 pointer-events-none">
                 <div className="pointer-events-auto bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded text-[10px] flex items-center gap-3">
                    <MapIcon className="w-4 h-4 text-blue-400" />
                    <span className="uppercase tracking-widest font-bold">Local Proj: {cell.centerLat > 60 ? 'NP' : cell.centerLat < -60 ? 'SP' : 'EQ'}</span>
                 </div>
              </div>

              <div className="absolute bottom-6 left-6 z-[1000] pointer-events-auto">
                 <div className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 text-[9px] uppercase tracking-widest text-white/40 font-bold">
                    NASA LOLA TOPOGRAPHY · IAU SURFACE FEATURES · LRO SENSORS
                 </div>
              </div>
            </section>

            <Tabs defaultValue="features" className="w-full">
              <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none h-auto p-0 mb-8 overflow-x-auto custom-scrollbar">
                <TabsTrigger value="features" className="px-8 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] text-white/40">Named Features ({scientificData?.features.length})</TabsTrigger>
                <TabsTrigger value="missions" className="px-8 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] text-white/40">Missions Near Cell</TabsTrigger>
                <TabsTrigger value="scientific" className="px-8 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] text-white/40">Solar & Topo Data</TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="animate-in fade-in duration-500">
                {scientificData && scientificData.features.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scientificData.features.map(f => (
                      <div key={f.id} className="bg-white/[0.02] border border-white/5 p-6 hover:bg-white/[0.04] transition-all group">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <h3 className="font-bold text-lg mb-0.5 group-hover:text-blue-400 transition-colors">{f.name}</h3>
                               <h3 className="text-[10px] uppercase tracking-widest text-white/40">{f.type} • {f.diameter ? `${f.diameter}km dia` : 'IAU Ref'}</h3>
                            </div>
                            <Button size="icon" variant="ghost" className="opacity-20 group-hover:opacity-100 transition-opacity">
                               <Info className="w-4 h-4" />
                            </Button>
                         </div>
                         <div className="flex justify-between items-end border-t border-white/5 pt-4">
                            <div className="text-[10px] font-mono text-white/20">
                               {f.latitude.toFixed(4)}°N<br/>{f.longitude.toFixed(4)}°E
                            </div>
                            <div className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest">
                               {f.distance.toFixed(1)} km from center
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-20 border border-dashed border-white/10 flex flex-col items-center gap-4">
                     <Database className="w-10 h-10" />
                     <p className="text-[10px] uppercase tracking-widest">No named IAU features cataloged in this cell</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="missions" className="animate-in fade-in duration-500">
                <div className="space-y-4">
                  {scientificData?.missions.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-all">
                       <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                             <History className="w-6 h-6 text-white/20 group-hover:text-blue-400 transition-colors" />
                          </div>
                          <div>
                             <h4 className="font-bold text-md">{m.name}</h4>
                             <p className="text-[10px] uppercase tracking-widest text-white/40">{m.agency} • {m.year} • {m.type}</p>
                          </div>
                       </div>
                       <div className="text-right space-y-1">
                          <div className="text-xs font-bold text-white uppercase">{m.distance.toFixed(2)} KM</div>
                          <div className="text-[9px] text-white/20 uppercase tracking-widest font-mono">D_CEL_CTR</div>
                       </div>
                    </div>
                  ))}
                  {scientificData?.missions.length === 0 && (
                    <div className="py-20 text-center border border-dashed border-white/10 opacity-20 uppercase tracking-widest text-[10px]">
                      No surface missions in sector {cellId}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="scientific" className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="bg-transparent border-white/10 rounded-xl overflow-hidden">
                    <CardHeader className="bg-white/[0.02] border-b border-white/10">
                       <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold flex items-center gap-2"><Sun className="w-4 h-4" /> Solar Incidence</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] text-white/40 uppercase tracking-widest">Solar Elevation</span>
                          <span className={`${solarElev > 0 ? 'text-green-500' : 'text-blue-500'} font-black text-xl`}>{solarElev.toFixed(2)}°</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[11px] text-white/40 uppercase tracking-widest">Illumination State</span>
                          <span className="font-bold uppercase tracking-widest text-sm">{solarElev > 0 ? 'Daylight' : 'PSR / Night'}</span>
                       </div>
                       <div className="h-px bg-white/5" />
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-white/20 uppercase">
                             <span>Subsolar Latitude</span>
                             <span>{ephemeris.subSolarLat.toFixed(2)}°N</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-white/20 uppercase">
                             <span>Subsolar Longitude</span>
                             <span>{ephemeris.subSolarLon.toFixed(2)}°E</span>
                          </div>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="bg-transparent border-white/10 rounded-xl overflow-hidden">
                    <CardHeader className="bg-white/[0.02] border-b border-white/10">
                       <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Topographic Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                       <div className="p-6 bg-white/5 text-center border border-white/5">
                          <p className="text-[10px] text-white/40 uppercase tracking-widest leading-loose">
                             Scientific altimetry processing requires deep LOLA data tile fetching. Current cell relief metrics are undergoing reconstruction.
                          </p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-white/[0.02] border border-white/5 space-y-1">
                             <span className="text-[8px] text-white/20 uppercase">Max Slope</span>
                             <div className="font-bold text-sm">-- °</div>
                          </div>
                          <div className="p-4 bg-white/[0.02] border border-white/5 space-y-1">
                             <span className="text-[8px] text-white/20 uppercase">Roughness</span>
                             <div className="font-bold text-sm">--</div>
                          </div>
                       </div>
                    </CardContent>
                 </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 space-y-12">
            <aside className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden shadow-xl sticky top-24">
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                 <h2 className="text-xs font-black uppercase tracking-[0.4em] text-blue-400">Reference</h2>
                 <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-white/10 text-white/40">V2.1</Badge>
              </div>
              
              <div className="divide-y divide-white/5">
                 <RefDetail label="Cell Code" value={cellId} highlight />
                 <RefDetail label="Center" value={`${cell.centerLat.toFixed(4)}°N, ${cell.centerLng.toFixed(4)}°E`} />
                 <RefDetail label="Span" value={`${(cell.latMax - cell.latMin).toFixed(2)}° LAT × ${(cell.lngMax - cell.lngMin).toFixed(2)}° LNG`} />
                 <RefDetail label="Band Code" value={cell.band} subValue={bandInfo?.label} />
                 <RefDetail label="Sector" value={cell.sector} subValue="15° Wide Longitudinal" />
                 <RefDetail label="Projection" value={cell.centerLat > 60 ? 'North Polar' : cell.centerLat < -60 ? 'South Polar' : 'Equidistant Cylindrical'} />
              </div>

              <div className="p-8 bg-blue-500/5">
                 <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30 mb-6 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Sector Adjacency
                 </h3>
                 <div className="grid grid-cols-3 gap-2">
                    <div />
                    <NeighborBtn label="NORTH" code={neighbors.north} icon={<ArrowUp className="w-3 h-3" />} />
                    <div />
                    <NeighborBtn label="WEST" code={neighbors.west} icon={<ArrowLeft className="w-3 h-3" />} />
                    <div className="flex items-center justify-center text-blue-500/50"><Box className="w-5 h-5" /></div>
                    <NeighborBtn label="EAST" code={neighbors.east} icon={<ArrowRight className="w-3 h-3" />} />
                    <div />
                    <NeighborBtn label="SOUTH" code={neighbors.south} icon={<ArrowDown className="w-3 h-3" />} />
                    <div />
                 </div>
              </div>
            </aside>

            <div className="space-y-6 p-8 bg-white/[0.01] border border-white/5 rounded-xl">
               <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 border-b border-white/10 pb-4">Scientific Layers</h3>
               <div className="space-y-4">
                  <LayerToggle 
                    label="LGRS Grid" 
                    active={layers.lgrs.active} 
                    onToggle={() => setLayers(prev => ({ ...prev, lgrs: { ...prev.lgrs, active: !prev.lgrs.active }}))} 
                  />
                  <LayerToggle 
                    label="Surface Missions" 
                    active={layers.missions.active} 
                    onToggle={() => setLayers(prev => ({ ...prev, missions: { ...prev.missions, active: !prev.missions.active }}))} 
                  />
                  <LayerToggle 
                    label="Topographic Relief" 
                    active={layers.relief.active} 
                    onToggle={() => setLayers(prev => ({ ...prev, relief: { ...prev.relief, active: !prev.relief.active }}))} 
                  />
                  <LayerToggle 
                    label="Solar Terminator" 
                    active={layers.daynight.active} 
                    onToggle={() => setLayers(prev => ({ ...prev, daynight: { ...prev.daynight, active: !prev.daynight.active }}))} 
                  />
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RefDetail({ label, value, subValue, highlight }: { label: string; value: string; subValue?: string, highlight?: boolean }) {
  return (
    <div className="p-8 space-y-1.5">
       <span className="text-[9px] uppercase tracking-widest text-white/20 font-bold block">{label}</span>
       <div className={`text-sm font-bold tracking-tight ${highlight ? 'text-blue-400' : 'text-white/80'}`}>{value}</div>
       {subValue && <div className="text-[8px] uppercase text-white/20 tracking-widest">{subValue}</div>}
    </div>
  );
}

function NeighborBtn({ label, code, icon }: { label: string; code?: string | null; icon: React.ReactNode }) {
  if (!code) return <div className="h-14 bg-white/[0.01] border border-white/5 flex items-center justify-center opacity-10"><Box className="w-3 h-3" /></div>;
  
  return (
    <Link href={`/cell/${code}`} className="block">
      <button className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-1 group">
         <span className="text-white/40 group-hover:text-blue-400 transition-colors">{icon}</span>
         <span className="text-[7px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">{code}</span>
      </button>
    </Link>
  );
}

function LayerToggle({ label, active, onToggle }: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button 
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-3 border transition-all ${active ? 'bg-blue-500/10 border-blue-500/30' : 'bg-transparent border-white/5 opacity-40 hover:opacity-60'}`}
    >
       <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
       <div className={`w-2 h-2 rounded-full ${active ? 'bg-blue-400 animate-pulse' : 'bg-white/10'}`} />
    </button>
  );
}

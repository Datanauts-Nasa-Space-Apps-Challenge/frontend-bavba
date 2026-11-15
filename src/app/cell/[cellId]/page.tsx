'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { parseLgrsCell, getNeighborCells } from '@/lib/lgrs';
import { getCellScientificData } from '@/lib/lgrs-cell-service';
import dynamic from 'next/dynamic';
import { calculateLunarEphemeris } from '@/lib/lunar-ephemeris';
import { calculateSolarElevation } from '@/lib/lunar-engine';
import {
  Map as MapIcon,
  Info,
  Database,
  Globe,
  Sun,
  History,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapLayersConfig } from '@/types/lunar';

const CellDetailMap = dynamic(() => import('@/components/lunar/CellDetailMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black/40 flex items-center justify-center font-mono text-[10px] animate-pulse">
      INITIATING MAP RENDER...
    </div>
  ),
});

export default function LgrsCellPage() {
  const params = useParams();
  const router = useRouter();
  const cellId = decodeURIComponent(params.cellId as string);

  const cell = useMemo(() => parseLgrsCell(cellId), [cellId]);
  const neighbors = useMemo(() => getNeighborCells(cellId), [cellId]);

  const [simTime, setSimTime] = useState(0);
  const [layers] = useState<MapLayersConfig>({
    lgrs: { id: 'lgrs', active: true, opacity: 0.8, loading: false, source: '', version: '', category: 'lgrs', blendMode: 'normal' },
    missions: { id: 'missions', active: true, opacity: 1, loading: false, source: '', version: '', category: 'imagery', blendMode: 'normal' },
    relief: { id: 'relief', active: false, opacity: 0.6, loading: false, source: '', version: '', category: 'topography', blendMode: 'normal' },
    daynight: { id: 'daynight', active: true, opacity: 0.4, loading: false, source: '', version: '', category: 'illumination', blendMode: 'normal' },
  });

  useEffect(() => {
    setSimTime(Date.now());
  }, []);

  const scientificData = useMemo(() => {
    if (!cell) return null;
    return getCellScientificData(cell.centerLat, cell.centerLng, cell.latMin, cell.latMax, cell.lngMin, cell.lngMax);
  }, [cell]);

  const ephemeris = useMemo(() => calculateLunarEphemeris(simTime), [simTime]);
  const solarElev = cell
    ? calculateSolarElevation(cell.centerLat, ephemeris.subSolarLat, cell.centerLng, ephemeris.subSolarLon)
    : 0;

  if (!cell) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">INVALID CELL COORDINATES</h1>
        <p className="text-white/40 max-w-md uppercase tracking-widest text-xs leading-loose">
          The requested LGRS reference could not be resolved by the LTM/LPS geodetic engine.
        </p>
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          className="rounded-none border-white/20 uppercase tracking-[0.2em] h-12 px-10"
        >
          Return to Global Map
        </Button>
      </div>
    );
  }

  const precisionLabel =
    cell.precision >= 1000 ? `${(cell.precision / 1000).toFixed(cell.precision % 1000 === 0 ? 0 : 1)}KM` : `${cell.precision}M`;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono selection:bg-blue-400/30">
      <main className="container mx-auto px-6 max-w-7xl py-12">
        <nav className="flex items-center gap-4 mb-12 text-[10px] uppercase tracking-widest text-white/30">
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-2 font-bold">
            <Globe className="w-3 h-3" /> Global View
          </Link>
          <span>/</span>
          <span className="text-white/60">Cell Explorer</span>
          <span>/</span>
          <span className="text-blue-400 font-bold">{cellId}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-12">
            <header className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-2">{cellId}</h1>
                  <div className="flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">
                    <span>SYSTEM: {cell.system}</span>
                    <span>•</span>
                    <span>GZD: {cell.gzd}</span>
                    {cell.squareId && (
                      <>
                        <span>•</span>
                        <span>100KM SQ: {cell.squareId}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>RESOLUTION: {precisionLabel}</span>
                  </div>
                </div>
                <div className="p-6 bg-white/[0.02] border border-white/10 rounded-lg text-center min-w-[200px]">
                  <div className="text-[10px] text-white/20 uppercase tracking-widest mb-1.5">Cell Center</div>
                  <div className="text-lg font-black">
                    {cell.centerLat.toFixed(4)}°, {cell.centerLng.toFixed(4)}°
                  </div>
                  <div className="text-[9px] text-blue-400/60 mt-1.5">USGS_LGRS_IAU2000</div>
                </div>
              </div>
            </header>

            <section className="relative h-[500px] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              <CellDetailMap cell={cell} layers={layers} simTime={simTime} missions={scientificData?.missions || []} />
              <div className="absolute top-6 left-6 z-[1000] space-y-2 pointer-events-none">
                <div className="pointer-events-auto bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded text-[10px] flex items-center gap-3">
                  <MapIcon className="w-4 h-4 text-blue-400" />
                  <span className="uppercase tracking-widest font-bold">Projection: {cell.system}</span>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 z-[1000] pointer-events-auto">
                <div className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 text-[9px] uppercase tracking-widest text-white/40 font-bold">
                  NASA LOLA TOPOGRAPHY · IAU SURFACE FEATURES · LGRS ({cell.system})
                </div>
              </div>
            </section>

            <Tabs defaultValue="features" className="w-full">
              <TabsList className="bg-transparent border-b border-white/10 w-full justify-start rounded-none h-auto p-0 mb-8 overflow-x-auto custom-scrollbar">
                <TabsTrigger
                  value="features"
                  className="px-8 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] text-white/40"
                >
                  Named Features ({scientificData?.features.length})
                </TabsTrigger>
                <TabsTrigger
                  value="missions"
                  className="px-8 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] text-white/40"
                >
                  Missions Near Cell
                </TabsTrigger>
                <TabsTrigger
                  value="scientific"
                  className="px-8 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-white font-bold uppercase tracking-widest text-[10px] text-white/40"
                >
                  Solar & Topo Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="animate-in fade-in duration-500">
                {scientificData && scientificData.features.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scientificData.features.map((f) => (
                      <div key={f.id} className="bg-white/[0.02] border border-white/5 p-6 hover:bg-white/[0.04] transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg mb-0.5 group-hover:text-blue-400 transition-colors">{f.name}</h3>
                            <h3 className="text-[10px] uppercase tracking-widest text-white/40">
                              {f.type} • {f.diameter ? `${f.diameter}km dia` : 'IAU Ref'}
                            </h3>
                          </div>
                          <Button size="icon" variant="ghost" className="opacity-20 group-hover:opacity-100 transition-opacity">
                            <Info className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex justify-between items-end border-t border-white/5 pt-4">
                          <div className="text-[10px] font-mono text-white/20">
                            {f.latitude.toFixed(4)}°N
                            <br />
                            {f.longitude.toFixed(4)}°E
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
                  {scientificData?.missions.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 group hover:bg-white/[0.05] transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <History className="w-6 h-6 text-white/20 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <div>
                          <h4 className="font-bold text-md">{m.name}</h4>
                          <p className="text-[10px] uppercase tracking-widest text-white/40">
                            {m.agency} • {m.year} • {m.type}
                          </p>
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
                      No surface missions in cell {cellId}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="scientific" className="animate-in fade-in duration-500 grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-transparent border-white/10 rounded-xl overflow-hidden">
                  <CardHeader className="bg-white/[0.02] border-b border-white/10">
                    <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                      <Sun className="w-4 h-4" /> Solar Incidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-white/40 uppercase tracking-widest">Solar Elevation</span>
                      <span className={`${solarElev > 0 ? 'text-green-500' : 'text-blue-500'} font-black text-xl`}>
                        {solarElev.toFixed(2)}°
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-white/40 uppercase tracking-widest">Illumination State</span>
                      <span className="font-bold uppercase tracking-widest text-sm">
                        {solarElev > 0 ? 'Daylight' : 'PSR / Night'}
                      </span>
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
                    <CardTitle className="text-xs uppercase tracking-[0.3em] font-bold flex items-center gap-2">
                      <Compass className="w-4 h-4" /> Adjacent LGRS Cells
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-3">
                    {(['north', 'south', 'east', 'west'] as const).map((dir) => {
                      const code = neighbors[dir];
                      return (
                        <div key={dir} className="flex justify-between items-center text-xs">
                          <span className="uppercase text-white/40 tracking-widest">{dir}</span>
                          {code ? (
                            <Link href={`/cell/${encodeURIComponent(code)}`} className="text-blue-400 hover:underline font-bold">
                              {code}
                            </Link>
                          ) : (
                            <span className="text-white/20">N/A</span>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
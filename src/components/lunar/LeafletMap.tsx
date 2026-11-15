'use client';

import { useEffect, useState, useMemo, useId, useCallback } from 'react';
import { MapContainer, Circle, Tooltip, useMap, Polyline, useMapEvents, Pane, Polygon, Marker } from 'react-leaflet';
import L from 'leaflet';
import proj4 from 'proj4';
import 'leaflet/dist/leaflet.css';
import { MapViewMode, LunarFeature, MapLayersConfig, EvaluationPoint } from '@/types/lunar';
import NasaWmtsLayer from './NasaWmtsLayer';
import {
  LUNAR_NP_PROJ,
  LUNAR_SP_PROJ,
} from '@/lib/moon-projections';
import { getTerminatorPoints, checkLandingSuitability } from '@/lib/lunar-engine';
import {
  getLGRSGridLines,
  zoomToGridResolutionMeters,
  BANDS,
  getLtmZoneLabels,
  parseLgrsCell,
  getLGRSCode,
  getLGRSCellsInBounds,
} from '@/lib/lgrs';
import { calculateLunarEphemeris } from '@/lib/lunar-ephemeris';

if (typeof window !== 'undefined') {
  (window as any).proj4 = proj4;
  require('proj4leaflet');
}

interface LeafletMapProps {
  mode: MapViewMode;
  features: LunarFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (id: string | null) => void;
  layers: MapLayersConfig;
  evaluationPoints: EvaluationPoint[];
  simTime: number;
  onInspectPoint?: (lat: number, lng: number) => void;
  isMini?: boolean;
}

function MapController({ center, zoom, mode }: { center: [number, number]; zoom: number; mode: MapViewMode }) {
  const map = useMap();

  useEffect(() => {
    const targetCenter = (mode === 'north_pole') ? [90, 0] as [number, number] 
                     : (mode === 'south_pole') ? [-90, 0] as [number, number]
                     : center;
    
    map.setView(targetCenter, zoom, { animate: false });
    setTimeout(() => map.invalidateSize(), 100);
  }, [map, center, zoom, mode]);

  return null;
}

function MapClickHandler({ onInspect }: { onInspect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onInspect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function SuitabilityGrid({ active, simTime, currentZoom }: { active: boolean; simTime: number; currentZoom: number }) {
  const map = useMap();
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    if (!active) return;
    const handleMove = () => setBounds(map.getBounds());
    map.on('moveend', handleMove);
    setBounds(map.getBounds());
    return () => { map.off('moveend', handleMove); };
  }, [map, active]);

  const cells = useMemo(() => {
    if (!active || !bounds || currentZoom < 3) return [];
    
    const viewport = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      west: bounds.getWest(),
      east: bounds.getEast()
    };
    
    const digits = currentZoom >= 8 ? 2 : currentZoom >= 5 ? 1 : 0;
    return getLGRSCellsInBounds(viewport, digits, 100);
  }, [active, bounds, currentZoom]);

  if (!active || cells.length === 0) return null;

  return (
    <Pane name="suitability" style={{ zIndex: 400 }}>
      {cells.map(cell => {
        const isSuitable = checkLandingSuitability(cell.centerLat, cell.centerLng, simTime);
        return (
          <Polygon
            key={cell.code}
            positions={cell.polygon}
            pathOptions={{
              fillColor: isSuitable ? '#22c55e' : '#ef4444',
              fillOpacity: 0.35,
              weight: 0.5,
              color: isSuitable ? '#166534' : '#991b1b',
              opacity: 0.1
            }}
            interactive={false}
          />
        );
      })}
    </Pane>
  );
}

function TerminatorOverlay({ simTime, active, proj }: { simTime: number; active: boolean; proj: 'EQ' | 'NP' | 'SP' }) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const ephemeris = useMemo(() => {
    if (!isMounted || simTime === 0) return null;
    return calculateLunarEphemeris(simTime);
  }, [simTime, isMounted]);

  const terminatorPoints = useMemo(() => {
    if (!ephemeris) return [];
    return getTerminatorPoints(ephemeris.subSolarLat, ephemeris.subSolarLon, 360);
  }, [ephemeris]);

  if (!active || !ephemeris || !isMounted) return null;

  return (
    <>
      <Pane name="night-mask" style={{ zIndex: 590 }}>
        <Polygon
          positions={proj === 'EQ' ? [[[-90, -180], [-90, 180], [90, 180], [90, -180]], terminatorPoints] : [terminatorPoints]}
          pathOptions={{ fillColor: 'rgba(5, 8, 15, 0.65)', fillOpacity: 1, weight: 0, stroke: false }}
        />
      </Pane>
      <Pane name="terminator" style={{ zIndex: 600 }}>
        <Polyline
          positions={terminatorPoints}
          pathOptions={{ color: '#38bdf8', weight: 2, opacity: 0.9 }}
        />
      </Pane>
    </>
  );
}

export default function LeafletMap({
  mode,
  features,
  selectedFeatureId,
  onSelectFeature,
  layers,
  evaluationPoints,
  simTime,
  onInspectPoint,
  isMini = false,
}: LeafletMapProps) {
  const instanceId = useId();
  const [currentZoom, setCurrentZoom] = useState(2);
  const [inspectedCoords, setInspectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const [projLoaded, setProjLoaded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean((L as any).Proj || (window as any).L?.Proj);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = setInterval(() => {
      if ((L as any).Proj || (window as any).L?.Proj) {
        setProjLoaded(true);
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const { config, crs } = useMemo(() => {
    const resolutions = [32768, 16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25];
    const Proj = (L as any).Proj;

    if ((mode === 'north_pole' || mode === 'south_pole') && Proj) {
      const isNorth = mode === 'north_pole';
      const crsPolar = new Proj.CRS(isNorth ? 'LUNAR_NP' : 'LUNAR_SP', isNorth ? LUNAR_NP_PROJ : LUNAR_SP_PROJ, {
        resolutions,
        origin: [-3474800, 3474800],
        bounds: L.bounds([-3474800, -3474800], [3474800, 3474800]),
      });

      return {
        crs: crsPolar,
        config: {
          center: [isNorth ? 90 : -90, 0] as [number, number],
          zoom: 2,
          proj: isNorth ? 'NP' as const : 'SP' as const,
          baseLayerId: isNorth ? 'LRO_WAC_Mosaic_North_Pole_60N_2015' : 'LRO_WAC_Mosaic_South_Pole_60S_2015',
        },
      };
    }

    return {
      crs: L.CRS.EPSG4326,
      config: {
        center: [0, 0] as [number, number],
        zoom: 2,
        proj: 'EQ' as const,
        baseLayerId: 'LRO_WAC_Mosaic_Global_303ppd_v02',
      },
    };
  }, [mode, projLoaded]);

  const resolutionMeters = zoomToGridResolutionMeters(currentZoom);
  const gridLines = useMemo(() => getLGRSGridLines(currentZoom < 3 ? 1 : currentZoom < 5 ? 2 : 3, config.proj), [currentZoom, config.proj]);

  const activeCell = useMemo(() => {
    if (!inspectedCoords || isMini) return null;
    const digits = resolutionMeters >= 100_000 ? 0 : resolutionMeters >= 10_000 ? 1 : 2;
    const ref = getLGRSCode(inspectedCoords.lat, inspectedCoords.lng, digits);
    return parseLgrsCell(ref.code);
  }, [inspectedCoords, resolutionMeters, isMini]);

  if (!projLoaded) return null;

  return (
    <div className="w-full h-full bg-[#050505] relative overflow-hidden">
      <MapContainer
        key={`${mode}-${instanceId}`}
        center={config.center}
        zoom={config.zoom}
        crs={crs}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={!isMini}
        dragging={!isMini}
        worldCopyJump={false}
        className="w-full h-full"
        onZoomEnd={(e) => setCurrentZoom(e.target.getZoom())}
      >
        <MapController center={config.center} zoom={config.zoom} mode={mode} />
        <MapClickHandler onInspect={(lat, lng) => {
          setInspectedCoords({ lat, lng });
          onInspectPoint?.(lat, lng);
        }} />

        <Pane name="basemap" style={{ zIndex: 200 }}>
          <NasaWmtsLayer layerId={config.baseLayerId} opacity={layers[config.baseLayerId]?.opacity ?? 1} />
        </Pane>

        <Pane name="overlays" style={{ zIndex: 350 }}>
          {Object.values(layers).filter(l => l.active && l.id !== 'lgrs' && l.id !== 'daynight' && l.id !== 'suitability').map(l => (
            <NasaWmtsLayer key={l.id} layerId={l.id} opacity={l.opacity} />
          ))}
        </Pane>

        <SuitabilityGrid active={!!layers.suitability?.active} simTime={simTime} currentZoom={currentZoom} />

        <TerminatorOverlay simTime={simTime} active={!!layers.daynight?.active} proj={config.proj} />

        <Pane name="lgrs-grid" style={{ zIndex: 500 }}>
          {layers.lgrs?.active && (
            <>
              {(gridLines.lat as any[]).map((latObj, i) => (
                <Polyline
                  key={`lat-${i}`}
                  positions={Array.from({ length: 181 }, (_, j) => [latObj.value, -180 + j * 2])}
                  pathOptions={{
                    color: Math.abs(latObj.value) === 80 ? '#38bdf8' : '#4dabf7',
                    weight: Math.abs(latObj.value) === 80 ? 1.8 : latObj.isMajor ? 0.9 : 0.45,
                    opacity: layers.lgrs.opacity * (latObj.isMajor ? 0.55 : 0.25),
                  }}
                />
              ))}
              {(gridLines.lng as any[]).map((lngObj, i) => (
                <Polyline
                  key={`lng-${i}`}
                  positions={Array.from({ length: 81 }, (_, j) => [-80 + j * 2, lngObj.value])}
                  pathOptions={{
                    color: lngObj.value === 0 ? '#38bdf8' : '#4dabf7',
                    weight: lngObj.isMajor ? 0.9 : 0.45,
                    opacity: layers.lgrs.opacity * (lngObj.isMajor ? 0.55 : 0.25),
                  }}
                />
              ))}
              {activeCell && (
                <Polygon
                  positions={activeCell.polygon}
                  pathOptions={{ color: '#38bdf8', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.14 }}
                >
                  <Tooltip permanent direction="top" className="bg-black/90 border-sky-400/40 text-white text-[9px] font-mono px-2 py-0.5">
                    {activeCell.gzd}
                  </Tooltip>
                </Polygon>
              )}
            </>
          )}
        </Pane>

        <Pane name="markers" style={{ zIndex: 700 }}>
          {layers.missions?.active && features.map((f) => (
            <Circle
              key={f.id}
              center={[f.latitude, f.longitude]}
              radius={isMini ? 8000 : 4000}
              pathOptions={{ 
                color: f.id === selectedFeatureId ? '#3b82f6' : '#d97706', 
                fillOpacity: 0.8, 
                weight: f.id === selectedFeatureId ? 3 : 1 
              }}
              eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onSelectFeature(f.id); } }}
            />
          ))}

          {/* Evaluation Points */}
          {evaluationPoints.map((p) => (
            <Circle
              key={`eval-${p.id}`}
              center={[p.latitude, p.longitude]}
              radius={isMini ? 12000 : 6000}
              pathOptions={{ 
                color: p.color, 
                fillColor: p.color,
                fillOpacity: 0.9, 
                weight: 2,
                dashArray: '5, 5'
              }}
            >
              <Tooltip direction="top" className="bg-black/95 border-white/10 text-white text-[8px] font-bold px-2 py-1">
                {p.name}
              </Tooltip>
            </Circle>
          ))}
        </Pane>
      </MapContainer>
    </div>
  );
}

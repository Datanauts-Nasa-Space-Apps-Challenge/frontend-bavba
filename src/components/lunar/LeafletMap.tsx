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
<<<<<<< HEAD
} from '@/lib/moon-projections';
import { getTerminatorPoints, checkLandingSuitability } from '@/lib/lunar-engine';
=======
  LUNAR_RADIUS,
} from '@/lib/moon-projections';
import { getTerminatorPoints } from '@/lib/lunar-engine';
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
import {
  getLGRSGridLines,
  zoomToGridResolutionMeters,
  BANDS,
  getLtmZoneLabels,
  parseLgrsCell,
  getLGRSCode,
<<<<<<< HEAD
  getLGRSCellsInBounds,
=======
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
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
<<<<<<< HEAD
    setTimeout(() => map.invalidateSize(), 100);
=======
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timeout);
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
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

<<<<<<< HEAD
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
=======
function TerminatorOverlay({ simTime, active, proj }: { simTime: number; active: boolean; proj: 'EQ' | 'NP' | 'SP' }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e

  const ephemeris = useMemo(() => {
    if (!isMounted || simTime === 0) return null;
    return calculateLunarEphemeris(simTime);
  }, [simTime, isMounted]);

  const terminatorPoints = useMemo(() => {
    if (!ephemeris) return [];
    return getTerminatorPoints(ephemeris.subSolarLat, ephemeris.subSolarLon, 360);
  }, [ephemeris]);

<<<<<<< HEAD
=======
  const maskPositions = useMemo(() => {
    if (!ephemeris || terminatorPoints.length === 0) return [];
    if (proj === 'EQ') {
      return [
        [[-90, -180], [-90, 180], [90, 180], [90, -180]],
        terminatorPoints,
      ] as L.LatLngExpression[][];
    }
    return [terminatorPoints] as L.LatLngExpression[][];
  }, [terminatorPoints, proj, ephemeris]);

>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
  if (!active || !ephemeris || !isMounted) return null;

  return (
    <>
      <Pane name="night-mask" style={{ zIndex: 590 }}>
        <Polygon
<<<<<<< HEAD
          positions={proj === 'EQ' ? [[[-90, -180], [-90, 180], [90, 180], [90, -180]], terminatorPoints] : [terminatorPoints]}
          pathOptions={{ fillColor: 'rgba(5, 8, 15, 0.65)', fillOpacity: 1, weight: 0, stroke: false }}
=======
          positions={maskPositions}
          pathOptions={{
            fillColor: 'rgba(5, 8, 15, 0.65)',
            fillOpacity: 1,
            weight: 0,
            stroke: false,
          }}
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
        />
      </Pane>
      <Pane name="terminator" style={{ zIndex: 600 }}>
        <Polyline
          positions={terminatorPoints}
<<<<<<< HEAD
          pathOptions={{ color: '#38bdf8', weight: 2, opacity: 0.9 }}
=======
          pathOptions={{
            color: '#38bdf8',
            weight: 2,
            opacity: 0.9,
            lineJoin: 'round',
          }}
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
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
<<<<<<< HEAD
  evaluationPoints,
=======
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
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
<<<<<<< HEAD
=======
    if ((L as any).Proj || (window as any).L?.Proj) {
      setProjLoaded(true);
      return;
    }
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
    const timer = setInterval(() => {
      if ((L as any).Proj || (window as any).L?.Proj) {
        setProjLoaded(true);
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const { config, crs } = useMemo(() => {
<<<<<<< HEAD
    const resolutions = [32768, 16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25];
=======
    const resolutions = [
      32768, 16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5, 0.25, 0.125
    ];
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
    const Proj = (L as any).Proj;

    if ((mode === 'north_pole' || mode === 'south_pole') && Proj) {
      const isNorth = mode === 'north_pole';
<<<<<<< HEAD
      const crsPolar = new Proj.CRS(isNorth ? 'LUNAR_NP' : 'LUNAR_SP', isNorth ? LUNAR_NP_PROJ : LUNAR_SP_PROJ, {
=======
      const projStr = isNorth ? LUNAR_NP_PROJ : LUNAR_SP_PROJ;
      const crsName = isNorth ? 'LUNAR_NP' : 'LUNAR_SP';
      
      const crsPolar = new Proj.CRS(crsName, projStr, {
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
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

<<<<<<< HEAD
  const resolutionMeters = zoomToGridResolutionMeters(currentZoom);
  const gridLines = useMemo(() => getLGRSGridLines(currentZoom < 3 ? 1 : currentZoom < 5 ? 2 : 3, config.proj), [currentZoom, config.proj]);

  const activeCell = useMemo(() => {
    if (!inspectedCoords || isMini) return null;
    const digits = resolutionMeters >= 100_000 ? 0 : resolutionMeters >= 10_000 ? 1 : 2;
=======
  const gridLevel: 1 | 2 | 3 | 4 = currentZoom < 3 ? 1 : currentZoom < 5 ? 2 : currentZoom < 8 ? 3 : 4;
  const resolutionMeters = zoomToGridResolutionMeters(currentZoom);
  const gridLines = useMemo(() => getLGRSGridLines(gridLevel, config.proj), [gridLevel, config.proj]);

  const activeCell = useMemo(() => {
    if (!inspectedCoords || isMini) return null;
    const digits = resolutionMeters >= 100_000 ? 0 : resolutionMeters >= 10_000 ? 1 : resolutionMeters >= 1_000 ? 2 : 3;
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
    const ref = getLGRSCode(inspectedCoords.lat, inspectedCoords.lng, digits);
    return parseLgrsCell(ref.code);
  }, [inspectedCoords, resolutionMeters, isMini]);

<<<<<<< HEAD
=======
  const activeOverlays = useMemo(() => {
    return Object.values(layers).filter(
      (layer) =>
        layer.active &&
        layer.id !== 'lgrs' &&
        layer.id !== 'daynight' &&
        layer.id !== config.baseLayerId
    );
  }, [layers, config.baseLayerId]);

  const ltmLabels = useMemo(() => {
    if (config.proj !== 'EQ' || isMini) return [];
    const labels: { id: string; pos: [number, number]; text: string; variant: 'zone' | 'band' }[] = [];
    if (currentZoom >= 3) {
      getLtmZoneLabels().forEach((z) => {
        if (currentZoom === 3 && z.zone % 2 !== 0) return;
        labels.push({ id: `ltm-zone-${z.code}`, pos: [0, z.centralMeridian], text: z.code, variant: 'zone' });
      });
    }
    BANDS.filter((_, idx) => currentZoom >= 3 || idx % 2 === 0).forEach((b) => {
      const midLat = (b.min + b.max) / 2;
      labels.push({ id: `ltm-band-${b.code}`, pos: [midLat, 0], text: b.code, variant: 'band' });
    });
    return labels;
  }, [config.proj, isMini, currentZoom]);

  const polarLabels = useMemo(() => {
    if (config.proj === 'EQ' || isMini) return [];
    const isNorth = config.proj === 'NP';
    const zoneLat = isNorth ? 85 : -85;
    const meridianLat = isNorth ? 74 : -74;
    const zones = isNorth
      ? [{ id: 'lps-Y', pos: [zoneLat, -90] as [number, number], text: 'LPS Y' }, { id: 'lps-Z', pos: [zoneLat, 90] as [number, number], text: 'LPS Z' }]
      : [{ id: 'lps-A', pos: [zoneLat, -90] as [number, number], text: 'LPS A' }, { id: 'lps-B', pos: [zoneLat, 90] as [number, number], text: 'LPS B' }];
    const meridians = [-120, -60, 0, 60, 120, 180].map((lon) => ({ id: `mer-${lon}`, pos: [meridianLat, lon === 180 ? 179.9 : lon] as [number, number], text: `${lon}°` }));
    return { zones, meridians };
  }, [config.proj, isMini]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setInspectedCoords({ lat, lng });
    onInspectPoint?.(lat, lng);
  }, [onInspectPoint]);

>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
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
<<<<<<< HEAD
        onZoomEnd={(e) => setCurrentZoom(e.target.getZoom())}
      >
        <MapController center={config.center} zoom={config.zoom} mode={mode} />
        <MapClickHandler onInspect={(lat, lng) => {
          setInspectedCoords({ lat, lng });
          onInspectPoint?.(lat, lng);
        }} />
=======
        style={{ background: '#050505' }}
        onZoomEnd={(e) => setCurrentZoom(e.target.getZoom())}
      >
        <MapController center={config.center} zoom={config.zoom} mode={mode} />
        <MapClickHandler onInspect={handleMapClick} />
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e

        <Pane name="basemap" style={{ zIndex: 200 }}>
          <NasaWmtsLayer layerId={config.baseLayerId} opacity={layers[config.baseLayerId]?.opacity ?? 1} />
        </Pane>

        <Pane name="overlays" style={{ zIndex: 350 }}>
<<<<<<< HEAD
          {Object.values(layers).filter(l => l.active && l.id !== 'lgrs' && l.id !== 'daynight' && l.id !== 'suitability').map(l => (
            <NasaWmtsLayer key={l.id} layerId={l.id} opacity={l.opacity} />
          ))}
        </Pane>

        <SuitabilityGrid active={!!layers.suitability?.active} simTime={simTime} currentZoom={currentZoom} />

=======
          {activeOverlays.map((ov) => (
            <NasaWmtsLayer key={ov.id} layerId={ov.id} opacity={ov.opacity} />
          ))}
        </Pane>

>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
        <TerminatorOverlay simTime={simTime} active={!!layers.daynight?.active} proj={config.proj} />

        <Pane name="lgrs-grid" style={{ zIndex: 500 }}>
          {layers.lgrs?.active && (
            <>
<<<<<<< HEAD
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
=======
              {config.proj === 'EQ' ? (
                <>
                  {(gridLines.lat as any[]).map((latObj, i) => {
                    const isPolarLimit = Math.abs(latObj.value) === 80;
                    return (
                      <Polyline
                        key={`lat-${i}`}
                        positions={Array.from({ length: 181 }, (_, j) => [latObj.value, -180 + j * 2])}
                        pathOptions={{
                          color: isPolarLimit ? '#38bdf8' : '#4dabf7',
                          weight: isPolarLimit ? 1.8 : latObj.isMajor ? 0.9 : 0.45,
                          opacity: layers.lgrs.opacity * (isPolarLimit ? 0.9 : latObj.isMajor ? 0.55 : 0.25),
                        }}
                      />
                    );
                  })}
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
                </>
              ) : (
                <>
                  {(gridLines.lng as any[]).map((lngObj, i) => {
                    const poleLat = config.proj === 'NP' ? 90 : -90;
                    const endLat = config.proj === 'NP' ? 55 : -55;
                    const points: [number, number][] = [[poleLat, lngObj.value], [endLat, lngObj.value]];
                    return (
                      <Polyline
                        key={`rad-${i}`}
                        positions={points}
                        pathOptions={{
                          color: lngObj.value === 0 || Math.abs(lngObj.value) === 90 ? '#38bdf8' : '#4dabf7',
                          weight: lngObj.isMajor ? 1.2 : 0.6,
                          opacity: layers.lgrs.opacity * (lngObj.isMajor ? 0.7 : 0.3),
                        }}
                      />
                    );
                  })}
                  {(gridLines.lat as any[]).map((latObj, i) => {
                    const points: [number, number][] = [];
                    for (let lng = -180; lng <= 180; lng += 2) points.push([latObj.value, lng]);
                    const isBoundary = Math.abs(latObj.value) === 80;
                    return (
                      <Polyline
                        key={`con-${i}`}
                        positions={points}
                        pathOptions={{
                          color: isBoundary ? '#38bdf8' : '#4dabf7',
                          weight: isBoundary ? 2.0 : latObj.isMajor ? 1.0 : 0.5,
                          opacity: layers.lgrs.opacity * (isBoundary ? 1.0 : latObj.isMajor ? 0.6 : 0.3),
                        }}
                      />
                    );
                  })}
                </>
              )}
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
              {activeCell && (
                <Polygon
                  positions={activeCell.polygon}
                  pathOptions={{ color: '#38bdf8', weight: 2, fillColor: '#38bdf8', fillOpacity: 0.14 }}
                >
                  <Tooltip permanent direction="top" className="bg-black/90 border-sky-400/40 text-white text-[9px] font-mono px-2 py-0.5">
<<<<<<< HEAD
                    {activeCell.gzd}
=======
                    {activeCell.gzd} · {resolutionMeters >= 1000 ? `${resolutionMeters / 1000}km` : `${resolutionMeters}m`}
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
                  </Tooltip>
                </Polygon>
              )}
            </>
          )}
        </Pane>

<<<<<<< HEAD
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
=======
        <Pane name="lgrs-labels" style={{ zIndex: 550 }}>
          {!isMini && layers.lgrs?.active && (
            <>
              {ltmLabels.map((label) => (
                <Marker
                  key={label.id}
                  position={label.pos}
                  icon={L.divIcon({
                    className: 'lgrs-ltm-label',
                    html: label.variant === 'band'
                        ? `<span class="inline-block text-[9px] font-mono font-bold text-sky-300/90 bg-black/50 px-1 rounded">${label.text}</span>`
                        : `<span class="inline-block text-[8px] font-mono text-blue-300/80 bg-black/50 px-1 rounded">${label.text}</span>`,
                    iconSize: [18, 14],
                    iconAnchor: [9, 7],
                  })}
                  interactive={false}
                />
              ))}
              {!Array.isArray(polarLabels) && polarLabels.zones.map((label) => (
                  <Marker
                    key={label.id}
                    position={label.pos}
                    icon={L.divIcon({
                      className: 'lgrs-lps-zone-label',
                      html: `<span class="inline-block text-[9px] font-mono font-bold text-sky-200 bg-black/60 border border-sky-400/30 px-1.5 py-0.5 rounded whitespace-nowrap">${label.text}</span>`,
                      iconSize: [42, 16],
                      iconAnchor: [21, 8],
                    })}
                    interactive={false}
                  />
                ))}
              {!Array.isArray(polarLabels) && polarLabels.meridians.map((label) => (
                  <Marker
                    key={label.id}
                    position={label.pos}
                    icon={L.divIcon({
                      className: 'lgrs-meridian-label',
                      html: `<span class="inline-block text-[8px] font-mono text-blue-300/80 bg-black/50 px-1 rounded">${label.text}</span>`,
                      iconSize: [28, 14],
                      iconAnchor: [14, 7],
                    })}
                    interactive={false}
                  />
                ))}
            </>
          )}
        </Pane>

        <Pane name="markers" style={{ zIndex: 700 }}>
          {layers.missions?.active &&
            features.map((f) => (
              <Circle
                key={f.id}
                center={[f.latitude, f.longitude]}
                radius={isMini ? 8000 : 4000}
                pathOptions={{ 
                  color: f.id === selectedFeatureId ? '#3b82f6' : '#d97706', 
                  fillOpacity: 0.8, 
                  weight: f.id === selectedFeatureId ? 3 : 1 
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    onSelectFeature(f.id);
                  }
                }}
              >
                <Tooltip className="bg-black/90 border-white/10 text-white text-[9px] uppercase font-mono px-2 py-1">
                  {f.name}
                </Tooltip>
              </Circle>
            ))}
>>>>>>> 9de26753331600944d26894b8722a60e8f4ff85e
        </Pane>
      </MapContainer>
    </div>
  );
}

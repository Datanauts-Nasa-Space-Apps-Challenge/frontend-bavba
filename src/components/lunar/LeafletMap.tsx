'use client';

import { useEffect, useState, useMemo, useId } from 'react';
import { MapContainer, Circle, Tooltip, useMap, Polyline, useMapEvents, Pane, Polygon, Marker } from 'react-leaflet';
import * as L from 'leaflet';
import proj4 from 'proj4';
import 'leaflet/dist/leaflet.css';
import { MapViewMode, LunarFeature, MapLayersConfig, EvaluationPoint } from '@/types/lunar';
import NasaWmtsLayer from './NasaWmtsLayer';
import { LUNAR_NP_PROJ, LUNAR_SP_PROJ, LUNAR_RADIUS } from '@/lib/moon-projections';
import { LUNAR_MISSIONS } from '@/data/lunar-data';
import { getTerminatorPoints } from '@/lib/lunar-engine';
import { getLGRSGridLines, BANDS, normalizeLng } from '@/lib/lgrs';
import { calculateLunarEphemeris } from '@/lib/lunar-ephemeris';

if (typeof window !== 'undefined') {
  (window as any).L = L;
  (window as any).proj4 = proj4;
  require('proj4leaflet');
}

function MapController({ center, zoom, mode, crs }: { center: [number, number]; zoom: number; mode: MapViewMode, crs: L.CRS }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom, { animate: false });
    const timeout = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(timeout);
  }, [map, center, zoom, mode, crs]);

  // Listener para redimensionamiento del contenedor (disparado al ocultar la barra lateral)
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

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

function TerminatorOverlay({ simTime, active, proj }: { simTime: number, active: boolean, proj: 'EQ' | 'NP' | 'SP' }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ephemeris = useMemo(() => {
    if (!isMounted || simTime === 0) return null;
    return calculateLunarEphemeris(simTime);
  }, [simTime, isMounted]);

  const terminatorPoints = useMemo(() => {
    if (!ephemeris) return [];
    return getTerminatorPoints(ephemeris.subSolarLat, ephemeris.subSolarLon, 360);
  }, [ephemeris]);
  
  const maskPositions = useMemo(() => {
    if (!ephemeris || terminatorPoints.length === 0) return [];
    
    if (proj === 'EQ') {
      return [
        [[-90, -180], [-90, 180], [90, 180], [90, -180]],
        terminatorPoints
      ] as L.LatLngExpression[][];
    }
    
    return [terminatorPoints] as L.LatLngExpression[][];
  }, [terminatorPoints, proj, ephemeris]);

  if (!active || !ephemeris || !isMounted) return null;

  return (
    <>
      <Pane name="night-mask" style={{ zIndex: 590 }}>
        <Polygon 
          positions={maskPositions}
          pathOptions={{ 
            fillColor: 'rgba(5, 8, 15, 0.65)', 
            fillOpacity: 1, 
            weight: 0, 
            stroke: false,
            className: 'night-mask-overlay'
          }}
        />
      </Pane>
      <Pane name="terminator" style={{ zIndex: 600 }}>
        <Polyline 
          positions={terminatorPoints} 
          pathOptions={{ 
            color: '#38bdf8', 
            weight: 2, 
            opacity: 0.9, 
            lineJoin: 'round'
          }} 
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
  const [currentZoom, setCurrentZoom] = useState(isMini ? 1 : 2);
  const [projReady, setProjReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (L as any).Proj) {
      setProjReady(true);
    }
  }, []);

  const { config, crs } = useMemo(() => {
    const Proj = (L as any).Proj;
    const resolutions = [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5];
    
    if (mode === 'north_pole' && Proj) {
      const crsNP = new Proj.CRS('LUNAR_NP', LUNAR_NP_PROJ, { 
        resolutions, 
        origin: [0, 0],
        bounds: L.bounds([-LUNAR_RADIUS * 2, -LUNAR_RADIUS * 2], [LUNAR_RADIUS * 2, LUNAR_RADIUS * 2])
      });
      return { crs: crsNP, 
               config: { center: [90, 0] as [number, number], zoom: isMini ? 1 : 2, proj: 'NP' as const, baseLayerId: 'LRO_WAC_Mosaic_North_Pole_60N_2015' }};
    }
    
    if (mode === 'south_pole' && Proj) {
      const crsSP = new Proj.CRS('LUNAR_SP', LUNAR_SP_PROJ, { 
        resolutions, 
        origin: [0, 0],
        bounds: L.bounds([-LUNAR_RADIUS * 2, -LUNAR_RADIUS * 2], [LUNAR_RADIUS * 2, LUNAR_RADIUS * 2])
      });
      return { crs: crsSP,
               config: { center: [-90, 0] as [number, number], zoom: isMini ? 1 : 2, proj: 'SP' as const, baseLayerId: 'LRO_WAC_Mosaic_South_Pole_60S_2015' }};
    }
    
    return { crs: L.CRS.EPSG4326,
             config: { center: [0, 0] as [number, number], zoom: isMini ? 1 : 2, proj: 'EQ' as const, baseLayerId: 'LRO_WAC_Mosaic_Global_303ppd_v02' }};
  }, [mode, isMini, projReady]);

  const gridLevel: 1 | 2 | 3 | 4 = currentZoom < 3 ? 1 : currentZoom < 5 ? 2 : currentZoom < 8 ? 3 : 4;
  const gridLines = useMemo(() => getLGRSGridLines(gridLevel, config.proj), [gridLevel, config.proj]);

  const mapMaxBounds = useMemo(() => {
    if (config.proj === 'EQ') return L.latLngBounds([-90, -180], [90, 180]);
    return config.proj === 'NP' 
      ? L.latLngBounds([55, -180], [90, 180])
      : L.latLngBounds([-90, -180], [-55, 180]);
  }, [config.proj]);

  const sectorLabels = useMemo(() => {
    if (config.proj === 'EQ' || isMini) return [];
    const labels = [];
    const labelLat = config.proj === 'NP' ? 70 : -70;
    for (let i = 1; i <= 24; i++) {
      const lng = normalizeLng((i - 1) * 15 + 7.5);
      labels.push({
        id: `sector-${i}`,
        pos: [labelLat, lng] as [number, number],
        text: i.toString().padStart(2, '0')
      });
    }
    return labels;
  }, [config.proj, isMini]);

  const bandLabels = useMemo(() => {
    if (config.proj === 'EQ' || isMini) return [];
    const labels = [];
    const targetBands = config.proj === 'NP' ? ['H', 'K', 'L'] : ['Q', 'P', 'N'];
    BANDS.filter(b => targetBands.includes(b.code)).forEach(b => {
      const midLat = (b.min + b.max) / 2;
      labels.push({
        id: `band-${b.code}`,
        pos: [midLat, 0] as [number, number],
        text: b.code
      });
    });
    return labels;
  }, [config.proj, isMini]);

  return (
    <div className="w-full h-full bg-[#050505] relative overflow-hidden" key={`cont-${mode}-${instanceId}`}>
      <MapContainer
        key={`map-${mode}-${instanceId}-${config.baseLayerId}`}
        center={config.center}
        zoom={config.zoom}
        crs={crs}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={!isMini}
        dragging={!isMini}
        worldCopyJump={false}
        maxBounds={mapMaxBounds}
        maxBoundsViscosity={1.0}
        className="w-full h-full"
        style={{ background: '#050505' }}
        onZoomEnd={(e) => setCurrentZoom(e.target.getZoom())}
      >
        <MapController center={config.center} zoom={config.zoom} mode={mode} crs={crs} />
        
        {onInspectPoint && <MapClickHandler onInspect={onInspectPoint} />}
        
        <Pane name="basemap" style={{ zIndex: 200 }}>
          <NasaWmtsLayer layerId={config.baseLayerId} />
        </Pane>

        <TerminatorOverlay simTime={simTime} active={!!layers.daynight?.active} proj={config.proj} />

        <Pane name="lgrs-grid" style={{ zIndex: 500 }}>
          {layers.lgrs?.active && (
            <>
              {config.proj === 'EQ' ? (
                <>
                  {(gridLines.lat as any[]).map((latObj, i) => (
                    <Polyline key={`lat-${i}`} positions={Array.from({length: 181}, (_, j) => [latObj.value, -180 + j*2])} pathOptions={{ color: '#4dabf7', weight: latObj.isMajor ? 1 : 0.6, opacity: layers.lgrs.opacity * (latObj.isMajor ? 0.7 : 0.4) }} />
                  ))}
                  {(gridLines.lng as any[]).map((lngObj, i) => (
                    <Polyline key={`lng-${i}`} positions={Array.from({length: 91}, (_, j) => [-90 + j*2, lngObj.value])} pathOptions={{ color: '#4dabf7', weight: lngObj.isMajor ? 1 : 0.6, opacity: layers.lgrs.opacity * (lngObj.isMajor ? 0.7 : 0.4) }} />
                  ))}
                </>
              ) : (
                <>
                  {(gridLines.lng as any[]).map((lngObj, i) => {
                    const points: [number, number][] = [];
                    const poleLat = config.proj === 'NP' ? 90 : -90;
                    const endLat = config.proj === 'NP' ? 55 : -55;
                    for (let lat = poleLat; config.proj === 'NP' ? lat >= endLat : lat <= endLat; lat += (config.proj === 'NP' ? -0.5 : 0.5)) {
                      points.push([lat, lngObj.value]);
                    }
                    return (
                      <Polyline 
                        key={`rad-${i}`} 
                        positions={points} 
                        pathOptions={{ 
                          color: lngObj.value === 0 ? '#38bdf8' : '#4dabf7', 
                          weight: lngObj.isMajor ? 1.2 : 0.6, 
                          opacity: layers.lgrs.opacity * (lngObj.isMajor ? 0.7 : 0.3)
                        }} 
                      />
                    );
                  })}
                  {(gridLines.lat as any[]).map((latObj, i) => {
                    const points: [number, number][] = [];
                    for (let lng = -180; lng <= 180; lng += 2) {
                      points.push([latObj.value, lng]);
                    }
                    const isBoundary = Math.abs(latObj.value) === 80;
                    return (
                      <Polyline 
                        key={`con-${i}`} 
                        positions={points} 
                        pathOptions={{ 
                          color: isBoundary ? '#38bdf8' : '#4dabf7', 
                          weight: isBoundary ? 2 : latObj.isMajor ? 1 : 0.5, 
                          opacity: layers.lgrs.opacity * (isBoundary ? 0.9 : latObj.isMajor ? 0.6 : 0.3) 
                        }} 
                      />
                    );
                  })}
                </>
              )}
            </>
          )}
        </Pane>

        <Pane name="lgrs-labels" style={{ zIndex: 550 }}>
          {!isMini && layers.lgrs?.active && (
            <>
              {sectorLabels.map(label => (
                <Marker 
                  key={label.id} 
                  position={label.pos} 
                  icon={L.divIcon({
                    className: 'lgrs-sector-label',
                    html: `<div class="bg-black/60 backdrop-blur-sm border border-blue-500/30 text-blue-400 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm flex items-center justify-center">${label.text}</div>`,
                    iconSize: [24, 16],
                    iconAnchor: [12, 8]
                  })}
                  interactive={false}
                />
              ))}
              {bandLabels.map(label => (
                <Marker 
                  key={label.id} 
                  position={label.pos} 
                  icon={L.divIcon({
                    className: 'lgrs-band-label',
                    html: `<div class="bg-blue-500/20 backdrop-blur-sm border border-white/20 text-white text-[9px] font-mono font-black px-2 py-0.5 rounded-sm flex items-center justify-center">${label.text}</div>`,
                    iconSize: [24, 16],
                    iconAnchor: [12, 8]
                  })}
                  interactive={false}
                />
              ))}
            </>
          )}
        </Pane>

        <Pane name="markers" style={{ zIndex: 700 }}>
          {layers.missions?.active && LUNAR_MISSIONS.map(m => (
            <Circle 
              key={m.id} 
              center={[m.coordinates.lat, m.coordinates.lng]} 
              radius={isMini ? 8000 : 4000} 
              pathOptions={{ color: '#d97706', fillOpacity: 0.6, weight: 1 }}
            >
              <Tooltip className="bg-black/90 border-white/10 text-white text-[9px] uppercase font-mono px-2 py-1">{m.name}</Tooltip>
            </Circle>
          ))}
        </Pane>
      </MapContainer>
    </div>
  );
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

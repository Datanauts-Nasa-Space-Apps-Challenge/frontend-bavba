'use client';

import { MapContainer, Pane, Polyline, Polygon, Circle, Tooltip, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import NasaWmtsLayer from './NasaWmtsLayer';
import { MapLayersConfig, Mission } from '@/types/lunar';
import { useEffect, useMemo } from 'react';
import { getLGRSGridLines, LunarGridSystem } from '@/lib/lgrs';

interface CellDetailMapProps {
  cell: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
    centerLat: number;
    centerLng: number;
    band: string;
    sector: string;
    system: LunarGridSystem;
    precision: number;
    polygon: [number, number][];
  };
  layers: MapLayersConfig;
  simTime: number;
  missions: (Mission & { distance: number })[];
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    map.invalidateSize();
  }, [map, center, zoom]);
  return null;
}

export default function CellDetailMap({ cell, layers, missions }: CellDetailMapProps) {
  const center: [number, number] = [cell.centerLat, cell.centerLng];
  const gridLines = useMemo(() => getLGRSGridLines(3, 'EQ'), []);

  const zoomLevel = useMemo(() => {
    if (cell.precision <= 100) return 11;
    if (cell.precision <= 1_000) return 9;
    if (cell.precision <= 10_000) return 7;
    return 5;
  }, [cell.precision]);

  const basemapLayer = useMemo(() => {
    if (cell.system === 'LPS_NORTH') return 'LRO_WAC_Mosaic_North_Pole_60N_2015';
    if (cell.system === 'LPS_SOUTH') return 'LRO_WAC_Mosaic_South_Pole_60S_2015';
    return 'LRO_WAC_Mosaic_Global_303ppd_v02';
  }, [cell.system]);

  return (
    <div className="w-full h-full bg-[#050505]">
      <MapContainer
        center={center}
        zoom={zoomLevel}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
        style={{ background: '#050505' }}
      >
        <MapController center={center} zoom={zoomLevel} />

        <Pane name="basemap" style={{ zIndex: 100 }}>
          <NasaWmtsLayer layerId={basemapLayer} opacity={1} />
        </Pane>

        {layers.relief?.active && (
          <Pane name="relief" style={{ zIndex: 150 }}>
            <NasaWmtsLayer layerId="LRO_LOLA_ClrShade_Global_128ppd_v06" opacity={0.6} />
          </Pane>
        )}

        <Pane name="lgrs-highlight" style={{ zIndex: 200 }}>
          {layers.lgrs?.active && (
            <>
              <Polygon
                positions={cell.polygon}
                pathOptions={{
                  color: '#38bdf8',
                  weight: 3,
                  fillColor: '#3b82f6',
                  fillOpacity: 0.14,
                  dashArray: '8, 6',
                }}
              />

              {gridLines.lat.map((l, i) => (
                <Polyline
                  key={`lat-${i}`}
                  positions={[
                    [l.value, -180],
                    [l.value, 180],
                  ]}
                  pathOptions={{ color: '#3b82f6', weight: 0.5, opacity: 0.2 }}
                />
              ))}
              {gridLines.lng.map((l, i) => (
                <Polyline
                  key={`lng-${i}`}
                  positions={[
                    [-80, l.value],
                    [80, l.value],
                  ]}
                  pathOptions={{ color: '#3b82f6', weight: 0.5, opacity: 0.2 }}
                />
              ))}
            </>
          )}
        </Pane>

        <Pane name="missions" style={{ zIndex: 300 }}>
          {layers.missions?.active &&
            missions.map((m) => (
              <Circle
                key={m.id}
                center={[m.coordinates.lat, m.coordinates.lng]}
                radius={2000}
                pathOptions={{
                  color: '#d97706',
                  fillColor: '#d97706',
                  fillOpacity: 0.8,
                  weight: 1,
                }}
              >
                <Tooltip
                  direction="top"
                  className="bg-black/90 border-white/20 text-white text-[9px] uppercase font-mono px-2 py-1"
                >
                  {m.name} ({m.distance.toFixed(1)} km)
                </Tooltip>
              </Circle>
            ))}
        </Pane>
      </MapContainer>
    </div>
  );
}
'use client';

import { MapContainer, Pane, Polyline, Rectangle, Circle, Tooltip, useMap } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import NasaWmtsLayer from './NasaWmtsLayer';
import { MapLayersConfig, Mission } from '@/types/lunar';
import { useEffect, useMemo } from 'react';
import { getLGRSGridLines, normalizeLng } from '@/lib/lgrs';

interface CellDetailMapProps {
  cell: { 
    latMin: number, latMax: number, lngMin: number, lngMax: number, 
    centerLat: number, centerLng: number, band: string, sector: string 
  };
  layers: MapLayersConfig;
  simTime: number;
  missions: (Mission & { distance: number })[];
}

function MapController({ center, bounds }: { center: [number, number], bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 9);
    map.invalidateSize();
  }, [map, center, bounds]);
  return null;
}

export default function CellDetailMap({ cell, layers, missions }: CellDetailMapProps) {
  const bounds: L.LatLngBoundsExpression = [
    [cell.latMin, cell.lngMin],
    [cell.latMax, cell.lngMax]
  ];

  const center: [number, number] = [cell.centerLat, cell.centerLng];
  const gridLines = useMemo(() => getLGRSGridLines(3, 'EQ'), []);

  return (
    <div className="w-full h-full bg-[#050505]">
      <MapContainer
        center={center}
        zoom={9}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
        style={{ background: '#050505' }}
      >
        <MapController center={center} bounds={bounds} />

        <Pane name="basemap" style={{ zIndex: 100 }}>
          <NasaWmtsLayer layerId="LRO_WAC_Mosaic_Global_303ppd_v02" opacity={1} />
        </Pane>

        {layers.relief?.active && (
          <Pane name="relief" style={{ zIndex: 150 }}>
            <NasaWmtsLayer layerId="LRO_LOLA_ClrShade_Global_128ppd_v06" opacity={0.6} />
          </Pane>
        )}

        <Pane name="lgrs-highlight" style={{ zIndex: 200 }}>
          {layers.lgrs?.active && (
            <>
              {/* Celda Actual */}
              <Rectangle 
                bounds={bounds}
                pathOptions={{ 
                  color: '#3b82f6', 
                  weight: 3, 
                  fillOpacity: 0.1,
                  dashArray: '10, 10'
                }} 
              />
              
              {/* Líneas de cuadrícula cercanas */}
              {gridLines.lat.map((l, i) => (
                <Polyline 
                  key={`lat-${i}`} 
                  positions={[[l.value, -180], [l.value, 180]]} 
                  pathOptions={{ color: '#3b82f6', weight: 0.5, opacity: 0.2 }} 
                />
              ))}
              {gridLines.lng.map((l, i) => (
                <Polyline 
                  key={`lng-${i}`} 
                  positions={[[-90, l.value], [90, l.value]]} 
                  pathOptions={{ color: '#3b82f6', weight: 0.5, opacity: 0.2 }} 
                />
              ))}
            </>
          )}
        </Pane>

        <Pane name="missions" style={{ zIndex: 300 }}>
          {layers.missions?.active && missions.map(m => (
            <Circle 
              key={m.id}
              center={[m.coordinates.lat, m.coordinates.lng]}
              radius={2000}
              pathOptions={{ 
                color: '#d97706', 
                fillColor: '#d97706', 
                fillOpacity: 0.8,
                weight: 1
              }}
            >
              <Tooltip direction="top" className="bg-black/90 border-white/20 text-white text-[9px] uppercase font-mono px-2 py-1">
                {m.name} ({m.distance.toFixed(1)} km)
              </Tooltip>
            </Circle>
          ))}
        </Pane>
      </MapContainer>
    </div>
  );
}

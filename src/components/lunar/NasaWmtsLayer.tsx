'use client';

import { useEffect, useState } from 'react';
import * as L from 'leaflet';
import { useMap } from 'react-leaflet';
import { fetchWmtsMetadata, WmtsLayerMetadata } from '@/lib/wmts-utils';
import { NASA_TREK_LAYERS } from '@/lib/moon-wmts-catalog';

interface NasaWmtsLayerProps {
  layerId: string;
  opacity?: number;
}

export default function NasaWmtsLayer({ layerId, opacity = 1 }: NasaWmtsLayerProps) {
  const map = useMap();
  const [metadata, setMetadata] = useState<WmtsLayerMetadata | null>(null);
  const layerInfo = NASA_TREK_LAYERS[layerId];

  useEffect(() => {
    if (!layerId || !layerInfo) return;

    fetchWmtsMetadata(layerId, layerInfo.projection)
      .then((meta) => {
        if (meta) {
          setMetadata(meta);
        }
      })
      .catch((err) => {
        console.warn(`[NAVLUNAR GIS] Error loading layer ${layerId}:`, err);
      });
  }, [layerId, layerInfo]);

  useEffect(() => {
    if (!metadata || !map || !layerInfo) return;

    const NasaTileLayer = (L.TileLayer as any).extend({
      getTileUrl: function (coords: L.Coords) {
        const matrixIndex = coords.z;
        const matrix = metadata.matrices[matrixIndex];

        if (!matrix) {
          // Si no hay matriz en este nivel de zoom, intentamos usar el ID de zoom directamente
          // Esto es común en algunos servicios WMTS de la NASA
          const matrixId = coords.z.toString();
          const ext = metadata.format.split('/')[1] || 'png';
          return metadata.resourceUrl
            .replace('{Style}', metadata.style)
            .replace('{TileMatrixSet}', metadata.matrixSet)
            .replace('{TileMatrix}', matrixId)
            .replace('{TileRow}', coords.y.toString())
            .replace('{TileCol}', coords.x.toString())
            .replace('.{FORMAT}', `.${ext}`)
            .replace('{FORMAT}', ext);
        }

        const ext = metadata.format.split('/')[1] || 'png';
        return metadata.resourceUrl
          .replace('{Style}', metadata.style)
          .replace('{TileMatrixSet}', metadata.matrixSet)
          .replace('{TileMatrix}', matrix.id)
          .replace('{TileRow}', coords.y.toString())
          .replace('{TileCol}', coords.x.toString())
          .replace('.{FORMAT}', `.${ext}`)
          .replace('{FORMAT}', ext);
      },
    });

    const options = {
      opacity,
      minZoom: layerInfo.minZoom,
      maxZoom: layerInfo.maxZoom,
      noWrap: true,
      bounds: layerInfo.projection === 'EQ' 
        ? L.latLngBounds([-90, -180], [90, 180])
        : layerInfo.projection === 'NP'
          ? L.latLngBounds([55, -180], [90, 180])
          : L.latLngBounds([-90, -180], [-55, 180]),
      className: `nasa-layer-${layerId.toLowerCase().replace(/_/g, '-')}`,
    };

    const tileLayer = new NasaTileLayer('', options);
    tileLayer.addTo(map);

    return () => {
      map.removeLayer(tileLayer);
    };
  }, [metadata, map, opacity, layerInfo, layerId]);

  return null;
}

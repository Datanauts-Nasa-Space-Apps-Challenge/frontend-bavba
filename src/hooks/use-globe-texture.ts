'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MapLayersConfig } from '@/types/lunar';
import { NASA_TREK_LAYERS, BlendMode } from '@/lib/moon-wmts-catalog';

const CANVAS_WIDTH = 2048;
const CANVAS_HEIGHT = 1024;

/**
 * Hook to dynamically composite the lunar globe texture.
 * Optimized for GPU performance and tile caching.
 */
export function useGlobeTexture(layers: MapLayersConfig) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const tileCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const polarProjectionCache = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Inicialize canvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    canvasRef.current = canvas;
    
    const tex = new THREE.CanvasTexture(canvas);
    // Optimize: Disable mipmaps for composition canvas to save GPU memory and update time
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.anisotropy = 1; 
    
    setTexture(tex);
  }, []);

  const getTileUrl = (layerId: string, z: number, x: number, y: number) => {
    const layer = NASA_TREK_LAYERS[layerId];
    if (!layer) return '';
    return `https://trek.nasa.gov/tiles/Moon/${layer.projection}/${layer.id}/1.0.0/default/${layer.tileMatrixSet}/${z}/${y}/${x}.${layer.format}`;
  };

  const loadTile = (url: string): Promise<HTMLImageElement> => {
    if (tileCache.current.has(url)) return Promise.resolve(tileCache.current.get(url)!);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        tileCache.current.set(url, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load tile: ${url}`));
    });
  };

  const drawLayer = async (ctx: CanvasRenderingContext2D, layerId: string, config: any) => {
    const layer = NASA_TREK_LAYERS[layerId];
    if (!layer) return;

    ctx.globalAlpha = config.opacity;
    ctx.globalCompositeOperation = config.blendMode === 'normal' ? 'source-over' : config.blendMode;

    if (layer.projection === 'EQ') {
      const z = 2; // Fixed low-res for global composition to save bandwidth
      const tilesX = Math.pow(2, z);
      const tilesY = Math.pow(2, z - 1);
      const tileW = CANVAS_WIDTH / tilesX;
      const tileH = CANVAS_HEIGHT / tilesY;

      for (let ty = 0; ty < tilesY; ty++) {
        for (let tx = 0; tx < tilesX; tx++) {
          try {
            const url = getTileUrl(layerId, z, tx, ty);
            const img = await loadTile(url);
            ctx.drawImage(img, tx * tileW, ty * tileH, tileW, tileH);
          } catch (e) {
            // Silently fail for missing tiles in global view
          }
        }
      }
    } else {
      // Polar Re-projection
      const isNorth = layer.projection === 'NP';
      const poleY = isNorth ? 0 : CANVAS_HEIGHT * 0.75;
      const poleH = CANVAS_HEIGHT * 0.25;
      
      try {
        const url = getTileUrl(layerId, 3, 0, 0); 
        const img = await loadTile(url);
        ctx.drawImage(img, 0, poleY, CANVAS_WIDTH, poleH);
      } catch (e) {}
    }
  };

  useEffect(() => {
    let isMounted = true;

    const compose = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !texture) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Limpiar fondo
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const sortedLayers = Object.entries(layers)
        .filter(([_, cfg]) => cfg.active)
        .sort((a, b) => {
          const lA = NASA_TREK_LAYERS[a[0]];
          const lB = NASA_TREK_LAYERS[b[0]];
          if (lA?.type === 'base' && lB?.type === 'overlay') return -1;
          if (lA?.type === 'overlay' && lB?.type === 'base') return 1;
          return 0;
        });

      for (const [id, cfg] of sortedLayers) {
        if (!isMounted) break;
        await drawLayer(ctx, id, cfg);
      }

      if (isMounted) {
        texture.needsUpdate = true;
      }
    };

    compose();

    return () => {
      isMounted = false;
    };
  }, [layers, texture]);

  return texture;
}


"use client";

import { useState, useRef, useEffect } from "react";
import { Coordinate } from "@/types/lunar";
import { LUNAR_MISSIONS, LUNAR_CRATERS } from "@/data/lunar-data";
import { Crosshair, Plus, Minus, Layers, Info, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LunarMap() {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Coordinate>({ lat: 0, lng: 0 });

  const mapRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - position.x) / zoom;
      const y = (e.clientY - rect.top - position.y) / zoom;
      
      // Rough conversion to lat/lng for visualization
      setMousePos({
        lat: Number(((y / 4) - 45).toFixed(4)),
        lng: Number(((x / 4) - 90).toFixed(4)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10));
  const zoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.5));

  return (
    <div className="relative w-full h-[70vh] bg-[#050505] overflow-hidden border border-white/10 rounded-lg group cursor-crosshair shadow-2xl">
      {/* Background Texture Simulation */}
      <div 
        ref={mapRef}
        className="absolute inset-0 transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 w-[4000px] h-[2000px] lunar-grid opacity-20"></div>
        
        {/* Simplified Surface Representation */}
        <div className="absolute top-[200px] left-[400px] w-[2000px] h-[1000px] opacity-40">
           <img 
            src="https://picsum.photos/seed/moon-surface/2000/1000" 
            alt="Lunar Surface"
            className="w-full h-full object-cover grayscale opacity-30 contrast-125"
           />
        </div>

        {/* Markers */}
        {LUNAR_MISSIONS.map(m => (
          <div 
            key={m.id}
            className="absolute flex flex-col items-center group/marker"
            style={{
              left: `${(m.coordinates.lng + 180) * 10}px`,
              top: `${(90 - m.coordinates.lat) * 10}px`
            }}
          >
            <div className="w-2 h-2 bg-white rounded-full border border-black group-hover/marker:scale-150 transition-transform"></div>
            <div className="hidden group-hover/marker:block absolute top-4 bg-black/90 border border-white/20 p-2 text-[10px] whitespace-nowrap z-50 rounded">
              <p className="font-bold">{m.name}</p>
              <p className="text-white/60">{m.coordinates.lat}, {m.coordinates.lng}</p>
            </div>
          </div>
        ))}
      </div>

      {/* UI Overlays */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button onClick={zoomIn} className="p-2 bg-black/60 border border-white/10 hover:bg-white/10 transition-colors"><Plus className="w-4 h-4" /></button>
        <button onClick={zoomOut} className="p-2 bg-black/60 border border-white/10 hover:bg-white/10 transition-colors"><Minus className="w-4 h-4" /></button>
      </div>

      <div className="absolute bottom-4 right-4 p-3 bg-black/80 border border-white/10 text-[10px] font-mono tracking-tighter">
        <div className="flex gap-4">
          <div>LAT: {mousePos.lat}°</div>
          <div>LNG: {mousePos.lng}°</div>
          <div>SCALE: 1:{(1000000 / zoom).toFixed(0)}</div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex gap-2">
        <button className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/10">
          <Layers className="w-3 h-3" /> Layers
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-black/60 border border-white/10 text-[10px] uppercase tracking-widest hover:bg-white/10">
          <MapIcon className="w-3 h-3" /> Grid
        </button>
      </div>

      {/* Map Decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-4 left-4 text-[10px] text-white/20 uppercase tracking-[0.3em]">
          Tactical Navigation System · V 2.4.1
        </div>
        <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-8 text-[8px] text-white/10 vertical-text">
          <span>00° N</span>
          <span>30° N</span>
          <span>60° N</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  FastForward, 
  Rewind
} from 'lucide-react';
import { format } from 'date-fns';
import { CelestialPositions } from '@/lib/lunar-ephemeris';

interface SimulationControlsProps {
  timestamp: number;
  onTimestampChange: (ts: number) => void;
  speed: number;
  onSpeedChange: (s: number) => void;
  isActive: boolean;
  onToggle: () => void;
  telemetry: CelestialPositions | null;
}

export default function SimulationControls({
  timestamp,
  onTimestampChange,
  speed,
  onSpeedChange,
  isActive,
  onToggle,
  telemetry
}: SimulationControlsProps) {
  const [isPaused, setIsPaused] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isPaused || !isActive || timestamp === 0 || !mounted) return;

    const interval = setInterval(() => {
      // Speed is hours per real second
      const increment = (speed * 60 * 60 * 1000) / 60; 
      onTimestampChange(timestamp + increment);
    }, 16);

    return () => clearInterval(interval);
  }, [isPaused, isActive, speed, timestamp, onTimestampChange, mounted]);

  // Prevent hydration mismatch by not rendering on server or before client mount
  if (!isActive || !mounted) return null;

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 pointer-events-none animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 shadow-2xl pointer-events-auto rounded-lg">
        {/* Telemetry Bar */}
        <div className="grid grid-cols-4 gap-4 mb-4 border-b border-white/5 pb-4">
          <TelemetryItem 
            label="UTC Simulation Time" 
            value={timestamp > 0 ? format(new Date(timestamp), 'yyyy-MM-dd HH:mm') : '---'} 
          />
          <TelemetryItem 
            label="Subsolar Point" 
            value={telemetry ? `${telemetry.subSolarLat.toFixed(1)}°N, ${telemetry.subSolarLon.toFixed(1)}°E` : '---'} 
          />
          <TelemetryItem 
            label="Illumination" 
            value={telemetry ? `${(telemetry.illuminationFraction * 100).toFixed(1)}%` : '---'} 
          />
          <TelemetryItem 
            label="Phase Angle" 
            value={telemetry ? `${telemetry.lunarPhaseAngle.toFixed(1)}°` : '---'} 
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <div className="flex bg-white/5 p-1 rounded border border-white/5">
            <ControlButton onClick={() => onSpeedChange(-24)} icon={<Rewind className="w-3.5 h-3.5" />} active={speed === -24} />
            <ControlButton onClick={() => setIsPaused(!isPaused)} icon={isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />} />
            <ControlButton onClick={() => onSpeedChange(1)} icon={<Play className="w-3.5 h-3.5" />} active={speed === 1} label="1x" />
            <ControlButton onClick={() => onSpeedChange(6)} icon={<FastForward className="w-3.5 h-3.5" />} active={speed === 6} label="6h" />
            <ControlButton onClick={() => onSpeedChange(24)} icon={<FastForward className="w-3.5 h-3.5" />} active={speed === 24} shadow label="1d" />
            
            <div className="w-px bg-white/10 mx-1 h-6 self-center" />
            
            <button 
              onClick={() => onTimestampChange(Date.now())}
              className="px-3 py-1.5 text-[8px] uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors font-bold"
            >
              Real Time
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-[8px] uppercase tracking-widest text-white/30 font-bold">
               <span>Synodic Scrubber</span>
               <span>Velocity: {speed}h/s</span>
            </div>
            <Slider 
              value={[timestamp]} 
              onValueChange={(v) => onTimestampChange(v[0])}
              min={Date.now() - 2592000000} // -30 days
              max={Date.now() + 2592000000} // +30 days
              step={3600000}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TelemetryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[8px] uppercase tracking-widest text-white/20 font-bold">
        {label}
      </div>
      <div className="text-[11px] font-mono text-white/80 uppercase">{value}</div>
    </div>
  );
}

function ControlButton({ onClick, icon, active, label, shadow }: { onClick: () => void; icon: React.ReactNode; active?: boolean; label?: string; shadow?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-9 h-9 flex flex-col items-center justify-center rounded transition-all relative ${active ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      {label && <span className="text-[6px] absolute bottom-1 font-bold">{label}</span>}
    </button>
  );
}

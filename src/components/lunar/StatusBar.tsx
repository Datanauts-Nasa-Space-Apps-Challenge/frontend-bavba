'use client';

import { useState, useEffect } from 'react';
import { getLGRSCode } from '@/lib/lgrs';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';

interface StatusBarProps {
  selectedPoint: { lat: number; lng: number } | null;
  viewMode?: string;
  isLoading?: boolean;
}

export default function StatusBar({ selectedPoint, viewMode, isLoading }: StatusBarProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lgrs = selectedPoint ? getLGRSCode(selectedPoint.lat, selectedPoint.lng).code : '---';

  const getLTC = (date: Date) => {
    const cycle = 29.53059 * 24 * 60 * 60 * 1000;
    const ref = new Date('2000-01-06T18:14:00Z').getTime();
    const elapsed = date.getTime() - ref;
    const day = Math.floor((elapsed % cycle) / (24 * 60 * 60 * 1000)) + 1;
    return `D${day.toString().padStart(2, '0')}.${format(date, 'HH:mm:ss')}`;
  };

  const timeStringUTC = now ? format(now, 'HH:mm:ss') : '--:--:--';
  const timeStringLTC = now ? getLTC(now) : '--:--:--';

  return (
    <footer className="h-10 border-t border-white/10 bg-black flex items-center justify-between px-8 text-[9px] uppercase tracking-[0.25em] text-white/30 font-mono flex-shrink-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          ENGINE: {isLoading ? 'PROCESSING' : 'NOMINAL'}
          <GlossaryBtn term="Cartographic Tile Engine: Indicates real-time processing and loading of NASA WMTS data." />
        </div>
        <div className="hidden lg:flex items-center gap-2">
          DATUM: MOON_ME_IAU2000
          <GlossaryBtn term="Coordinate Reference System: Using IAU Mean Earth/Rotation Axis lunar cartographic frame." />
        </div>
        {viewMode && (
          <div className="hidden md:block">
            VIEW: {viewMode.replace('_', ' ')}
          </div>
        )}
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <span>COORD:</span>
          <span className="min-w-[140px]">
            {selectedPoint ? `${selectedPoint.lat.toFixed(4)}°N, ${selectedPoint.lng.toFixed(4)}°E` : '0.0000, 0.0000'}
          </span>
        </div>
        <div className="flex items-center gap-4 border-l border-white/10 pl-8">
          <span>LGRS:</span>
          <span className="min-w-[100px]">{lgrs}</span>
          <GlossaryBtn term="Lunar Grid Reference System: Tactical coordinate indexing V2.1." />
        </div>
        <div className="flex items-center gap-4 border-l border-white/10 pl-8">
          <span>UTC: {timeStringUTC}</span>
          <GlossaryBtn term="Coordinated Universal Time (Earth Standard)." />
        </div>
        <div className="flex items-center gap-4 border-l border-white/10 pl-8">
          <span>LTC: {timeStringLTC}</span>
          <GlossaryBtn term="Lunar Time Control: Local mission time based on the synodic cycle phases." />
        </div>
      </div>
    </footer>
  );
}

function GlossaryBtn({ term }: { term: string }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-white/10 hover:text-white/40 transition-colors cursor-help p-0.5">
            <HelpCircle className="w-2.5 h-2.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/95 border-white/10 text-[9px] text-white/60 p-2 max-w-[160px] leading-relaxed rounded-none backdrop-blur-md">
          {term}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

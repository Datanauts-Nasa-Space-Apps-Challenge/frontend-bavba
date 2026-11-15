
'use client';

import { EvaluationPoint } from '@/types/lunar';
import { cn } from '@/lib/utils';
import { X, Target, Zap, Clock, TrendingUp } from 'lucide-react';
import { getLGRSCode } from '@/lib/lgrs';
import { LUNAR_FEATURES } from '@/data/lunar-features';

interface SiteCardProps {
  point: EvaluationPoint;
  isHighlighted: boolean;
  onRemove: (id: string) => void;
  onHover: (id: string | null) => void;
}

export default function SiteCard({ point, isHighlighted, onRemove, onHover }: SiteCardProps) {
  const lgrs = getLGRSCode(point.latitude, point.longitude);
  const feature = LUNAR_FEATURES.find(f => f.id === point.siteId);

  return (
    <div 
      onMouseEnter={() => onHover(point.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "group relative flex flex-col p-5 bg-[#0a0a0a] border transition-all duration-300 rounded-lg",
        isHighlighted ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]" : "border-white/10 hover:border-white/20"
      )}
    >
      <button 
        onClick={() => onRemove(point.id)}
        className="absolute top-3 right-3 p-1.5 text-white/20 hover:text-white transition-colors hover:bg-white/5 rounded"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="mb-4 pr-8">
        <div className="text-[8px] font-bold uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2" style={{ color: point.color }}>
          <Target className="w-2.5 h-2.5" /> Candidate ID: {point.id.slice(0, 8)}
        </div>
        <h4 className="text-sm font-bold text-white truncate">{point.name}</h4>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-white/20 uppercase tracking-widest">LGRS Ref</span>
          <span className="text-blue-400 font-bold">{lgrs.code}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Elev" value={`${feature?.elevation?.toLocaleString() || 0}m`} icon={<TrendingUp className="w-2.5 h-2.5" />} />
          <Metric label="Time" value={`T+${point.timestamp}h`} icon={<Clock className="w-2.5 h-2.5" />} />
        </div>

        <div className="p-3 bg-white/[0.02] border border-white/5 rounded space-y-2">
           <div className="flex justify-between text-[8px] uppercase tracking-widest">
              <span className="text-white/20">Slope Profile</span>
              <span className="text-white/60">{feature?.slopeAvg || 5.0}°</span>
           </div>
           <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all duration-500", (feature?.slopeAvg || 0) > 15 ? "bg-amber-500" : "bg-green-500")}
                style={{ width: `${Math.min(100, ((feature?.slopeAvg || 0) / 30) * 100)}%` }}
              />
           </div>
        </div>
      </div>

      <div className="flex gap-2">
        <span className="text-[7px] font-bold uppercase px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 tracking-widest">
          {feature?.status || 'Proposed'}
        </span>
        <span className="text-[7px] font-bold uppercase px-2 py-0.5 bg-white/5 text-white/30 rounded border border-white/10 tracking-widest">
          {point.horizon}h Window
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-2 bg-white/[0.03] border border-white/5 rounded">
      <div className="flex items-center gap-1.5 opacity-20">
        {icon}
        <span className="text-[7px] font-bold tracking-widest uppercase">{label}</span>
      </div>
      <span className="font-mono text-[9px] text-white/80">{value}</span>
    </div>
  );
}

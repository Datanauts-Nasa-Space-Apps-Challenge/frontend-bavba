'use client';

import { EvaluationPoint } from '@/types/lunar';
import { cn } from '@/lib/utils';
import { MASTER_CATALOG } from '@/data/lunar-features';
import { getLGRSCode } from '@/lib/lgrs';
import { calculateSimulatedIllumination } from '@/lib/lunar-engine';

interface ComparisonTableProps {
  points: EvaluationPoint[];
  highlightedId: string | null;
  onHover: (id: string | null) => void;
}

export default function ComparisonTable({ points, highlightedId, onHover }: ComparisonTableProps) {
  const params = [
    { label: 'Latitude', format: (p: EvaluationPoint) => p.latitude.toFixed(4) + '°' },
    { label: 'Longitude', format: (p: EvaluationPoint) => p.longitude.toFixed(4) + '°' },
    { label: 'LGRS Code', format: (p: EvaluationPoint) => getLGRSCode(p.latitude, p.longitude).code },
    { label: 'Elevation', format: (p: EvaluationPoint) => {
        const f = MASTER_CATALOG.find(f => f.id === p.siteId);
        return (f?.elevation || 0).toLocaleString() + 'm';
      }
    },
    { label: 'Avg Slope', format: (p: EvaluationPoint) => {
        const f = MASTER_CATALOG.find(f => f.id === p.siteId);
        return (f?.slopeAvg || 5.0).toFixed(1) + '°';
      }
    },
    { label: 'Sun Vis.', format: (p: EvaluationPoint) => {
        const illum = calculateSimulatedIllumination(p.latitude, p.longitude, p.timestamp);
        return illum + '%';
      }
    },
    { label: 'Time Offset', format: (p: EvaluationPoint) => 'T+' + Math.floor(p.timestamp / 3600000) + 'h' },
  ];

  return (
    <div className="overflow-x-auto custom-scrollbar border border-white/10 bg-black/20">
      <table className="w-full text-[9px] border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="p-3 text-left font-bold text-white/30 uppercase tracking-[0.1em] sticky left-0 bg-[#0a0a0a] z-20 min-w-[120px]">
              Parameter
            </th>
            {points.map(p => (
              <th 
                key={p.id} 
                className={cn(
                  "p-3 text-center transition-all duration-300 min-w-[100px]",
                  highlightedId === p.id ? "text-blue-400 bg-blue-500/5" : "text-white/60"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                   <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                   <span className="truncate max-w-[80px]">{p.name.split('-')[0]}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {params.map((param, idx) => (
            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
              <td className="p-3 font-mono text-white/30 sticky left-0 bg-[#0a0a0a] z-10 border-r border-white/5 group-hover:text-white transition-colors">
                {param.label}
              </td>
              {points.map(p => (
                <td 
                  key={p.id} 
                  onMouseEnter={() => onHover(p.id)}
                  onMouseLeave={() => onHover(null)}
                  className={cn(
                    "p-3 text-center font-mono transition-all",
                    highlightedId === p.id ? "text-white bg-blue-500/5" : "text-white/80"
                  )}
                >
                  {param.format(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

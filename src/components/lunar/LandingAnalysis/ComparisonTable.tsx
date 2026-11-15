
'use client';

import { EvaluationPoint } from '@/types/lunar';
import { cn } from '@/lib/utils';
import { LUNAR_FEATURES } from '@/data/lunar-features';
import { getLGRSCode } from '@/lib/lgrs';
import { calculateSimulatedIllumination } from '@/lib/lunar-engine';

interface ComparisonTableProps {
  points: EvaluationPoint[];
  highlightedId: string | null;
  onHover: (id: string | null) => void;
}

export default function ComparisonTable({ points, highlightedId, onHover }: ComparisonTableProps) {
  const params = [
    { label: 'Latitude', format: (p: EvaluationPoint) => p.latitude.toFixed(4) + '°N' },
    { label: 'Longitude', format: (p: EvaluationPoint) => p.longitude.toFixed(4) + '°E' },
    { label: 'LGRS Code', format: (p: EvaluationPoint) => getLGRSCode(p.latitude, p.longitude).code },
    { label: 'Elevation', format: (p: EvaluationPoint) => {
        const f = LUNAR_FEATURES.find(f => f.id === p.siteId);
        return (f?.elevation || 0).toLocaleString() + 'm';
      }
    },
    { label: 'Avg Slope', format: (p: EvaluationPoint) => {
        const f = LUNAR_FEATURES.find(f => f.id === p.siteId);
        return (f?.slopeAvg || 0).toFixed(1) + '°';
      }
    },
    { label: 'Sun Visibility', format: (p: EvaluationPoint) => {
        const illum = calculateSimulatedIllumination(p.latitude, p.longitude, p.timestamp);
        return illum + '%';
      }
    },
    { label: 'PSR Proximity', format: (p: EvaluationPoint) => {
        const f = LUNAR_FEATURES.find(f => f.id === p.siteId);
        return (f?.psrProximity || 5.0).toFixed(2) + 'km';
      }
    },
    { label: 'Analysis Time', format: (p: EvaluationPoint) => 'T+' + p.timestamp + 'h' },
    { label: 'Hazard Density', format: (p: EvaluationPoint) => {
        const f = LUNAR_FEATURES.find(f => f.id === p.siteId);
        return (f?.hazardDensity || 0) + '%';
      }
    },
  ];

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="p-4 text-left font-bold text-white/30 uppercase tracking-[0.2em] sticky left-0 bg-[#050505] z-20 min-w-[200px]">
              Scientific Parameter
            </th>
            {points.map(p => (
              <th 
                key={p.id} 
                className={cn(
                  "p-4 text-center transition-all duration-300 min-w-[160px]",
                  highlightedId === p.id ? "text-blue-400 bg-blue-500/5" : "text-white/60"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                   {p.name.split('-')[0]}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {params.map((param, idx) => (
            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
              <td className="p-4 font-mono text-white/30 sticky left-0 bg-[#050505] z-10 border-r border-white/5 group-hover:text-white transition-colors">
                {param.label}
              </td>
              {points.map(p => (
                <td 
                  key={p.id} 
                  onMouseEnter={() => onHover(p.id)}
                  onMouseLeave={() => onHover(null)}
                  className={cn(
                    "p-4 text-center font-mono transition-all",
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

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function RoutePlanner() {
  const [origin, setOrigin] = useState("Apollo 15");
  const [destination, setDestination] = useState("Mons Hadley Delta");
  const [vehicle, setVehicle] = useState("apollo");
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState<string | null>(null);

  const handlePlanRoute = () => {
    setCalculating(true);
    setResults(null);
    // Simulate scientific calculation
    setTimeout(() => {
      setResults(
        "Night at Apollo 15 until 10:31 UTC. Leaving at sunrise: 13.5 km by Apollo rover, 2 h 26 min, 32 min in terrain shadow."
      );
      setCalculating(false);
    }, 1200);
  };

  return (
    <div className="max-w-xl animate-in fade-in duration-1000">
      <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-8 tracking-tight text-white">
        Plan a route anywhere on the Moon.
      </h1>

      <p className="text-white/60 text-lg leading-relaxed mb-12 max-w-lg">
        Terrain-aware directions on foot, by rover, or with VIPER's profile. 
        Distance, travel time, slopes, and sunlight along the way, built on 
        NASA's open terrain data.
      </p>

      <div className="bg-[#121212] border border-white/5 p-8 rounded-xl shadow-2xl">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold ml-1">From</label>
            <Input 
              value={origin} 
              onChange={e => setOrigin(e.target.value)}
              className="bg-[#1a1a1a] border-white/10 h-12 text-sm focus:ring-accent rounded-md text-white placeholder:text-white/20"
              placeholder="Origin"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold ml-1">To</label>
            <Input 
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className="bg-[#1a1a1a] border-white/10 h-12 text-sm focus:ring-accent rounded-md text-white placeholder:text-white/20"
              placeholder="Destination"
            />
          </div>
        </div>

        <div className="flex items-end gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold ml-1">Vehicle</label>
            <Select value={vehicle} onValueChange={setVehicle}>
              <SelectTrigger className="bg-[#1a1a1a] border-white/10 h-12 text-sm rounded-md text-white">
                <SelectValue placeholder="Select Vehicle" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                <SelectItem value="foot">On foot</SelectItem>
                <SelectItem value="apollo">Apollo rover</SelectItem>
                <SelectItem value="viper">VIPER</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handlePlanRoute}
            disabled={calculating}
            className="bg-[#2a3a4a] text-white hover:bg-[#3a4a5a] h-12 px-8 rounded-md font-bold transition-all border border-white/20 shadow-lg min-w-[140px]"
          >
            {calculating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Plan route"}
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {results ? (
          <p className="text-[14px] text-white/80 leading-relaxed font-body">
            {results}
          </p>
        ) : (
          <div className="h-6"></div>
        )}
      </div>
    </div>
  );
}

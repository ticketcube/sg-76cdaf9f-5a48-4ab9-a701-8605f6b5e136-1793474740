import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { WORLD_DOTS, DOT_LAT_TOP, DOT_STEP } from "@/lib/worldDots";

interface ListenerSpot {
  lat: number;
  lon: number;
  count: number;
  label: string;
}

interface ListenersData {
  total: number;
  located: number;
  spots: ListenerSpot[];
  source: "live" | "demo" | "unconfigured" | "error";
}

const REFRESH_MS = 30000;

export function ListenerMap() {
  const [data, setData] = useState<ListenersData | null>(null);
  const [prevTotal, setPrevTotal] = useState(0);
  const [showTick, setShowTick] = useState(false);

  useEffect(() => {
    const fetchListeners = async () => {
      try {
        const response = await fetch("/api/listeners-map");
        if (response.ok) {
          const result = await response.json();
          
          if (result.total !== prevTotal && prevTotal > 0) {
            setShowTick(true);
            setTimeout(() => setShowTick(false), 500);
          }
          
          setPrevTotal(result.total);
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch listeners:", error);
        setData({
          total: 0,
          located: 0,
          spots: [],
          source: "error"
        });
      }
    };

    fetchListeners();
    const interval = setInterval(fetchListeners, REFRESH_MS);
    return () => clearInterval(interval);
  }, [prevTotal]);

  const maxCount = Math.max(1, ...(data?.spots.map((s) => s.count) ?? [1]));
  const showCount = !data || data.total >= 5;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">
            {showCount ? "Live Listeners" : "Listening now"}
          </span>
        </div>
        {showCount && data && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span 
              className={`font-mono text-xs text-foreground tabular-nums transition-all duration-300 ${
                showTick ? 'scale-110 text-primary' : ''
              }`}
            >
              {data.total.toLocaleString("en-US")}
            </span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative w-full bg-background/50 rounded-lg border border-muted/20 overflow-hidden" style={{ aspectRatio: '2/1' }}>
        <svg
          viewBox="0 0 360 180"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          role="img"
          aria-label={
            data?.source === "live" 
              ? `${data.total} people listening to OTW Radio right now`
              : "OTW Radio listener map"
          }
        >
          {/* World land mask as dot matrix */}
          {WORLD_DOTS.map((row, rowIndex) => {
            const lat = DOT_LAT_TOP - rowIndex * DOT_STEP;
            const y = 90 - lat; // Convert lat to y coordinate (0 at north pole, 180 at south)
            
            return Array.from(row).map((cell, colIndex) => {
              if (cell !== "1") return null;
              
              const lon = -180 + colIndex * DOT_STEP;
              const x = lon + 180; // Convert lon to x coordinate (0 at -180, 360 at +180)
              
              return (
                <circle
                  key={`${colIndex}-${rowIndex}`}
                  cx={x}
                  cy={y}
                  r="0.4"
                  className="fill-foreground/20"
                />
              );
            });
          })}

          {/* Listener spots */}
          {data?.spots.map((s, idx) => {
            // Equirectangular projection
            const x = s.lon + 180;
            const y = 90 - s.lat;
            
            // Size by listener count (smaller base size)
            const baseR = 0.8;
            const r = baseR + 1.2 * Math.sqrt(s.count / maxCount);
            
            return (
              <g key={`${s.lat},${s.lon}-${idx}`}>
                {/* Pulsing outer glow */}
                <circle cx={x} cy={y} r={r * 2.5} className="fill-foreground/10">
                  <animate
                    attributeName="r"
                    values={`${r * 2.5};${r * 3.5};${r * 2.5}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0;0.3"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Core dot */}
                <circle cx={x} cy={y} r={r} className="fill-foreground/90">
                  <title>{s.label}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
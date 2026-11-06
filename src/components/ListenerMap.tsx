import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { WORLD_DOTS } from "@/lib/worldDots";

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
          viewBox="0 0 360 139"
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
          {WORLD_DOTS.map((row, y) =>
            Array.from(row).map((cell, x) =>
              cell === "1" ? (
                <circle
                  key={`${x}-${y}`}
                  cx={x}
                  cy={y}
                  r="0.3"
                  className="fill-foreground/20"
                />
              ) : null
            )
          )}

          {/* Listener spots - crimson antenna markers */}
          {data?.spots.map((s, idx) => {
            const x = (s.lon + 180) * 2;
            const y = 90 - s.lat;
            const baseR = 1.2;
            const r = baseR + 1.5 * Math.sqrt(s.count / maxCount);
            
            return (
              <g key={`${s.lat},${s.lon}-${idx}`}>
                {/* Pulsing outer glow */}
                <circle cx={x} cy={y} r={r * 2.5} className="fill-primary/20">
                  <animate
                    attributeName="r"
                    values={`${r * 2.5};${r * 3.5};${r * 2.5}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0;0.4"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Core crimson dot */}
                <circle cx={x} cy={y} r={r} className="fill-primary">
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
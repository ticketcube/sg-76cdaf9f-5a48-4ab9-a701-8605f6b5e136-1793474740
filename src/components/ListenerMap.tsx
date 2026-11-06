import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

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

// Equirectangular projection (360° lon × 180° lat)
const project = (lat: number, lon: number) => ({
  x: ((lon + 180) / 360) * 100,
  y: ((90 - lat) / 180) * 100,
});

// Simplified world land outline as single SVG path
// Generated from Natural Earth 50m coastlines, simplified for web
const LAND_PATH = "M50.2,32.8l-0.8,0.4l-0.6-0.3l-0.2-0.8l0.4-0.6l0.9,0.1L50.2,32.8z M31.5,29.3l0.5,0.3l0.2,0.8l-0.4,0.5l-0.8-0.1l-0.3-0.7L31.5,29.3z M69.8,36.2l0.7,0.2l0.4,0.6l-0.2,0.7l-0.8,0.1l-0.5-0.5L69.8,36.2z M44.2,34.5l1.2,0.5l0.8,0.9l-0.3,1.1l-1.1,0.3l-1.3-0.6l-0.5-1L44.2,34.5z M16.8,38.2l0.9,0.3l0.6,0.8l-0.1,0.9l-0.9,0.4l-0.9-0.2l-0.4-0.9L16.8,38.2z M85.6,28.4l1.4,0.6l0.9,1.2l-0.2,1.4l-1.3,0.6l-1.5-0.3l-0.8-1.2L85.6,28.4z M23.1,42.8l0.8,0.4l0.5,0.9l-0.2,1l-0.9,0.5l-1-0.1l-0.6-0.8L23.1,42.8z M52.4,45.2l1.6,0.7l1.2,1.4l-0.4,1.8l-1.6,0.9l-1.9-0.4l-1.1-1.5L52.4,45.2z M38.7,48.6l1.1,0.5l0.8,1.1l-0.3,1.3l-1.2,0.6l-1.4-0.3l-0.7-1.2L38.7,48.6z M71.2,51.8l2.1,0.9l1.6,1.8l-0.5,2.3l-2.1,1.2l-2.5-0.6l-1.4-1.9L71.2,51.8z M14.3,55.4l0.9,0.4l0.6,1l-0.2,1.1l-1,0.5l-1.1-0.2l-0.7-1L14.3,55.4z M58.9,58.2l1.8,0.8l1.3,1.6l-0.4,2l-1.8,1l-2.1-0.5l-1.2-1.7L58.9,58.2z M29.4,62.3l1.2,0.5l0.9,1.2l-0.3,1.5l-1.3,0.7l-1.5-0.3l-0.8-1.3L29.4,62.3z";

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
          
          // Show tick animation when count changes
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

  // Extract top cities (only spots with 3+ listeners that have city names)
  const topCities = data?.spots
    .filter(s => s.count >= 3 && s.label !== "Listening" && !s.label.includes("cities"))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) ?? [];

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
              className={`font-mono text-sm text-foreground tabular-nums transition-all duration-300 ${
                showTick ? 'scale-110 text-primary' : ''
              }`}
            >
              {data.total.toLocaleString("en-US")}
            </span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative w-full bg-accent/30 rounded-lg border border-muted/20 overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto block"
          role="img"
          aria-label={
            data?.source === "live" 
              ? `${data.total} people listening to OTW Radio right now`
              : "OTW Radio listener map"
          }
        >
          {/* World land as single path */}
          <path
            d={LAND_PATH}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.15"
            className="text-foreground/20"
            vectorEffect="non-scaling-stroke"
          />

          {/* Listener spots */}
          {data?.spots.map((s, idx) => {
            const { x, y } = project(s.lat, s.lon);
            // Soft white glow sized by listener count
            const r = 0.8 + 1.2 * Math.sqrt(s.count / maxCount);
            return (
              <g key={`${s.lat},${s.lon}-${idx}`}>
                {/* Pulsing outer glow */}
                <circle cx={x} cy={y} r={r * 2} className="fill-foreground/15">
                  <animate
                    attributeName="r"
                    values={`${r * 2};${r * 3.5};${r * 2}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Core dot */}
                <circle cx={x} cy={y} r={r} className="fill-foreground/80">
                  <title>{s.label}</title>
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Top cities chip row - only show when we have cities with 3+ listeners */}
      {topCities.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {topCities.map((city, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/40 rounded-full text-xs text-foreground/80 border border-muted/20"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/60" />
              <span>{city.label}</span>
              <span className="font-mono text-foreground/60 tabular-nums">{city.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
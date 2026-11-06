import { useEffect, useState, memo } from "react";
import { Radio } from "lucide-react";
import { DOT_LAT_TOP, DOT_STEP, LAND_ROWS } from "@/lib/worldDots";

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

const COLS = LAND_ROWS[0].length;
const ROWS = LAND_ROWS.length;
const REFRESH_MS = 30000;

const project = (lat: number, lon: number) => ({
  x: (lon + 180) / DOT_STEP,
  y: (DOT_LAT_TOP - lat) / DOT_STEP + 0.5,
});

const LandDots = memo(function LandDots() {
  const dots: JSX.Element[] = [];
  LAND_ROWS.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "1") {
        dots.push(<circle key={`${x}-${y}`} cx={x + 0.5} cy={y + 0.5} r={0.3} />);
      }
    }
  });
  return <g className="fill-foreground/20">{dots}</g>;
});

export function ListenerMap() {
  const [data, setData] = useState<ListenersData | null>(null);

  useEffect(() => {
    const fetchListeners = async () => {
      try {
        const response = await fetch("/api/listeners-map");
        if (response.ok) {
          const result = await response.json();
          setData({
            total: result.total,
            located: result.located,
            spots: result.spots,
            source: "live"
          });
        }
      } catch (error) {
        console.error("Failed to fetch listeners:", error);
      }
    };

    fetchListeners();
    const interval = setInterval(fetchListeners, REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const maxCount = Math.max(1, ...(data?.spots.map((s) => s.count) ?? [1]));

  return (
    <div className="w-full bg-accent/30 rounded-lg p-4 border border-muted/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">Live Listeners</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-sm text-foreground tabular-nums">
            {data ? data.total.toLocaleString("en-US") : "--"}
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${COLS} ${ROWS}`}
        className="w-full h-auto block"
        role="img"
        aria-label={`${data?.total || 0} people listening to OTW Radio right now`}
      >
        <LandDots />
        {data?.spots.map((s, idx) => {
          const { x, y } = project(s.lat, s.lon);
          const r = 0.9 + 2.6 * Math.sqrt(s.count / maxCount);
          return (
            <g key={`${s.lat},${s.lon}-${idx}`}>
              <circle cx={x} cy={y} r={r} className="fill-primary/25">
                <animate
                  attributeName="r"
                  values={`${r};${r * 1.8};${r}`}
                  dur="3s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0;0.6"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={x} cy={y} r={r * 0.55} className="fill-primary">
                <title>{`${s.label}: ${s.count} listening`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
import { useEffect, useState, memo, useRef } from "react";
import { Radio } from "lucide-react";
import { DOT_LAT_TOP, DOT_STEP, LAND_ROWS } from "@/lib/worldDots";
import { MapOverlayManager } from "./map/MapOverlayManager";
import { MoodMapOverlay } from "./map/MoodMapOverlay";
import { ShowsMapOverlay } from "./map/ShowsMapOverlay";

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
  const svgRef = useRef<SVGSVGElement>(null);

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
    <div className="relative w-full h-full bg-background">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 ${mapSize.width} ${mapSize.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* World map base */}
        <g>
          {worldDots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.x}
              cy={dot.y}
              r={1.5}
              fill="hsl(var(--muted))"
              opacity={0.3}
            />
          ))}
        </g>

        {/* Listener dots */}
        <g>
          {listeners.map((listener) => {
            const x = ((listener.lng + 180) / 360) * mapSize.width;
            const latRad = (listener.lat * Math.PI) / 180;
            const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
            const y = (mapSize.height / 2) - (mapSize.width * mercN) / (2 * Math.PI);

            return (
              <g key={listener.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={3}
                  fill="hsl(var(--primary))"
                  opacity={0.8}
                />
              </g>
            );
          })}
        </g>

        {/* Overlay layers - mood dots + show pins */}
        <MapOverlayManager width={mapSize.width} height={mapSize.height}>
          <MoodMapOverlay 
            width={mapSize.width} 
            height={mapSize.height}
            cities={Object.values(
              listeners.reduce((acc, l) => {
                if (!acc[l.city]) {
                  acc[l.city] = { city: l.city, lat: l.lat, lng: l.lng };
                }
                return acc;
              }, {} as Record<string, { city: string; lat: number; lng: number }>)
            )}
          />
          <ShowsMapOverlay 
            width={mapSize.width} 
            height={mapSize.height}
          />
        </MapOverlayManager>
      </svg>

      {/* Stats panel */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg p-4 border">
        <div className="text-sm">
          <div className="font-semibold mb-1">Live Listeners</div>
          <div className="text-2xl font-bold text-primary">{listeners.length}</div>
          <div className="text-xs text-muted mt-1">
            {Object.keys(listeners.reduce((acc, l) => ({ ...acc, [l.city]: true }), {})).length} cities
          </div>
        </div>
      </div>
    </div>
  );
}
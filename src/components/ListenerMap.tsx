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

  // Convert spots to city list for mood overlay
  const cities = data?.spots.map(spot => ({
    city: spot.label,
    lat: spot.lat,
    lng: spot.lon
  })) || [];

  return (
    <div className="relative w-full h-full bg-background">
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 ${COLS} ${ROWS}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <LandDots />

        {data?.spots.map((spot, idx) => {
          const { x, y } = project(spot.lat, spot.lon);
          const r = 0.4 + (0.6 * spot.count) / maxCount;
          return (
            <g key={idx}>
              <circle
                cx={x}
                cy={y}
                r={r * 1.8}
                className="fill-primary/20"
              />
              <circle cx={x} cy={y} r={r} className="fill-primary" />
            </g>
          );
        })}

        {/* Overlay layers use same coordinate system as main map */}
        <MapOverlayManager width={COLS} height={ROWS}>
          <MoodMapOverlay 
            width={COLS} 
            height={ROWS}
            cities={cities}
          />
          <ShowsMapOverlay 
            width={COLS} 
            height={ROWS}
          />
        </MapOverlayManager>
      </svg>

      <div className="absolute top-2 left-2 flex items-center gap-2 rounded-md bg-background/80 px-3 py-1.5 text-sm backdrop-blur-sm">
        <Radio className="h-4 w-4 animate-pulse text-primary" />
        <span className="font-semibold">{data?.total ?? 0}</span>
        <span className="text-muted-foreground">
          {data?.located ?? 0} located
        </span>
      </div>
    </div>
  );
}
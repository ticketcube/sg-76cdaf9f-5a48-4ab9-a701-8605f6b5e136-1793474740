import { useEffect, useState, memo, useRef } from "react";
import { Headphones } from "lucide-react";
import { DOT_LAT_TOP, DOT_STEP, LAND_ROWS } from "@/lib/worldDots";
import { MapOverlayManager } from "./map/MapOverlayManager";
import { MoodMapOverlay } from "./map/MoodMapOverlay";
import { ShowsMapOverlay } from "./map/ShowsMapOverlay";
import { supabase } from "@/integrations/supabase/client";

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

interface MoodCategory {
  id: string;
  category_name: string;
  emoji: string;
  label: string;
  color_hsl: string;
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
  const [moods, setMoods] = useState<MoodCategory[]>([]);
  const [moodEnabled, setMoodEnabled] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch mood categories for legend
  useEffect(() => {
    const fetchMoods = async () => {
      try {
        // Check feature flag
        const flagResponse = await fetch("/api/admin/feature-flags");
        const flagData = await flagResponse.json();
        const moodFlag = flagData.data?.find((f: any) => f.flag_name === "mood_tracker_enabled");
        const isEnabled = moodFlag?.enabled === true;
        setMoodEnabled(isEnabled);

        if (isEnabled) {
          const { data: moodData } = await supabase
            .from("mood_categories")
            .select("id, category_name, emoji, label, color_hsl")
            .eq("enabled", true)
            .order("display_order");

          if (moodData) {
            setMoods(moodData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch mood categories:", error);
      }
    };

    fetchMoods();
  }, []);

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
  const total = data?.total ?? 0;

  // Convert spots to city list for mood overlay
  const cities = data?.spots
    .map(spot => {
      const cityName = spot.label.includes(',') 
        ? spot.label.split(',')[0].trim() 
        : spot.label;
      return {
        city: cityName,
        lat: spot.lat,
        lng: spot.lon
      };
    })
    .filter(c => c.city !== "Unknown" && c.city !== "United States") || [];

  return (
    <div className="bg-accent rounded-lg p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        {/* Left side - Live Vibes with mood legend */}
        <div className="flex items-center gap-3">
          {moodEnabled && moods.length > 0 ? (
            <>
              <span className="font-semibold text-foreground text-sm">Live Vibes</span>
              <div className="flex items-center gap-1.5">
                {moods.map(mood => (
                  <div
                    key={mood.id}
                    className="flex items-center justify-center w-7 h-7 rounded"
                    style={{ backgroundColor: `hsl(${mood.color_hsl})` }}
                    title={mood.label}
                  >
                    <span className="text-sm">{mood.emoji}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <Headphones className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">Listening now</span>
            </>
          )}
        </div>

        {/* Right side - Listener count */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-sm text-foreground tabular-nums">
            {data ? total.toLocaleString("en-US") : "--"}
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${COLS} ${ROWS}`}
          className="w-full h-auto block"
          role="img"
          aria-label={`${total} people listening to OTW Radio right now`}
        >
          <LandDots />

          {data?.spots.map((spot) => {
            const { x, y } = project(spot.lat, spot.lon);
            const r = 0.9 + 2.6 * Math.sqrt(spot.count / maxCount);
            return (
              <g key={`${spot.lat},${spot.lon}`}>
                <circle cx={x} cy={y} r={r} className="fill-primary/25">
                  <animate attributeName="r" values={`${r};${r * 1.8};${r}`} dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx={x} cy={y} r={r * 0.55} className="fill-primary">
                  <title>{`${spot.label}: ${spot.count} listening`}</title>
                </circle>
              </g>
            );
          })}

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
      </div>
    </div>
  );
}
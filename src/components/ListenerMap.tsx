import { useEffect, useState, memo, useRef } from "react";
import { Headphones } from "lucide-react";
import { toast } from "sonner";
import { DOT_LAT_TOP, DOT_STEP, LAND_ROWS } from "@/lib/worldDots";
import { MapOverlayManager } from "./map/MapOverlayManager";
import { MoodMapOverlay } from "./map/MoodMapOverlay";
import { ShowsMapOverlay } from "./map/ShowsMapOverlay";
import { createClient } from "@/integrations/supabase/client";

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
  quadrant_position: string | null;
}

interface ListenerMapProps {
  nowPlaying?: {
    title: string;
    artist: string;
    id?: string;
  };
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

export function ListenerMap({ nowPlaying }: ListenerMapProps) {
  const [data, setData] = useState<ListenersData | null>(null);
  const [moods, setMoods] = useState<MoodCategory[]>([]);
  const [moodEnabled, setMoodEnabled] = useState(false);
  const [tappedEmoji, setTappedEmoji] = useState<string | null>(null);
  const [lastSubmit, setLastSubmit] = useState<number>(0);
  const [cooldown, setCooldown] = useState<number>(0);
  const [supabase] = useState(() => createClient());
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch mood categories for legend/buttons
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
          // Ensure user session exists
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            await supabase.auth.signInAnonymously();
          }

          const { data: moodData } = await supabase
            .from("mood_categories")
            .select("id, category_name, emoji, label, color_hsl, quadrant_position")
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
  }, [supabase]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Fetch listeners data
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

  const handleMoodTap = async (mood: MoodCategory) => {
    // Check client-side rate limit
    const now = Date.now();
    const timeSince = (now - lastSubmit) / 1000;
    
    if (timeSince < 15) {
      const remaining = Math.ceil(15 - timeSince);
      setCooldown(remaining);
      toast.error(`Wait ${remaining}s before changing mood again`);
      return;
    }

    // Visual feedback
    setTappedEmoji(mood.emoji);
    setTimeout(() => setTappedEmoji(null), 600);

    try {
      // Get current session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No active session. Please refresh the page.");
      }

      // Check rate limit via database
      const { data: recentMood } = await supabase
        .from("mood_changes")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentMood?.created_at) {
        const lastSubmission = new Date(recentMood.created_at).getTime();
        const timeSinceLastSubmission = (Date.now() - lastSubmission) / 1000;

        if (timeSinceLastSubmission < 15) {
          const remainingTime = Math.ceil(15 - timeSinceLastSubmission);
          setCooldown(remainingTime);
          toast.error(`Slow down! Wait ${remainingTime}s`);
          return;
        }
      }

      // Get city from IP
      const cityResponse = await fetch("/api/mood/get-city");
      const cityData = await cityResponse.json();
      const city = cityData.city || "Unknown";

      // Insert mood directly to Supabase
      const { error: insertError } = await supabase
        .from("mood_changes")
        .insert({
          user_id: user.id,
          city,
          mood_category: mood.category_name,
          mood_value: 0,
          song_title: nowPlaying?.title || "Unknown",
          song_artist: nowPlaying?.artist || "Unknown",
          song_id: nowPlaying?.id
        });

      if (insertError) {
        throw insertError;
      }

      setLastSubmit(now);
      toast.success(`${mood.emoji} ${mood.label}`, {
        duration: 2000
      });
    } catch (err) {
      console.error("Mood submission error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update mood");
    }
  };

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

  // Group moods by quadrant
  const moodsByQuadrant: Record<string, MoodCategory[]> = {
    lower_left: [],
    lower_right: [],
    upper_left: [],
    upper_right: []
  };

  moods.forEach(mood => {
    const pos = mood.quadrant_position || 'lower_left';
    if (moodsByQuadrant[pos]) {
      moodsByQuadrant[pos].push(mood);
    }
  });

  // Calculate quadrant positions (in SVG coordinates)
  const getQuadrantPosition = (quadrant: string) => {
    const gridWidth = 28;  // Space for 2x2 grid of 12x12 boxes with gaps
    const gridHeight = 32; // +4 for label space
    
    switch (quadrant) {
      case 'lower_left':
        return { x: 3, y: ROWS - 2 - gridHeight };  // Moved down (less subtraction) and left (smaller x)
      case 'lower_right':
        return { x: COLS - 8 - gridWidth, y: ROWS - 8 - gridHeight };
      case 'upper_left':
        return { x: 8, y: 8 + 4 };  // +4 for label
      case 'upper_right':
        return { x: COLS - 8 - gridWidth, y: 8 + 4 };
      default:
        return { x: 3, y: ROWS - 4 - gridHeight };
    }
  };

  return (
    <div className="bg-accent rounded-lg p-4 w-full">
      <div className="flex items-center justify-between mb-3">
        {/* Left side - Listening now with headphones */}
        <div className="flex items-center gap-2">
          <Headphones className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground text-sm">Listening now</span>
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

          {/* Vibe Check - Interactive mood buttons in quadrants */}
          {moodEnabled && Object.entries(moodsByQuadrant).map(([quadrant, quadrantMoods]) => {
            if (quadrantMoods.length === 0) return null;
            
            const pos = getQuadrantPosition(quadrant);
            const boxSize = 12;  // Much smaller
            const gap = 2;       // Smaller gap
            
            return (
              <g key={quadrant} className="vibe-check-quadrant">
                {/* Label - smaller */}
                <text 
                  x={pos.x} 
                  y={pos.y - 1} 
                  className="fill-foreground font-semibold"
                  style={{ fontSize: '4px' }}
                >
                  Vibe Check
                </text>
                
                {/* Mood squares in 2x2 grid */}
                {quadrantMoods.map((mood, idx) => {
                  // Arrange in 2x2 grid
                  const col = idx % 2;
                  const row = Math.floor(idx / 2);
                  const boxX = pos.x + (col * (boxSize + gap));
                  const boxY = pos.y + (row * (boxSize + gap));
                  
                  return (
                    <g 
                      key={mood.id}
                      className="cursor-pointer"
                      onClick={() => handleMoodTap(mood)}
                      style={{ pointerEvents: cooldown > 0 ? 'none' : 'auto' }}
                    >
                      {/* Colored square background */}
                      <rect
                        x={boxX}
                        y={boxY}
                        width={boxSize}
                        height={boxSize}
                        rx={1.5}
                        fill={`hsl(${mood.color_hsl})`}
                        opacity={cooldown > 0 ? 0.5 : 0.9}
                        className="transition-all"
                        style={{
                          filter: tappedEmoji === mood.emoji 
                            ? `drop-shadow(0 0 2px hsl(${mood.color_hsl}))` 
                            : undefined
                        }}
                      >
                        {tappedEmoji === mood.emoji && (
                          <animate
                            attributeName="opacity"
                            values="0.9;1;0.9"
                            dur="0.6s"
                            repeatCount="1"
                          />
                        )}
                      </rect>
                      
                      {/* Emoji - smaller and centered */}
                      <text
                        x={boxX + boxSize / 2}
                        y={boxY + boxSize / 2 + 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: '8px' }}
                      >
                        {mood.emoji}
                      </text>
                      
                      {/* Tooltip */}
                      <title>{mood.label}</title>
                    </g>
                  );
                })}
                
                {/* Cooldown timer */}
                {cooldown > 0 && (
                  <text
                    x={pos.x}
                    y={pos.y + (boxSize + gap) * 2 + 3}
                    className="fill-primary font-mono"
                    style={{ fontSize: '4px' }}
                  >
                    {cooldown}s
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
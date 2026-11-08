import { useState, useEffect } from "react";
import { DOT_LAT_TOP, DOT_STEP } from "@/lib/worldDots";

interface CityMood {
  city: string;
  avg_mood: number;
  mood_count: number;
}

interface MoodMapOverlayProps {
  width: number;
  height: number;
  cities: Array<{ city: string; lat: number; lng: number }>;
}

const MOOD_COLORS: Record<number, string> = {
  0: "#1E40AF",   // Deep Blue (0-20)
  20: "#7C3AED",  // Purple (21-40)
  40: "#F97316",  // Orange (41-60)
  60: "#EF4444",  // Red-Orange (61-80)
  80: "#DC2626"   // Bright Red (81-100)
};

// Use same projection as main map
const project = (lat: number, lon: number) => ({
  x: (lon + 180) / DOT_STEP,
  y: (DOT_LAT_TOP - lat) / DOT_STEP + 0.5,
});

export function MoodMapOverlay({ width, height, cities }: MoodMapOverlayProps) {
  const [enabled, setEnabled] = useState(false);
  const [cityMoods, setCityMoods] = useState<CityMood[]>([]);
  const [pulsingCity, setPulsingCity] = useState<string | null>(null);

  useEffect(() => {
    checkFeatureFlag();
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchMoodAggregates();
      const interval = setInterval(fetchMoodAggregates, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [enabled]);

  const checkFeatureFlag = async () => {
    try {
      const response = await fetch("/api/admin/feature-flags");
      const result = await response.json();
      const flag = result.data?.find((f: any) => f.flag_name === "mood_tracker_enabled");
      setEnabled(flag?.enabled || false);
    } catch (error) {
      console.error("Error checking mood_tracker_enabled flag:", error);
    }
  };

  const fetchMoodAggregates = async () => {
    try {
      const response = await fetch("/api/mood/city-aggregates");
      if (!response.ok) return;
      const result = await response.json();
      
      const newMoods = result.data || [];
      
      // Detect changes and trigger pulse
      newMoods.forEach((newMood: CityMood) => {
        const oldMood = cityMoods.find(m => m.city === newMood.city);
        if (oldMood && oldMood.avg_mood !== newMood.avg_mood) {
          setPulsingCity(newMood.city);
          setTimeout(() => setPulsingCity(null), 600);
        }
      });
      
      setCityMoods(newMoods);
    } catch (error) {
      console.error("Error fetching mood aggregates:", error);
    }
  };

  const getMoodColor = (moodValue: number) => {
    if (moodValue <= 20) return MOOD_COLORS[0];
    if (moodValue <= 40) return MOOD_COLORS[20];
    if (moodValue <= 60) return MOOD_COLORS[40];
    if (moodValue <= 80) return MOOD_COLORS[60];
    return MOOD_COLORS[80];
  };

  if (!enabled || cityMoods.length === 0) return null;

  return (
    <g style={{ pointerEvents: "none" }}>
      {cities.map(city => {
        const mood = cityMoods.find(m => m.city === city.city);
        if (!mood) return null;

        const { x, y } = project(city.lat, city.lng);
        const color = getMoodColor(mood.avg_mood);
        const isPulsing = pulsingCity === city.city;

        return (
          <g key={city.city}>
            {/* Mood glow */}
            <circle
              cx={x}
              cy={y}
              r={1.8}
              fill={color}
              opacity={0.4}
              className={isPulsing ? "animate-pulse" : ""}
            />
            
            {/* Mood core */}
            <circle
              cx={x}
              cy={y}
              r={0.9}
              fill={color}
              opacity={0.9}
              style={{
                transition: "fill 500ms ease-out"
              }}
            />
          </g>
        );
      })}
    </g>
  );
}
import { useEffect, useState } from "react";

interface MoodCity {
  city: string;
  lat: number;
  lng: number;
}

interface CityMoodData {
  city: string;
  dominant_mood: "cozy" | "party" | "reflection" | "focus";
  total_submissions: number;
  engagement_score: number;
  last_activity: string;
}

interface MoodMapOverlayProps {
  width: number;
  height: number;
  cities: MoodCity[];
}

// Mood colors matching MoodTap
const MOOD_COLORS = {
  cozy: "hsl(180 60% 50%)",       // Teal
  party: "hsl(10 80% 55%)",       // Red
  reflection: "hsl(200 70% 65%)", // Light Blue
  focus: "hsl(45 80% 55%)"        // Gold
};

const MOOD_EMOJIS = {
  cozy: "🌙",
  party: "🔥",
  reflection: "🌊",
  focus: "🎯"
};

const DOT_STEP = 10;
const DOT_LAT_TOP = 70;

const project = (lat: number, lon: number) => ({
  x: (lon + 180) / DOT_STEP,
  y: (DOT_LAT_TOP - lat) / DOT_STEP + 0.5,
});

export function MoodMapOverlay({ width, height, cities }: MoodMapOverlayProps) {
  const [enabled, setEnabled] = useState(false);
  const [cityMoods, setCityMoods] = useState<CityMoodData[]>([]);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        const response = await fetch("/api/admin/feature-flags");
        const result = await response.json();
        const flag = result.data?.find((f: any) => f.flag_name === "mood_tracker_enabled");
        setEnabled(flag?.enabled || false);
      } catch {
        setEnabled(false);
      }
    };

    checkFeatureFlag();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const fetchCityMoods = async () => {
      try {
        const response = await fetch("/api/mood/city-aggregates");
        if (response.ok) {
          const data = await response.json();
          setCityMoods(data.cities || []);
        }
      } catch (error) {
        console.error("Failed to fetch city moods:", error);
      }
    };

    fetchCityMoods();
    const interval = setInterval(fetchCityMoods, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || cityMoods.length === 0) {
    return null;
  }

  return (
    <g className="mood-overlay">
      {cityMoods.map((cityMood) => {
        // Find matching city coordinates
        const cityCoords = cities.find(c => 
          c.city.toLowerCase() === cityMood.city.toLowerCase()
        );
        
        if (!cityCoords) return null;

        const { x, y } = project(cityCoords.lat, cityCoords.lng);
        const color = MOOD_COLORS[cityMood.dominant_mood];
        
        // Calculate pulse speed based on engagement (higher = faster)
        // engagement_score is submissions per minute
        const pulseSpeed = Math.max(0.5, Math.min(3, cityMood.engagement_score));
        const animationDuration = (2 / pulseSpeed).toFixed(2);

        return (
          <g key={cityMood.city}>
            {/* Pulsing outer ring */}
            <circle
              cx={x}
              cy={y}
              r={0.8}
              fill="none"
              stroke={color}
              strokeWidth="0.15"
              opacity="0.6"
            >
              <animate
                attributeName="r"
                values="0.8;1.4;0.8"
                dur={`${animationDuration}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.6;0.2;0.6"
                dur={`${animationDuration}s`}
                repeatCount="indefinite"
              />
            </circle>

            {/* Static core dot */}
            <circle
              cx={x}
              cy={y}
              r={0.5}
              fill={color}
              opacity="0.9"
            />

            {/* Glow effect */}
            <circle
              cx={x}
              cy={y}
              r={0.7}
              fill={color}
              opacity="0.3"
              filter="blur(0.3)"
            />
          </g>
        );
      })}
    </g>
  );
}
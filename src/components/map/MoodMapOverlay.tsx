import { useEffect, useState } from "react";

interface MoodCity {
  city: string;
  lat: number;
  lng: number;
}

interface CityMoodData {
  city: string;
  mood: "cozy" | "party" | "reflection" | "focus";
  timestamp: string;
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

const DOT_STEP = 10;
const DOT_LAT_TOP = 70;

const project = (lat: number, lon: number) => ({
  x: (lon + 180) / DOT_STEP,
  y: (DOT_LAT_TOP - lat) / DOT_STEP + 0.5,
});

export function MoodMapOverlay({ width, height, cities }: MoodMapOverlayProps) {
  const [enabled, setEnabled] = useState(false);
  const [cityMoods, setCityMoods] = useState<CityMoodData[]>([]);
  const [pulsingCities, setPulsingCities] = useState<Set<string>>(new Set());

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
          const newMoods: CityMoodData[] = data.cities || [];
          
          // Detect which cities have new moods to trigger pulse
          const newPulsing = new Set<string>();
          newMoods.forEach(newMood => {
            const existing = cityMoods.find(m => m.city === newMood.city);
            if (!existing || existing.timestamp !== newMood.timestamp) {
              newPulsing.add(newMood.city);
            }
          });

          if (newPulsing.size > 0) {
            setPulsingCities(newPulsing);
            setTimeout(() => setPulsingCities(new Set()), 1000);
          }

          setCityMoods(newMoods);
        }
      } catch (error) {
        console.error("Failed to fetch city moods:", error);
      }
    };

    fetchCityMoods();
    const interval = setInterval(fetchCityMoods, 5000);
    return () => clearInterval(interval);
  }, [enabled, cityMoods]);

  if (!enabled || cityMoods.length === 0) {
    return null;
  }

  return (
    <g className="mood-overlay">
      {cityMoods.map((cityMood) => {
        const cityCoords = cities.find(c => 
          c.city.toLowerCase() === cityMood.city.toLowerCase()
        );
        
        if (!cityCoords) return null;

        const { x, y } = project(cityCoords.lat, cityCoords.lng);
        const color = MOOD_COLORS[cityMood.mood];
        const isPulsing = pulsingCities.has(cityMood.city);

        return (
          <g key={`${cityMood.city}-${cityMood.timestamp}`}>
            {/* Pulse ring when mood changes */}
            {isPulsing && (
              <circle
                cx={x}
                cy={y}
                r={0.4}
                fill="none"
                stroke={color}
                strokeWidth="0.15"
                opacity="0.8"
              >
                <animate
                  attributeName="r"
                  values="0.4;1.5"
                  dur="0.8s"
                  fill="freeze"
                />
                <animate
                  attributeName="opacity"
                  values="0.8;0"
                  dur="0.8s"
                  fill="freeze"
                />
              </circle>
            )}

            {/* Static mood dot - same size as base listener dot */}
            <circle
              cx={x}
              cy={y}
              r={0.4}
              fill={color}
              opacity="0.9"
            />

            {/* Subtle glow */}
            <circle
              cx={x}
              cy={y}
              r={0.5}
              fill={color}
              opacity="0.2"
              filter="blur(0.15)"
            />
          </g>
        );
      })}
    </g>
  );
}
import { useEffect, useState } from "react";
import { CityMoodDot } from "./CityMoodDot";
import { findCity } from "@/lib/cities";

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

// Map projection constants - MUST match worldDots.ts for accurate plotting
const DOT_STEP = 2;     // was 10 (wrong)
const DOT_LAT_TOP = 82; // was 70 (wrong)

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
          
          console.log("[MoodMapOverlay] Fetched city moods:", newMoods);
          
          // Detect which cities have new moods to trigger pulse
          const newPulsing = new Set<string>();
          newMoods.forEach(newMood => {
            const existing = cityMoods.find(m => m.city === newMood.city);
            if (!existing || existing.timestamp !== newMood.timestamp) {
              console.log(`[MoodMapOverlay] New mood for ${newMood.city}: ${newMood.mood} (was: ${existing?.mood || "none"})`);
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
        // Try listener map spots first (for high-traffic cities with 3+ listeners)
        let cityCoords = cities.find(c => 
          c.city.toLowerCase() === cityMood.city.toLowerCase()
        );
        
        // Fallback to major cities database (for low-traffic cities)
        if (!cityCoords) {
          const majorCity = findCity(cityMood.city);
          if (majorCity) {
            cityCoords = {
              city: majorCity.city,
              lat: majorCity.lat,
              lng: majorCity.lng
            };
            console.log(`[MoodMapOverlay] Using major cities DB for "${cityMood.city}"`);
          } else {
            console.log(`[MoodMapOverlay] City "${cityMood.city}" not found in listener spots or major cities DB`);
          }
        } else {
          console.log(`[MoodMapOverlay] Using listener spot for "${cityMood.city}"`);
        }
        
        if (!cityCoords) return null;

        const { x, y } = project(cityCoords.lat, cityCoords.lng);
        const isPulsing = pulsingCities.has(cityMood.city);

        return (
          <CityMoodDot
            key={`${cityMood.city}-${cityMood.timestamp}`}
            city={cityMood.city}
            lat={cityCoords.lat}
            lng={cityCoords.lng}
            mood={cityMood.mood}
            timestamp={cityMood.timestamp}
            isPulsing={isPulsing}
            x={x}
            y={y}
          />
        );
      })}
    </g>
  );
}
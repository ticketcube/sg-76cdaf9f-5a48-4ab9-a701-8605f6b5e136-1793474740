import { useEffect, useState } from "react";
import { CityMoodDot } from "./CityMoodDot";
import { findCity } from "@/lib/cities";
import { supabase } from "@/integrations/supabase/client";

interface MoodCity {
  city: string;
  lat: number;
  lng: number;
}

interface CityMoodData {
  city: string;
  mood: string;
  timestamp: string;
}

interface MoodMapOverlayProps {
  width: number;
  height: number;
  cities: MoodCity[];
}

// Map projection constants - MUST match worldDots.ts for accurate plotting
const DOT_STEP = 2;
const DOT_LAT_TOP = 82;

const project = (lat: number, lon: number) => ({
  x: (lon + 180) / DOT_STEP,
  y: (DOT_LAT_TOP - lat) / DOT_STEP + 0.5,
});

export function MoodMapOverlay({ width, height, cities }: MoodMapOverlayProps) {
  const [enabled, setEnabled] = useState(false);
  const [cityMoods, setCityMoods] = useState<CityMoodData[]>([]);
  const [pulsingCities, setPulsingCities] = useState<Set<string>>(new Set());
  const [moodColors, setMoodColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const init = async () => {
      try {
        // Check feature flag
        const response = await fetch("/api/admin/feature-flags");
        const result = await response.json();
        const flag = result.data?.find((f: any) => f.flag_name === "mood_tracker_enabled");
        const isEnabled = flag?.enabled || false;
        setEnabled(isEnabled);

        // Fetch mood colors from database
        if (isEnabled) {
          const { data: moodData } = await supabase
            .from("mood_categories")
            .select("category_name, color_hsl")
            .eq("enabled", true);

          if (moodData) {
            const colors: Record<string, string> = {};
            moodData.forEach(m => {
              colors[m.category_name] = `hsl(${m.color_hsl})`;
            });
            setMoodColors(colors);
            console.log("[MoodMapOverlay] Loaded mood colors:", colors);
          }
        }
      } catch (error) {
        console.error("Failed to initialize MoodMapOverlay:", error);
        setEnabled(false);
      }
    };

    init();
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

  if (!enabled || cityMoods.length === 0 || Object.keys(moodColors).length === 0) {
    return null;
  }

  return (
    <g className="mood-overlay">
      {cityMoods.map((cityMood) => {
        // Get color for this mood category
        const moodColor = moodColors[cityMood.mood] || "hsl(0 0% 50%)";

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
            moodColor={moodColor}
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
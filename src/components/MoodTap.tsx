import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/integrations/supabase/client";
import { findCity } from "@/lib/cities";

interface MoodTapProps {
  nowPlaying?: {
    title: string;
    artist: string;
    id?: string;
  };
}

type Mood = {
  id: string;
  category_name: string;
  emoji: string;
  label: string;
  color_hsl: string;
  description?: string;
};

export function MoodTap({ nowPlaying }: MoodTapProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [tappedEmoji, setTappedEmoji] = useState<string | null>(null);
  const [lastSubmit, setLastSubmit] = useState<number>(0);
  const [cooldown, setCooldown] = useState<number>(0);
  const [supabase] = useState(() => createClient());
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Ensure user has a session (anonymous or authenticated)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Create anonymous session for first-time visitors
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Failed to create anonymous session:", error);
        }
      }

      // Fetch feature flag
      const flagResponse = await fetch("/api/admin/feature-flags");
      const flagData = await flagResponse.json();
      const moodFlag = flagData.data?.find((f: any) => f.flag_name === "mood_tracker_enabled");
      const isEnabled = moodFlag?.enabled === true;
      setEnabled(isEnabled);

      // Fetch mood categories from database
      if (isEnabled) {
        const { data: moodData, error: moodError } = await supabase
          .from("mood_categories")
          .select("id, category_name, emoji, label, color_hsl")
          .eq("enabled", true)
          .order("display_order");

        if (moodError) {
          console.error("Failed to fetch mood categories:", moodError);
        } else {
          setMoods(moodData || []);
          console.log("[MoodTap] Loaded mood categories:", moodData);
        }

        // Pre-fetch user's city
        await detectUserCity();
      }

      setLoading(false);
    };

    init();
  }, [supabase]);

  // Detect user's city using IP or browser geolocation
  const detectUserCity = async (): Promise<string> => {
    try {
      // Try IP-based detection first
      const cityResponse = await fetch("/api/mood/get-city");
      const cityData = await cityResponse.json();
      
      console.log("[MoodTap] City detection result:", cityData);

      // If IP detection worked, use it
      if (cityData.city && !cityData.needs_fallback) {
        setUserCity(cityData.city);
        return cityData.city;
      }

      // Fallback to browser geolocation API
      console.log("[MoodTap] IP detection failed, trying browser geolocation...");
      
      if (!navigator.geolocation) {
        console.warn("[MoodTap] Geolocation not supported");
        setUserCity("Unknown");
        return "Unknown";
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`[MoodTap] Got coordinates: ${latitude}, ${longitude}`);
            
            // Find nearest major city from our database
            const city = findNearestCity(latitude, longitude);
            console.log(`[MoodTap] Nearest city: ${city}`);
            setUserCity(city);
            resolve(city);
          },
          (error) => {
            console.error("[MoodTap] Geolocation error:", error.message);
            setUserCity("Unknown");
            resolve("Unknown");
          },
          { timeout: 5000, maximumAge: 300000 } // Cache for 5 minutes
        );
      });
    } catch (error) {
      console.error("[MoodTap] City detection failed:", error);
      setUserCity("Unknown");
      return "Unknown";
    }
  };

  // Find nearest city from coordinates
  const findNearestCity = (lat: number, lng: number): string => {
    // Use our cities database
    const cities = [
      { name: "New York", lat: 40.7128, lng: -74.0060 },
      { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
      { name: "Chicago", lat: 41.8781, lng: -87.6298 },
      { name: "Houston", lat: 29.7604, lng: -95.3698 },
      { name: "Phoenix", lat: 33.4484, lng: -112.0740 },
      { name: "Philadelphia", lat: 39.9526, lng: -75.1652 },
      { name: "London", lat: 51.5074, lng: -0.1278 },
      { name: "Paris", lat: 48.8566, lng: 2.3522 },
      { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
      { name: "Sydney", lat: -33.8688, lng: 151.2093 },
    ];

    let nearest = cities[0];
    let minDist = Number.MAX_VALUE;

    for (const city of cities) {
      const dist = Math.sqrt(
        Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    }

    return nearest.name;
  };

  useEffect(() => {
    // Cooldown timer
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleMoodTap = async (mood: Mood) => {
    console.log(`[MoodTap] Button tapped: ${mood.emoji}`);
    
    // IMMEDIATE visual feedback - this must happen first, synchronously
    setTappedEmoji(mood.emoji);
    const flashTimer = setTimeout(() => setTappedEmoji(null), 600);

    // Check client-side rate limit
    const now = Date.now();
    const timeSince = (now - lastSubmit) / 1000;
    
    if (timeSince < 15) {
      const remaining = Math.ceil(15 - timeSince);
      setCooldown(remaining);
      toast.error(`Wait ${remaining}s before changing mood again`);
      return; // Visual feedback still happened
    }

    // All async work wrapped in try-catch so errors don't break the flash
    try {
      // Get current session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("[MoodTap] No user session found");
        toast.error("Session expired. Please refresh the page.");
        return;
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

      // Get or detect city (with timeout to not block forever)
      let city = userCity;
      if (!city || city === "Unknown" || city === "Local") {
        console.log("[MoodTap] Need to detect city...");
        
        // Use a Promise.race to timeout city detection after 3 seconds
        const cityDetectionPromise = detectUserCity();
        const timeoutPromise = new Promise<string>((resolve) => {
          setTimeout(() => resolve("Unknown"), 3000);
        });
        
        city = await Promise.race([cityDetectionPromise, timeoutPromise]);
        console.log(`[MoodTap] City detected: ${city}`);
      }

      console.log(`[MoodTap] Submitting mood: ${mood.category_name} from ${city}`);

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
        console.error("[MoodTap] Database insert error:", insertError);
        throw insertError;
      }

      setLastSubmit(now);
      console.log(`[MoodTap] ✓ Success! Mood saved for ${city}`);
      
      toast.success(`${mood.emoji} ${mood.label}`, {
        description: city !== "Unknown" ? `Mood set for ${city}` : "Mood recorded",
        duration: 2000
      });
    } catch (err) {
      console.error("[MoodTap] Error during submission:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update mood");
    } finally {
      // Ensure flash timer is cleared
      clearTimeout(flashTimer);
    }
  };

  if (loading || !enabled || moods.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-primary/20">
      <span className="text-xs text-muted-foreground font-medium">Vibe:</span>
      {moods.map(mood => (
        <button
          key={mood.id}
          onClick={() => handleMoodTap(mood)}
          disabled={cooldown > 0}
          className={`
            text-2xl transition-all duration-200 hover:scale-125 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${tappedEmoji === mood.emoji ? "scale-150 animate-pulse" : ""}
          `}
          title={`${mood.label}${mood.description ? ` - ${mood.description}` : ""}`}
          aria-label={mood.label}
          style={{
            filter: tappedEmoji === mood.emoji 
              ? `drop-shadow(0 0 8px hsl(${mood.color_hsl}))` 
              : undefined
          }}
        >
          {mood.emoji}
        </button>
      ))}
      {cooldown > 0 && (
        <span className="text-xs text-primary font-mono ml-1">
          {cooldown}s
        </span>
      )}
    </div>
  );
}
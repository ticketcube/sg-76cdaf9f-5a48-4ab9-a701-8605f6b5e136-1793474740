import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/integrations/supabase/client";

interface MoodTapProps {
  nowPlaying?: {
    title: string;
    artist: string;
    id?: string;
  };
}

type MoodCategory = "cozy" | "party" | "reflection" | "focus";

type Mood = {
  emoji: string;
  label: string;
  category: MoodCategory;
  color: string;
  description: string;
};

const MOODS: Mood[] = [
  { 
    emoji: "🌙", 
    label: "Cozy", 
    category: "cozy",
    color: "hsl(180 60% 50%)",
    description: "Chill Hangout" 
  },
  { 
    emoji: "🔥", 
    label: "Party", 
    category: "party",
    color: "hsl(10 80% 55%)",
    description: "Peak Energy" 
  },
  { 
    emoji: "🌊", 
    label: "Reflection", 
    category: "reflection",
    color: "hsl(200 70% 65%)",
    description: "Late Night Ambient" 
  },
  { 
    emoji: "🎯", 
    label: "Focus", 
    category: "focus",
    color: "hsl(45 80% 55%)",
    description: "Locked In" 
  }
];

export function MoodTap({ nowPlaying }: MoodTapProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tappedEmoji, setTappedEmoji] = useState<string | null>(null);
  const [lastSubmit, setLastSubmit] = useState<number>(0);
  const [cooldown, setCooldown] = useState<number>(0);
  const [supabase] = useState(() => createClient());

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

      // Check if mood tracker is enabled
      fetch("/api/admin/feature-flags")
        .then(res => res.json())
        .then(data => {
          const moodFlag = data.data?.find((f: any) => f.flag_name === "mood_tracker_enabled");
          setEnabled(moodFlag?.enabled === true);
        })
        .catch(() => setEnabled(false))
        .finally(() => setLoading(false));
    };

    init();
  }, [supabase]);

  useEffect(() => {
    // Cooldown timer
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleMoodTap = async (mood: Mood) => {
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
          mood_category: mood.category,
          mood_value: 0, // Legacy field, keeping for backwards compat
          song_title: nowPlaying?.title || "Unknown",
          song_artist: nowPlaying?.artist || "Unknown",
          song_id: nowPlaying?.id
        });

      if (insertError) {
        throw insertError;
      }

      setLastSubmit(now);
      toast.success(`${mood.emoji} ${mood.label}`, {
        description: mood.description,
        duration: 2000
      });
    } catch (err) {
      console.error("Mood submission error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update mood");
    }
  };

  if (loading || !enabled) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm rounded-full border border-primary/20">
      <span className="text-xs text-muted-foreground font-medium">Vibe:</span>
      {MOODS.map(mood => (
        <button
          key={mood.category}
          onClick={() => handleMoodTap(mood)}
          disabled={cooldown > 0}
          className={`
            text-2xl transition-all duration-200 hover:scale-125 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${tappedEmoji === mood.emoji ? "scale-150 animate-pulse" : ""}
          `}
          title={`${mood.label} - ${mood.description}`}
          aria-label={mood.label}
          style={{
            filter: tappedEmoji === mood.emoji 
              ? `drop-shadow(0 0 8px ${mood.color})` 
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
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

type Mood = {
  emoji: string;
  label: string;
  value: number;
};

const MOODS: Mood[] = [
  { emoji: "😴", label: "Chill", value: 10 },
  { emoji: "💙", label: "Calm", value: 30 },
  { emoji: "😊", label: "Content", value: 50 },
  { emoji: "🔥", label: "Energized", value: 70 },
  { emoji: "⚡", label: "Hyped", value: 90 }
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
      // Ensure we have an active session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No active session. Please refresh the page.");
      }

      // Check feature flag (client-side double-check)
      const { data: flags } = await supabase
        .from("feature_flags")
        .select("enabled")
        .eq("flag_name", "mood_tracker_enabled")
        .single();

      if (!flags?.enabled) {
        toast.error("Mood tracker is currently disabled");
        return;
      }

      // Check rate limit in database
      const { data: recentMood } = await supabase
        .from("mood_changes")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recentMood?.created_at) {
        const lastSubmission = new Date(recentMood.created_at).getTime();
        const nowMs = Date.now();
        const timeSinceLastSubmission = (nowMs - lastSubmission) / 1000;

        if (timeSinceLastSubmission < 15) {
          const remainingTime = Math.ceil(15 - timeSinceLastSubmission);
          setCooldown(remainingTime);
          toast.error(`Wait ${remainingTime}s before changing mood again`);
          return;
        }
      }

      // Get city from IP (server-side geolocation)
      const cityResponse = await fetch("/api/mood/get-city");
      const { city } = await cityResponse.json();

      // Insert mood directly to Supabase (RLS policy allows auth.uid() = user_id)
      const { error: insertError } = await supabase
        .from("mood_changes")
        .insert({
          user_id: user.id,
          city,
          mood_value: mood.value,
          song_title: nowPlaying?.title || "Unknown",
          song_artist: nowPlaying?.artist || "Unknown",
          song_id: nowPlaying?.id
        });

      if (insertError) {
        console.error("Error submitting mood:", insertError);
        throw new Error(insertError.message || "Failed to submit mood");
      }

      setLastSubmit(now);
      toast.success(`${mood.emoji} ${mood.label}`, {
        description: `Your city's vibe just updated!`,
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
          key={mood.value}
          onClick={() => handleMoodTap(mood)}
          disabled={cooldown > 0}
          className={`
            text-2xl transition-all duration-200 hover:scale-125 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            ${tappedEmoji === mood.emoji ? "scale-150 animate-pulse" : ""}
          `}
          title={`${mood.label} (${mood.value})`}
          aria-label={mood.label}
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
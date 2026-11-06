import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createClient();

  // Check feature flag
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("flag_name", "mood_tracker_enabled")
    .single();

  if (!flags?.enabled) {
    return res.status(503).json({ error: "Mood tracker is currently disabled" });
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { mood_value, city, song_title, song_artist, song_id } = req.body;

  // Validate mood value
  if (typeof mood_value !== "number" || mood_value < 0 || mood_value > 100) {
    return res.status(400).json({ error: "Invalid mood value (must be 0-100)" });
  }

  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }

  // Check rate limit: last submission < 15 seconds ago
  const { data: recentMood } = await supabase
    .from("mood_changes")
    .select("created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (recentMood && recentMood.created_at) {
    const lastSubmission = new Date(recentMood.created_at).getTime();
    const now = Date.now();
    const timeSinceLastSubmission = (now - lastSubmission) / 1000;

    if (timeSinceLastSubmission < 15) {
      const remainingTime = Math.ceil(15 - timeSinceLastSubmission);
      return res.status(429).json({ 
        error: "Rate limit exceeded", 
        retry_after: remainingTime 
      });
    }
  }

  // Insert mood change
  const { data, error } = await supabase
    .from("mood_changes")
    .insert({
      user_id: user.id,
      city,
      mood_value,
      song_title,
      song_artist,
      song_id
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting mood:", error);
    return res.status(500).json({ error: "Failed to submit mood" });
  }

  return res.status(200).json({ success: true, data });
}
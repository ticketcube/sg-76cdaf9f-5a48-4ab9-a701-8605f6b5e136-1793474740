import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/integrations/supabase/client";

// Get user's city from IP address using ip-api.com (free, no key required)
async function getCityFromIP(ip: string): Promise<string> {
  try {
    // Skip private/local IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return "Local";
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=city,status,message`, {
      headers: { "User-Agent": "OTW-Radio/1.0" }
    });
    
    if (!response.ok) throw new Error("Geolocation service unavailable");
    
    const data = await response.json();
    
    if (data.status === "success" && data.city) {
      return data.city;
    }
    
    return "Unknown";
  } catch (error) {
    console.error("IP geolocation failed:", error);
    return "Unknown";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the access token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  // Create Supabase client and set the session
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  // Check feature flag
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("flag_name", "mood_tracker_enabled")
    .single();

  if (!flags?.enabled) {
    return res.status(503).json({ error: "Mood tracker is currently disabled" });
  }

  const { mood_value, song_title, song_artist, song_id } = req.body;

  // Validate mood value
  if (typeof mood_value !== "number" || mood_value < 0 || mood_value > 100) {
    return res.status(400).json({ error: "Invalid mood value (must be 0-100)" });
  }

  // Get city from IP address
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "127.0.0.1";
  const city = await getCityFromIP(ip);

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
    return res.status(500).json({ error: "Failed to submit mood", details: error.message });
  }

  return res.status(200).json({ success: true, data });
}
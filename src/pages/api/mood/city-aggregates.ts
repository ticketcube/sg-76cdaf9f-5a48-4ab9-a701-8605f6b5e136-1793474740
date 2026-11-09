import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabase = createClient();

  try {
    // Get the most recent mood submission per city (last 5 minutes)
    const { data, error } = await supabase
      .from("mood_changes")
      .select("city, mood_category, created_at")
      .not("city", "is", null)
      .neq("city", "Unknown")
      .neq("city", "Local")
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching city moods:", error);
      return res.status(500).json({ error: "Failed to fetch city mood data" });
    }

    // Get most recent mood per city
    const cityMap = new Map();
    data?.forEach((mood: any) => {
      if (!cityMap.has(mood.city)) {
        cityMap.set(mood.city, {
          city: mood.city,
          mood: mood.mood_category,
          timestamp: mood.created_at
        });
      }
    });

    const result = Array.from(cityMap.values());
    console.log("[city-aggregates] Returning moods for cities:", result);

    return res.status(200).json({ 
      cities: result
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
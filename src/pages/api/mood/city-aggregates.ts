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
      .neq("city", "Local") // Still filter out Local
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[city-aggregates] Error fetching city moods:", error);
      return res.status(500).json({ error: "Failed to fetch city mood data" });
    }

    console.log(`[city-aggregates] Found ${data?.length || 0} mood changes in last 5 minutes`);

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
    console.log(`[city-aggregates] Returning ${result.length} unique cities with moods`);
    
    // Log each city for debugging
    result.forEach(r => {
      console.log(`  - ${r.city}: ${r.mood}`);
    });

    return res.status(200).json({ 
      cities: result,
      total_changes: data?.length || 0
    });
  } catch (err) {
    console.error("[city-aggregates] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
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

  // Check feature flag
  const { data: flags } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("flag_name", "mood_tracker_enabled")
    .single();

  if (!flags?.enabled) {
    return res.status(503).json({ error: "Mood tracker is currently disabled" });
  }

  // Call Postgres function for city mood aggregates
  const { data, error } = await supabase.rpc("get_city_mood_aggregates");

  if (error) {
    console.error("Error fetching city mood aggregates:", error);
    return res.status(500).json({ error: "Failed to fetch mood aggregates" });
  }

  return res.status(200).json({ data });
}
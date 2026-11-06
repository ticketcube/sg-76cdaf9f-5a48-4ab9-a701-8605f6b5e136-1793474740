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
    .eq("flag_name", "shows_map_enabled")
    .single();

  if (!flags?.enabled) {
    return res.status(503).json({ error: "Shows map is currently disabled" });
  }

  // Get upcoming shows (next 30 days by default)
  const { data, error } = await supabase
    .from("upcoming_shows")
    .select("*")
    .gte("show_date", new Date().toISOString())
    .order("show_date", { ascending: true });

  if (error) {
    console.error("Error fetching upcoming shows:", error);
    return res.status(500).json({ error: "Failed to fetch shows" });
  }

  return res.status(200).json({ data });
}
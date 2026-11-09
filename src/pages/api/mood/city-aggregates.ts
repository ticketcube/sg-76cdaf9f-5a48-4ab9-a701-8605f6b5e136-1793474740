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
    // Call the database function to get dominant moods per city
    const { data, error } = await supabase
      .rpc("get_city_dominant_moods");

    if (error) {
      console.error("Error fetching city moods:", error);
      return res.status(500).json({ error: "Failed to fetch city mood data" });
    }

    return res.status(200).json({ cities: data || [] });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
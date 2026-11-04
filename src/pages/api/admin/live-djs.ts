import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

const AZURACAST_BASE_URL = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://radio.onestowatch.live";
const AZURACAST_API_KEY = process.env.AZURACAST_API_KEY;
const STATION_ID = process.env.AZURACAST_STATION_ID || "2";

interface AzuraCastStreamer {
  id: number;
  streamer_username: string;
  display_name: string;
  is_active: boolean;
}

interface Streamer {
  id: number;
  streamer_username: string;
  display_name: string;
  is_active: boolean;
  user_id?: string;
  email?: string;
  profile_display_name?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!AZURACAST_API_KEY) {
      return res.status(500).json({ 
        error: "AzuraCast API key not configured",
        streamers: [],
        total_count: 0,
        active_count: 0,
        linked_count: 0
      });
    }

    // Fetch all streamers from AzuraCast
    const streamersResponse = await fetch(
      `${AZURACAST_BASE_URL}/api/station/${STATION_ID}/streamers`,
      {
        headers: { "X-API-Key": AZURACAST_API_KEY }
      }
    );

    console.log("Streamers API URL:", `${AZURACAST_BASE_URL}/api/station/${STATION_ID}/streamers`);
    console.log("Streamers API status:", streamersResponse.status);

    if (!streamersResponse.ok) {
      const errorText = await streamersResponse.text();
      console.error("AzuraCast streamers API error:", errorText);
      throw new Error(`AzuraCast streamers API error: ${streamersResponse.status} - ${errorText}`);
    }

    const azuracastStreamers: AzuraCastStreamer[] = await streamersResponse.json();
    console.log("Fetched streamers count:", azuracastStreamers.length);
    console.log("Streamers data:", JSON.stringify(azuracastStreamers, null, 2));

    // Fetch all user profiles from database to enrich streamer data
    const { data: allProfiles } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, username, email, azuracast_streamer_username")
      .not("azuracast_streamer_username", "is", null);

    // Map AzuraCast streamers with optional profile data
    const streamers: Streamer[] = azuracastStreamers.map(streamer => {
      const profile = allProfiles?.find(
        p => p.azuracast_streamer_username === streamer.streamer_username
      );

      return {
        id: streamer.id,
        streamer_username: streamer.streamer_username,
        display_name: streamer.display_name,
        is_active: streamer.is_active,
        user_id: profile?.user_id,
        email: profile?.email,
        profile_display_name: profile?.display_name || undefined
      };
    });

    return res.status(200).json({
      streamers,
      total_count: streamers.length,
      active_count: streamers.filter(s => s.is_active).length,
      linked_count: streamers.filter(s => s.user_id).length
    });

  } catch (error) {
    console.error("Error fetching streamers:", error);
    return res.status(500).json({ 
      error: "Failed to fetch streamers from AzuraCast",
      streamers: [],
      total_count: 0,
      active_count: 0,
      linked_count: 0
    });
  }
}
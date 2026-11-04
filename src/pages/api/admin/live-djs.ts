import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

const AZURACAST_BASE_URL = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://radio.onestowatch.live";
const AZURACAST_API_KEY = process.env.AZURACAST_API_KEY;
const STATION_ID = process.env.AZURACAST_STATION_ID || "1";

interface AzuraCastNowPlaying {
  station: {
    name: string;
    listen_url: string;
  };
  live: {
    is_live: boolean;
    streamer_name: string;
    broadcast_start: number | null;
  };
  listeners: {
    current: number;
    unique: number;
  };
  now_playing: {
    song: {
      title: string;
      artist: string;
    };
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch now-playing from AzuraCast
    const azuraResponse = await fetch(
      `${AZURACAST_BASE_URL}/api/nowplaying/${STATION_ID}`,
      {
        headers: AZURACAST_API_KEY ? { "X-API-Key": AZURACAST_API_KEY } : {}
      }
    );

    if (!azuraResponse.ok) {
      throw new Error(`AzuraCast API error: ${azuraResponse.status}`);
    }

    const nowPlaying = await azuraResponse.json() as AzuraCastNowPlaying;

    // If not live, return empty
    if (!nowPlaying.live.is_live) {
      return res.status(200).json({
        is_live: false,
        streamer_name: null,
        dj_profile: null,
        listeners: 0
      });
    }

    // Try to match streamer_name to a DJ profile
    const streamerName = nowPlaying.live.streamer_name;
    
    // Query user_profiles for DJ with matching azuracast_streamer_username
    const { data: djProfile } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, username, azuracast_streamer_username")
      .eq("role", "otwl-dj")
      .eq("azuracast_streamer_username", streamerName)
      .single();

    return res.status(200).json({
      is_live: true,
      streamer_name: streamerName,
      dj_profile: djProfile ? {
        user_id: djProfile.user_id,
        display_name: djProfile.display_name || djProfile.username,
        username: djProfile.username
      } : null,
      listeners: nowPlaying.listeners.current,
      broadcast_start: nowPlaying.live.broadcast_start,
      now_playing: {
        title: nowPlaying.now_playing.song.title,
        artist: nowPlaying.now_playing.song.artist
      }
    });

  } catch (error) {
    console.error("Error fetching live DJ status:", error);
    return res.status(500).json({ 
      error: "Failed to fetch live DJ status",
      is_live: false,
      streamer_name: null,
      dj_profile: null,
      listeners: 0
    });
  }
}
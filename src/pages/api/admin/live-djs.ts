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

interface DJStatus {
  user_id: string;
  display_name: string;
  username: string;
  azuracast_streamer_username: string;
  is_live: boolean;
  listeners?: number;
  broadcast_start?: number;
  now_playing?: {
    title: string;
    artist: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch now-playing from AzuraCast to get current live status
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

    // Fetch all DJs with AzuraCast accounts from our database
    const { data: allDJs, error: dbError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, username, azuracast_streamer_username")
      .eq("role", "otwl-dj")
      .not("azuracast_streamer_username", "is", null)
      .order("display_name", { ascending: true });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Map all DJs to their status
    const djStatuses: DJStatus[] = (allDJs || []).map(dj => {
      const isLive = nowPlaying.live.is_live && 
                     nowPlaying.live.streamer_name === dj.azuracast_streamer_username;

      return {
        user_id: dj.user_id,
        display_name: dj.display_name || dj.username,
        username: dj.username,
        azuracast_streamer_username: dj.azuracast_streamer_username!,
        is_live: isLive,
        ...(isLive && {
          listeners: nowPlaying.listeners.current,
          broadcast_start: nowPlaying.live.broadcast_start,
          now_playing: {
            title: nowPlaying.now_playing.song.title,
            artist: nowPlaying.now_playing.song.artist
          }
        })
      };
    });

    // Also include live streamer info if they're not matched to a DJ profile
    const unmatchedLiveStreamer = nowPlaying.live.is_live && 
      !djStatuses.some(dj => dj.is_live) ? {
        streamer_name: nowPlaying.live.streamer_name,
        listeners: nowPlaying.listeners.current,
        broadcast_start: nowPlaying.live.broadcast_start,
        now_playing: {
          title: nowPlaying.now_playing.song.title,
          artist: nowPlaying.now_playing.song.artist
        }
      } : null;

    return res.status(200).json({
      djs: djStatuses,
      total_djs: djStatuses.length,
      live_count: djStatuses.filter(dj => dj.is_live).length,
      unmatched_live_streamer: unmatchedLiveStreamer
    });

  } catch (error) {
    console.error("Error fetching DJ status:", error);
    return res.status(500).json({ 
      error: "Failed to fetch DJ status",
      djs: [],
      total_djs: 0,
      live_count: 0,
      unmatched_live_streamer: null
    });
  }
}
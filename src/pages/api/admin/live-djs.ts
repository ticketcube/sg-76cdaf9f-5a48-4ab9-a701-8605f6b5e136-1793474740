import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

const AZURACAST_BASE_URL = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://radio.onestowatch.live";
const AZURACAST_API_KEY = process.env.AZURACAST_API_KEY;
const STATION_SHORTCODE = "otw_radio";

interface AzuraCastStreamer {
  id: number;
  streamer_username: string;
  display_name: string;
  is_active: boolean;
  schedule_items?: Array<{
    start_time: number;
    end_time: number;
    start_date?: string | null;
    end_date?: string | null;
    days?: number[];
  }>;
}

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
  email: string;
  azuracast_streamer_username: string;
  azuracast_display_name?: string;
  is_active_in_azuracast: boolean;
  has_azuracast_account: boolean;
  is_live: boolean;
  listeners?: number;
  broadcast_start?: number;
  now_playing?: {
    title: string;
    artist: string;
  };
  schedule_items?: Array<{
    start_time: number;
    end_time: number;
    days?: number[];
  }>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch now-playing to get current live status
    const nowPlayingResponse = await fetch(
      `${AZURACAST_BASE_URL}/api/nowplaying/${STATION_SHORTCODE}`,
      {
        headers: AZURACAST_API_KEY ? { "X-API-Key": AZURACAST_API_KEY } : {}
      }
    );

    if (!nowPlayingResponse.ok) {
      throw new Error(`AzuraCast nowplaying API error: ${nowPlayingResponse.status}`);
    }

    const nowPlaying = await nowPlayingResponse.json() as AzuraCastNowPlaying;

    // Fetch all streamers from AzuraCast (requires API key with station-level permissions)
    let azuracastStreamers: AzuraCastStreamer[] = [];
    
    if (AZURACAST_API_KEY) {
      const streamersResponse = await fetch(
        `${AZURACAST_BASE_URL}/api/station/${STATION_SHORTCODE}/streamers`,
        {
          headers: { "X-API-Key": AZURACAST_API_KEY }
        }
      );

      if (streamersResponse.ok) {
        azuracastStreamers = await streamersResponse.json();
      } else {
        console.warn(`AzuraCast streamers API error: ${streamersResponse.status}`);
      }
    }

    // Fetch all DJs from our database
    const { data: allDJs, error: dbError } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, username, email, azuracast_streamer_username")
      .eq("role", "otwl-dj")
      .order("display_name", { ascending: true });

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Map all DJs with AzuraCast data
    const djStatuses: DJStatus[] = (allDJs || []).map(dj => {
      // Find matching AzuraCast streamer account
      const azuracastAccount = azuracastStreamers.find(
        s => s.streamer_username === dj.azuracast_streamer_username
      );

      // Check if this DJ is currently live
      const isLive = nowPlaying.live.is_live && 
                     nowPlaying.live.streamer_name === dj.azuracast_streamer_username;

      return {
        user_id: dj.user_id,
        display_name: dj.display_name || dj.username,
        username: dj.username,
        email: dj.email,
        azuracast_streamer_username: dj.azuracast_streamer_username || "",
        azuracast_display_name: azuracastAccount?.display_name,
        is_active_in_azuracast: azuracastAccount?.is_active || false,
        has_azuracast_account: !!azuracastAccount,
        is_live: isLive,
        ...(isLive && {
          listeners: nowPlaying.listeners.current,
          broadcast_start: nowPlaying.live.broadcast_start,
          now_playing: {
            title: nowPlaying.now_playing.song.title,
            artist: nowPlaying.now_playing.song.artist
          }
        }),
        ...(azuracastAccount?.schedule_items && {
          schedule_items: azuracastAccount.schedule_items
        })
      };
    });

    // Check for unmatched live streamer (someone streaming but not in our DJ database)
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
      djs_with_azuracast_accounts: djStatuses.filter(dj => dj.has_azuracast_account).length,
      active_in_azuracast: djStatuses.filter(dj => dj.is_active_in_azuracast).length,
      live_count: djStatuses.filter(dj => dj.is_live).length,
      unmatched_live_streamer: unmatchedLiveStreamer
    });

  } catch (error) {
    console.error("Error fetching DJ status:", error);
    return res.status(500).json({ 
      error: "Failed to fetch DJ status",
      djs: [],
      total_djs: 0,
      djs_with_azuracast_accounts: 0,
      active_in_azuracast: 0,
      live_count: 0,
      unmatched_live_streamer: null
    });
  }
}
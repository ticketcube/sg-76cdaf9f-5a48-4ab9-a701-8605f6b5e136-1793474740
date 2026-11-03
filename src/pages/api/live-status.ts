import type { NextApiRequest, NextApiResponse } from "next";

interface BroadcastData {
  timestampStart: string;
  timestampEnd: string | null;
  recordingPath: string | null;
  id: number;
}

interface StreamerData {
  id: number;
  streamer_username: string;
  display_name: string;
  broadcasts: BroadcastData[];
}

interface LiveStatusResponse {
  is_live: boolean;
  streamer_name: string | null;
  connected_at: string | null;
  method: "streamers_api" | "nowplaying_api" | "fallback";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LiveStatusResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const azuracastUrl = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://radio.onestowatch.live";
  const stationId = process.env.AZURACAST_STATION_ID || "2";
  const apiKey = process.env.AZURACAST_API_KEY;

  try {
    // Method 1: Check streamers endpoint (most reliable)
    const streamersUrl = `${azuracastUrl}/api/station/${stationId}/streamers`;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["X-API-Key"] = apiKey;
    }

    const streamersResponse = await fetch(streamersUrl, { 
      headers,
      cache: 'no-store'
    });
    
    if (streamersResponse.ok) {
      const streamers: StreamerData[] = await streamersResponse.json();
      
      // Check each streamer's broadcasts array for active streams
      for (const streamer of streamers) {
        if (streamer.broadcasts && streamer.broadcasts.length > 0) {
          // Get the most recent broadcast
          const latestBroadcast = streamer.broadcasts[streamer.broadcasts.length - 1];
          
          // If timestampEnd is null, the stream is currently active
          if (latestBroadcast.timestampEnd === null) {
            return res.status(200).json({
              is_live: true,
              streamer_name: streamer.display_name || streamer.streamer_username,
              connected_at: latestBroadcast.timestampStart,
              method: "streamers_api"
            });
          }
        }
      }
    }

    // Method 2: Fall back to nowplaying API
    const nowPlayingUrl = process.env.AZURACAST_API_URL || `${azuracastUrl}/api/nowplaying/${stationId}`;
    const nowPlayingResponse = await fetch(nowPlayingUrl, {
      cache: 'no-store'
    });

    if (nowPlayingResponse.ok) {
      const data = await nowPlayingResponse.json();
      
      if (data.live?.is_live) {
        return res.status(200).json({
          is_live: true,
          streamer_name: data.live.streamer_name || null,
          connected_at: null,
          method: "nowplaying_api"
        });
      }
    }

    // No live streamers detected
    return res.status(200).json({
      is_live: false,
      streamer_name: null,
      connected_at: null,
      method: "fallback"
    });

  } catch (error) {
    console.error("Failed to check live status:", error);
    
    // Return safe fallback
    return res.status(200).json({
      is_live: false,
      streamer_name: null,
      connected_at: null,
      method: "fallback"
    });
  }
}
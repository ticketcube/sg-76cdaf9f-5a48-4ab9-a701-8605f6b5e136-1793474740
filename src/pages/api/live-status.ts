import type { NextApiRequest, NextApiResponse } from "next";

interface StreamerData {
  id: number;
  streamer_username: string;
  is_connected: boolean;
  connected_at?: number;
}

interface LiveStatusResponse {
  is_live: boolean;
  streamer_name: string | null;
  connected_at: number | null;
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

    const streamersResponse = await fetch(streamersUrl, { headers });
    
    if (streamersResponse.ok) {
      const streamers: StreamerData[] = await streamersResponse.json();
      const connectedStreamer = streamers.find((s) => s.is_connected);

      if (connectedStreamer) {
        return res.status(200).json({
          is_live: true,
          streamer_name: connectedStreamer.streamer_username,
          connected_at: connectedStreamer.connected_at || null,
          method: "streamers_api"
        });
      }
    }

    // Method 2: Fall back to nowplaying API
    const nowPlayingUrl = process.env.AZURACAST_API_URL || `${azuracastUrl}/api/nowplaying/${stationId}`;
    const nowPlayingResponse = await fetch(nowPlayingUrl);

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
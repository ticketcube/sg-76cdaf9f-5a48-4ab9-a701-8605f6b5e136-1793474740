import type { NextApiRequest, NextApiResponse } from "next";

interface AzuraCastPlaylist {
  id: number;
  name: string;
  short_name: string;
  type: string;
  source: string;
  order: string;
  remote_url: string | null;
  remote_type: string | null;
  remote_buffer: number;
  is_enabled: boolean;
  is_jingle: boolean;
  play_per_songs: number;
  play_per_minutes: number;
  play_per_hour_minute: number;
  weight: number;
  include_in_requests: boolean;
  include_in_on_demand: boolean;
  backend_options: any;
  avoid_duplicates: boolean;
  schedule_items: Array<{
    id: number;
    start_time: number;
    end_time: number;
    start_date: string | null;
    end_date: string | null;
    days: number[];
    loop_once: boolean;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const baseUrl = process.env.AZURACAST_URL || process.env.NEXT_PUBLIC_AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;
  const stationId = process.env.AZURACAST_STATION_ID || "2";

  if (!baseUrl || !apiKey) {
    console.error("❌ Missing AzuraCast configuration");
    return res.status(500).json({ error: "AzuraCast not configured" });
  }

  try {
    console.log(`📡 Fetching playlists from: ${baseUrl}/api/station/${stationId}/playlists`);
    
    const response = await fetch(`${baseUrl}/api/station/${stationId}/playlists`, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ AzuraCast API error: ${response.status}`, text);
      return res.status(response.status).json({ 
        error: "Failed to fetch playlists from AzuraCast",
        details: text 
      });
    }

    const playlists: AzuraCastPlaylist[] = await response.json();
    console.log(`✅ Fetched ${playlists.length} playlists from AzuraCast`);

    // Transform to simplified format
    const simplified = playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      short_name: playlist.short_name,
      type: playlist.type,
      is_enabled: playlist.is_enabled,
      is_jingle: playlist.is_jingle,
      weight: playlist.weight,
      schedule_count: playlist.schedule_items?.length || 0,
      schedule_items: playlist.schedule_items || []
    }));

    res.status(200).json(simplified);
  } catch (error) {
    console.error("❌ Failed to fetch playlists:", error);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
}
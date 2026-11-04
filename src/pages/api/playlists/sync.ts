import type { NextApiRequest, NextApiResponse } from "next";

interface ScheduleItem {
  start_time: number;
  end_time: number;
  days: number[];
  start_date?: string | null;
  end_date?: string | null;
  loop_once?: boolean;
}

interface PlaylistInput {
  name: string;
  type: string;
  source: string;
  order: string;
  weight: number;
  is_enabled: boolean;
  is_jingle: boolean;
  avoid_duplicates: boolean;
  include_in_requests: boolean;
  include_in_on_demand: boolean;
  schedule_items: ScheduleItem[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { playlists } = req.body as { playlists: PlaylistInput[] };

  if (!playlists || !Array.isArray(playlists)) {
    return res.status(400).json({ error: "Invalid playlists data" });
  }

  const baseUrl = process.env.AZURACAST_URL || process.env.NEXT_PUBLIC_AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;
  const stationId = process.env.AZURACAST_STATION_ID || "2";

  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: "AzuraCast not configured" });
  }

  try {
    // Fetch existing playlists to determine create vs update
    const existingRes = await fetch(`${baseUrl}/api/station/${stationId}/playlists`, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!existingRes.ok) {
      throw new Error("Failed to fetch existing playlists");
    }

    const existing = await existingRes.json();
    const results = [];

    // Process each playlist
    for (const playlist of playlists) {
      const existingPlaylist = existing.find((p: any) => p.name === playlist.name);
      
      const playlistData = {
        name: playlist.name,
        type: playlist.type,
        source: playlist.source,
        order: playlist.order,
        weight: playlist.weight,
        is_enabled: playlist.is_enabled,
        is_jingle: playlist.is_jingle,
        avoid_duplicates: playlist.avoid_duplicates,
        include_in_requests: playlist.include_in_requests,
        include_in_on_demand: playlist.include_in_on_demand,
        schedule_items: playlist.schedule_items
      };

      if (existingPlaylist) {
        // Update existing playlist
        const updateRes = await fetch(`${baseUrl}/api/station/${stationId}/playlist/${existingPlaylist.id}`, {
          method: "PUT",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(playlistData)
        });

        if (!updateRes.ok) {
          throw new Error(`Failed to update playlist: ${playlist.name}`);
        }

        results.push({ action: "updated", name: playlist.name, id: existingPlaylist.id });
      } else {
        // Create new playlist
        const createRes = await fetch(`${baseUrl}/api/station/${stationId}/playlists`, {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(playlistData)
        });

        if (!createRes.ok) {
          throw new Error(`Failed to create playlist: ${playlist.name}`);
        }

        const created = await createRes.json();
        results.push({ action: "created", name: playlist.name, id: created.id });
      }
    }

    res.status(200).json({ 
      success: true, 
      results,
      message: `Successfully synced ${results.length} playlists to AzuraCast`
    });
  } catch (error: any) {
    console.error("Failed to sync playlists:", error);
    res.status(500).json({ error: error.message || "Failed to sync playlists" });
  }
}
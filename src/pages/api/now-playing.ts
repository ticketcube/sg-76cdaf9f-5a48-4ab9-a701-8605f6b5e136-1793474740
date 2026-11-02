import type { NextApiRequest, NextApiResponse } from "next";

interface NowPlayingResponse {
  station: {
    name: string;
    shortcode: string;
  };
  now_playing: {
    song: {
      title: string;
      artist: string;
      album?: string;
      art?: string;
    };
  };
  live: {
    is_live: boolean;
    streamer_name?: string;
  };
  listeners: {
    current: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NowPlayingResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch from AzuraCast API
    const azuracastUrl = process.env.AZURACAST_API_URL || "https://onestowatch.live/api/nowplaying/otw_radio";
    const response = await fetch(azuracastUrl);
    
    if (!response.ok) {
      throw new Error(`AzuraCast API returned ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Failed to fetch now playing:", error);
    
    // Return fallback data
    res.status(200).json({
      station: {
        name: "OTW Radio",
        shortcode: "otw_radio"
      },
      now_playing: {
        song: {
          title: "OTW Radio",
          artist: "OnesToWatch"
        }
      },
      live: {
        is_live: false
      },
      listeners: {
        current: 0
      }
    });
  }
}
import type { NextApiRequest, NextApiResponse } from "next";

interface AzuraCastStation {
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
      text?: string;
    };
  };
  live: {
    is_live: boolean;
    streamer_name?: string;
  };
  listeners: {
    current: number;
  };
  is_online: boolean;
}

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
  is_online: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NowPlayingResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const azuracastUrl = "https://radio.onestowatch.live/api/nowplaying";
    const response = await fetch(azuracastUrl, {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });
    
    if (!response.ok) {
      throw new Error(`AzuraCast API returned ${response.status}`);
    }

    const data: AzuraCastStation[] = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Invalid response format from AzuraCast");
    }

    const stationData = data[0];
    
    const result: NowPlayingResponse = {
      station: stationData.station,
      now_playing: {
        song: {
          title: stationData.now_playing.song.title || "OTW Radio",
          artist: stationData.now_playing.song.artist || "OnesToWatch",
          album: stationData.now_playing.song.album,
          art: stationData.now_playing.song.art || "/OTWCOLOR_copy.png"
        }
      },
      live: {
        is_live: stationData.live.is_live,
        streamer_name: stationData.live.streamer_name || undefined
      },
      listeners: {
        current: stationData.listeners.current
      },
      is_online: stationData.is_online
    };

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to fetch now playing:", error);
    
    res.status(200).json({
      station: {
        name: "OTW Radio",
        shortcode: "otw_radio"
      },
      now_playing: {
        song: {
          title: "OTW Radio",
          artist: "OnesToWatch",
          art: "/OTWCOLOR_copy.png"
        }
      },
      live: {
        is_live: false
      },
      listeners: {
        current: 0
      },
      is_online: false
    });
  }
}
import type { NextApiRequest, NextApiResponse } from "next";

interface AzuraCastPlaylist {
  id: number;
  name: string;
  schedule_items?: Array<{
    start_time: number;
    end_time: number;
  }>;
}

interface NowPlayingResponse {
  now_playing?: {
    playlist?: string;
  };
}

async function fetchAzuraCastPlaylists(): Promise<AzuraCastPlaylist[]> {
  const baseUrl = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://onestowatch.live";
  const apiKey = process.env.AZURACAST_API_KEY;
  const stationId = process.env.AZURACAST_STATION_ID || "2";

  if (!apiKey) {
    console.warn("AZURACAST_API_KEY not set, returning empty playlists");
    return [];
  }

  try {
    const response = await fetch(`${baseUrl}/api/station/${stationId}/playlists`, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      console.error("AzuraCast API error:", response.status, await response.text());
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch AzuraCast playlists:", error);
    return [];
  }
}

async function fetchNowPlaying(): Promise<string | null> {
  const baseUrl = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://onestowatch.live";
  const stationShortcode = process.env.NEXT_PUBLIC_STATION_SHORTCODE || "otw_radio";

  try {
    const response = await fetch(`${baseUrl}/api/nowplaying/${stationShortcode}`);
    if (!response.ok) return null;
    
    const data: NowPlayingResponse = await response.json();
    return data.now_playing?.playlist || null;
  } catch (error) {
    console.error("Failed to fetch now playing:", error);
    return null;
  }
}

function timeToHHMM(time: number): string {
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  return `${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
}

function getCurrentTimeBlock(schedule: Array<{ start: string; end: string }>): number {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const currentTime = et.getHours() * 100 + et.getMinutes();

  for (let i = 0; i < schedule.length; i++) {
    const start = parseInt(schedule[i].start);
    const end = parseInt(schedule[i].end);
    if (currentTime >= start && currentTime < end) {
      return i;
    }
  }
  return -1;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Fetch playlists from AzuraCast
    const playlists = await fetchAzuraCastPlaylists();
    const nowPlayingPlaylist = await fetchNowPlaying();

    // Static daily schedule structure
    const dailySchedule = [
      { start: "0000", end: "1000", block: "overnight" },
      { start: "1000", end: "1200", block: "weekly_feature" },
      { start: "1200", end: "1500", block: "guest_curator" },
      { start: "1500", end: "1700", block: "weekly_feature", airing: "repeat" },
      { start: "1700", end: "2400", block: "overnight" }
    ];

    const currentBlockIndex = getCurrentTimeBlock(dailySchedule);

    // Match playlists to schedule blocks
    const daily = dailySchedule.map((slot, index) => {
      // Find playlist that matches this time slot
      const matchingPlaylist = playlists.find(p => {
        if (!p.schedule_items || p.schedule_items.length === 0) {
          // OTW Playlist has no schedule (plays when nothing else is scheduled)
          return slot.block === "overnight";
        }
        
        // Check if any schedule item overlaps with this slot
        return p.schedule_items.some(item => {
          const itemStart = item.start_time;
          const itemEnd = item.end_time;
          const slotStart = parseInt(slot.start);
          const slotEnd = parseInt(slot.end);
          
          return itemStart === slotStart && itemEnd === slotEnd;
        });
      });

      return {
        ...slot,
        playlist_id: matchingPlaylist?.id?.toString() || null,
        playlist_name: matchingPlaylist?.name || null,
        is_current: index === currentBlockIndex && matchingPlaylist?.name === nowPlayingPlaylist
      };
    });

    const blocks = {
      "overnight": {
        title: "OTW Playlist",
        description: "Continuous rotation of Ones To Watch artists"
      },
      "weekly_feature": {
        title: "Weekly Feature",
        description: "Today's featured programming"
      },
      "guest_curator": {
        title: "Guest Curator",
        description: "Curated by special guests"
      }
    };

    const features = {
      "1": { title: "OTW Weekly Recap", description: "The week in OTW: news, releases and clips." },
      "2": { title: "Chef's Choice", description: "Curator picks from the OTW editorial team." },
      "3": { title: "OTW Touring Artists", description: "Artists on the road this week." },
      "4": { title: "GWLMMWLG", description: "Girls Who Like Making Music With Like Girls." },
      "5": { title: "Artist Interview", description: "One long-form artist interview." }
    };

    const response = {
      station: {
        name: "OTW Radio",
        timezone: "America/New_York"
      },
      daily,
      blocks,
      features,
      azuracast_playlists: playlists.map(p => ({
        id: p.id,
        name: p.name,
        scheduled: p.schedule_items && p.schedule_items.length > 0
      }))
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Failed to load schedule:", error);
    res.status(500).json({ error: "Failed to load schedule" });
  }
}
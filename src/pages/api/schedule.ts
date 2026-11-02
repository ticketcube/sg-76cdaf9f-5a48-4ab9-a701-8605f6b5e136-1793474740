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
    console.error("❌ AZURACAST_API_KEY not set in .env.local");
    return [];
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
      return [];
    }

    const playlists = await response.json();
    console.log(`✅ Fetched ${playlists.length} playlists from AzuraCast`);
    playlists.forEach((p: AzuraCastPlaylist) => {
      console.log(`   📀 "${p.name}" (ID: ${p.id}) - ${p.schedule_items?.length || 0} schedule items`);
      if (p.schedule_items && p.schedule_items.length > 0) {
        p.schedule_items.forEach(item => {
          console.log(`      ⏰ Schedule item:`, JSON.stringify(item, null, 2));
        });
      }
    });

    return playlists;
  } catch (error) {
    console.error("❌ Failed to fetch AzuraCast playlists:", error);
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
    const playlist = data.now_playing?.playlist || null;
    console.log(`🎵 Currently playing playlist: ${playlist || "none"}`);
    return playlist;
  } catch (error) {
    console.error("❌ Failed to fetch now playing:", error);
    return null;
  }
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
    console.log("\n🔄 /api/schedule called");
    
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
    console.log(`⏰ Current block index: ${currentBlockIndex}`);

    // Match playlists to schedule blocks using schedule_items
    const daily = dailySchedule.map((slot, index) => {
      console.log(`\n🔍 Matching slot ${slot.start}-${slot.end} (${slot.block})`);
      
      // Get current day of week (1 = Monday, 7 = Sunday)
      const now = new Date();
      const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const dayOfWeek = et.getDay() === 0 ? 7 : et.getDay(); // Convert Sunday from 0 to 7
      
      // Find playlist with schedule_items that match this slot
      const matchingPlaylist = playlists.find(p => {
        // If no schedule_items, this is the default "OTW Playlist" (plays overnight)
        if (!p.schedule_items || p.schedule_items.length === 0) {
          return slot.block === "overnight";
        }
        
        // Check if any schedule_item matches this slot's time AND today's day
        return p.schedule_items.some(item => {
          const slotStart = parseInt(slot.start);
          const slotEnd = parseInt(slot.end);
          
          // Log the full schedule item for debugging
          console.log(`   📋 Checking "${p.name}" schedule item:`, item);
          console.log(`      Comparing: slot ${slotStart}-${slotEnd} on day ${dayOfWeek}`);
          
          // Match based on time only (if days is not specified) or time + day
          const timeMatch = item.start_time === slotStart && item.end_time === slotEnd;
          const dayMatch = !item.days || item.days.length === 0 || item.days.includes(dayOfWeek);
          
          const match = timeMatch && dayMatch;
          
          if (match) {
            console.log(`   ✅ Matched! "${p.name}"`);
          }
          
          return match;
        });
      });

      if (!matchingPlaylist) {
        console.log(`   ❌ No playlist matched this slot`);
      }

      return {
        ...slot,
        playlist_id: matchingPlaylist?.id?.toString() || null,
        playlist_name: matchingPlaylist?.name || null,
        is_current: index === currentBlockIndex && matchingPlaylist?.name === nowPlayingPlaylist
      };
    });

    console.log(`\n📊 Final schedule with ${daily.filter(s => s.playlist_name).length}/${daily.length} slots with playlists\n`);

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
      debug: {
        azuracast_playlists_count: playlists.length,
        azuracast_playlists: playlists.map(p => ({
          id: p.id,
          name: p.name,
          schedule_items_count: p.schedule_items?.length || 0,
          schedule_items: p.schedule_items || []
        }))
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Failed to load schedule:", error);
    res.status(500).json({ error: "Failed to load schedule" });
  }
}
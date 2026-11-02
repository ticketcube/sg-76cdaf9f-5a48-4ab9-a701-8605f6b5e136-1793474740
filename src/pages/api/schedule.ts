import type { NextApiRequest, NextApiResponse } from "next";

interface AzuraCastScheduleItem {
  start_timestamp: number;
  start: string;
  end_timestamp: number;
  end: string;
  is_now: boolean;
  name: string;
  type: string;
  playlist_id?: number;
  description?: string;
}

interface NowPlayingResponse {
  now_playing?: {
    playlist?: string;
  };
}

async function fetchAzuraCastSchedule(): Promise<AzuraCastScheduleItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://onestowatch.live";
  const stationId = process.env.AZURACAST_STATION_ID || "2";

  try {
    console.log(`📡 Fetching schedule from: ${baseUrl}/api/station/${stationId}/schedule`);
    const response = await fetch(`${baseUrl}/api/station/${stationId}/schedule`, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ AzuraCast API error: ${response.status}`, text);
      return [];
    }

    const scheduleItems = await response.json();
    console.log(`✅ Fetched ${scheduleItems.length} schedule items from AzuraCast`);
    scheduleItems.forEach((item: AzuraCastScheduleItem) => {
      console.log(`   📅 ${item.start} - ${item.end}: "${item.name}" (${item.type})`);
      if (item.is_now) {
        console.log(`      🔴 Currently playing`);
      }
    });

    return scheduleItems;
  } catch (error) {
    console.error("❌ Failed to fetch AzuraCast schedule:", error);
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

function parseAzuraCastTime(timeStr: string): number {
  // AzuraCast returns times like "10:00am" or "3:00pm"
  const match = timeStr.match(/(\d+):(\d+)(am|pm)/i);
  if (!match) return 0;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3].toLowerCase();
  
  if (period === 'pm' && hours !== 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;
  
  return hours * 100 + minutes;
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
    
    // Fetch schedule from AzuraCast
    const azuraSchedule = await fetchAzuraCastSchedule();
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

    // Match AzuraCast schedule items to our time slots
    const daily = dailySchedule.map((slot, index) => {
      console.log(`\n🔍 Matching slot ${slot.start}-${slot.end} (${slot.block})`);
      
      const slotStart = parseInt(slot.start);
      const slotEnd = parseInt(slot.end);
      
      // Find AzuraCast schedule item that matches this time slot
      const matchingItem = azuraSchedule.find(item => {
        const itemStart = parseAzuraCastTime(item.start);
        const itemEnd = parseAzuraCastTime(item.end);
        
        console.log(`   📋 Checking "${item.name}": ${itemStart}-${itemEnd} vs slot ${slotStart}-${slotEnd}`);
        
        // Match if the times overlap or align
        const matches = itemStart === slotStart || (itemStart >= slotStart && itemStart < slotEnd);
        
        if (matches) {
          console.log(`   ✅ Matched! "${item.name}"`);
        }
        
        return matches;
      });

      if (!matchingItem) {
        console.log(`   ❌ No schedule item matched this slot`);
      }

      return {
        ...slot,
        playlist_id: matchingItem?.playlist_id?.toString() || null,
        playlist_name: matchingItem?.name || null,
        playlist_description: matchingItem?.description || null,
        is_current: index === currentBlockIndex && matchingItem?.is_now
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
        azuracast_schedule_count: azuraSchedule.length,
        azuracast_schedule: azuraSchedule.map(item => ({
          name: item.name,
          start: item.start,
          end: item.end,
          type: item.type,
          is_now: item.is_now,
          start_parsed: parseAzuraCastTime(item.start),
          end_parsed: parseAzuraCastTime(item.end)
        }))
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Failed to load schedule:", error);
    res.status(500).json({ error: "Failed to load schedule" });
  }
}
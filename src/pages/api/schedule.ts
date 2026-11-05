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

async function fetchAzuraCastSchedule(): Promise<AzuraCastScheduleItem[]> {
  const baseUrl = "https://radio.onestowatch.live";
  const stationId = "otw_radio";

  try {
    const response = await fetch(`${baseUrl}/api/station/${stationId}/schedule`, {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      console.error(`AzuraCast API error: ${response.status}`);
      return [];
    }

    const scheduleItems = await response.json();
    return Array.isArray(scheduleItems) ? scheduleItems : [];
  } catch (error) {
    console.error("Failed to fetch AzuraCast schedule:", error);
    return [];
  }
}

function parseAzuraCastTime(timeStr: string): { hours: number; minutes: number; time24: number } {
  try {
    // Parse the ISO string and format in Pacific Time
    const date = new Date(timeStr);
    const hours = parseInt(date.toLocaleString("en-US", { 
      timeZone: "America/Los_Angeles", 
      hour: "2-digit", 
      hour12: false 
    }));
    const minutes = parseInt(date.toLocaleString("en-US", { 
      timeZone: "America/Los_Angeles", 
      minute: "2-digit" 
    }));
    return { hours, minutes, time24: hours * 100 + minutes };
  } catch (error) {
    console.error(`Failed to parse time "${timeStr}":`, error);
    return { hours: 0, minutes: 0, time24: 0 };
  }
}

function groupScheduleByDay(items: AzuraCastScheduleItem[]) {
  const days: { [key: string]: AzuraCastScheduleItem[] } = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
  };

  items.forEach(item => {
    // Use start_timestamp to get the correct day in Pacific Time
    const date = new Date(item.start_timestamp * 1000);
    const dayName = date.toLocaleDateString("en-US", { 
      weekday: "long", 
      timeZone: "America/Los_Angeles" 
    });
    if (days[dayName]) {
      days[dayName].push(item);
    }
  });

  Object.keys(days).forEach(day => {
    days[day].sort((a, b) => a.start_timestamp - b.start_timestamp);
  });

  return days;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const scheduleItems = await fetchAzuraCastSchedule();
    
    const now = new Date();
    const today = now.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/Los_Angeles" });
    
    const groupedSchedule = groupScheduleByDay(scheduleItems);
    
    const todaySchedule = groupedSchedule[today] || [];
    
    const response = {
      today: todaySchedule.map(item => ({
        ...item,
        parsed_time: parseAzuraCastTime(item.start)
      })),
      week: groupedSchedule,
      current_day: today,
      timezone: "America/Los_Angeles"
    };

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).json(response);
  } catch (error) {
    console.error("Failed to load schedule:", error);
    res.status(500).json({ error: "Failed to load schedule" });
  }
}
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
    const date = new Date(timeStr);
    const ptDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    const hours = ptDate.getHours();
    const minutes = ptDate.getMinutes();
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
    const date = new Date(item.start);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "America/Los_Angeles" });
    if (days[dayName]) {
      days[dayName].push(item);
    }
  });

  Object.keys(days).forEach(day => {
    days[day].sort((a, b) => parseAzuraCastTime(a.start).time24 - parseAzuraCastTime(b.start).time24);
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
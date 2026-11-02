import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get current day of week (1=Monday, 7=Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();

    // Fetch schedule slots for today with playlist info
    const { data: scheduleSlots, error } = await supabase
      .from("schedule_slots")
      .select(`
        *,
        playlists (
          id,
          name,
          description
        )
      `)
      .eq("day_of_week", dayOfWeek)
      .order("start_time");

    if (error) {
      console.error("Error fetching schedule:", error);
      return res.status(500).json({ error: "Failed to fetch schedule from database" });
    }

    // Transform to match frontend format
    const daily = scheduleSlots?.map(slot => ({
      start: slot.start_time,
      end: slot.end_time,
      block: slot.block_name,
      playlist_id: slot.playlist_id,
      playlist_name: slot.playlists?.name || null,
      playlist_description: slot.playlists?.description || null
    })) || [];

    // Static block definitions
    const blocks = {
      "morning_drive": {
        title: "Morning Drive",
        description: "Start your day with OTW energy"
      },
      "midday": {
        title: "Midday",
        description: "Keeping the momentum through lunch"
      },
      "afternoon": {
        title: "Afternoon Drive",
        description: "Your commute companion"
      },
      "evening": {
        title: "Evening",
        description: "Unwind with us"
      },
      "overnight": {
        title: "Overnight",
        description: "Late night vibes"
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
      features
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Failed to load schedule:", error);
    res.status(500).json({ error: "Failed to load schedule" });
  }
}
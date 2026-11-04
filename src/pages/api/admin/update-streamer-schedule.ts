import type { NextApiRequest, NextApiResponse } from "next";

const AZURACAST_BASE_URL = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://radio.onestowatch.live";
const AZURACAST_API_KEY = process.env.AZURACAST_API_KEY;
const STATION_ID = process.env.AZURACAST_STATION_ID || "2";

interface ScheduleItem {
  start_time: number;
  end_time: number;
  days: number[];
  start_date?: string | null;
  end_date?: string | null;
}

interface UpdateScheduleRequest {
  streamer_id: number;
  enforce_schedule: boolean;
  schedule_items: ScheduleItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!AZURACAST_API_KEY) {
      return res.status(500).json({ error: "AzuraCast API key not configured" });
    }

    const { streamer_id, enforce_schedule, schedule_items } = req.body as UpdateScheduleRequest;

    if (!streamer_id) {
      return res.status(400).json({ error: "streamer_id is required" });
    }

    // Update streamer schedule in AzuraCast
    const updateResponse = await fetch(
      `${AZURACAST_BASE_URL}/api/station/${STATION_ID}/streamer/${streamer_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": AZURACAST_API_KEY
        },
        body: JSON.stringify({
          enforce_schedule,
          schedule_items
        })
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error("AzuraCast update error:", errorText);
      throw new Error(`AzuraCast API error: ${updateResponse.status} - ${errorText}`);
    }

    const updatedStreamer = await updateResponse.json();

    return res.status(200).json({
      success: true,
      streamer: updatedStreamer
    });

  } catch (error: any) {
    console.error("Error updating streamer schedule:", error);
    return res.status(500).json({ 
      error: error.message || "Failed to update streamer schedule"
    });
  }
}
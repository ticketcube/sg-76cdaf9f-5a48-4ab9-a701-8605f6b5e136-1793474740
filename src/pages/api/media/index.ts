import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const baseUrl = process.env.AZURACAST_URL || process.env.NEXT_PUBLIC_AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;
  const stationId = process.env.AZURACAST_STATION_ID || "2";

  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: "AzuraCast not configured" });
  }

  try {
    // Fetch all files in the station
    const response = await fetch(`${baseUrl}/api/station/${stationId}/files`, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ 
        error: "Failed to fetch media from AzuraCast",
        details: text 
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Failed to fetch media:", error);
    res.status(500).json({ error: "Failed to fetch media" });
  }
}
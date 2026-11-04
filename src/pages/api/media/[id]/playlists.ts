import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const { playlists } = req.body; // Array of playlist IDs

  if (!id || !playlists || !Array.isArray(playlists)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const baseUrl = process.env.AZURACAST_URL || process.env.NEXT_PUBLIC_AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;
  const stationId = process.env.AZURACAST_STATION_ID || "2";

  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: "AzuraCast not configured" });
  }

  try {
    // AzuraCast expects an array of objects for playlists: [{ id: 1 }, { id: 2 }]
    const formattedPlaylists = playlists.map(pId => ({ id: pId }));

    const response = await fetch(`${baseUrl}/api/station/${stationId}/file/${id}`, {
      method: "PUT",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        playlists: formattedPlaylists
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ 
        error: "Failed to update media playlists",
        details: text 
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to update media:", error);
    res.status(500).json({ error: "Failed to update media" });
  }
}
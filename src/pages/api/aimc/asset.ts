import type { NextApiRequest, NextApiResponse } from "next";

interface AIMCAsset {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  media?: {
    durationSec?: number;
    audioCodec?: string;
  };
  tags?: {
    Artist?: string;
  };
  representations?: Array<{
    purpose: string;
    url?: string;
  }>;
}

// Unwrap AIMC's sometimes-wrapped responses
function unwrapAIMC(data: any): any {
  if (data?.statusCode && data?.body) {
    try {
      const body = typeof data.body === "string" ? JSON.parse(data.body) : data.body;
      return body.data || body;
    } catch {
      return data;
    }
  }
  return data.data || data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { assetId } = req.body;

  if (!assetId) {
    return res.status(400).json({ error: "Asset ID required" });
  }

  const baseUrl = process.env.AIMC_API_URL || "https://otw.aimc-ln.com/v1";
  const apiKey = process.env.AIMC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "AIMC not configured" });
  }

  try {
    const response = await fetch(`${baseUrl}/assets/${assetId}`, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ 
        error: "Failed to fetch asset from AIMC",
        details: text 
      });
    }

    const rawData = await response.json();
    const asset = unwrapAIMC(rawData) as AIMCAsset;

    // Find thumbnail
    const thumbnail = asset.representations?.find(r => r.purpose === "thumbnail")?.url;

    // Extract artist from filename if not in tags
    let artist = asset.tags?.Artist || "";
    if (!artist && asset.name) {
      // DreamIvory_Podcast_Cutdown → Dream Ivory
      const firstPart = asset.name.split("_")[0];
      artist = firstPart.replace(/([A-Z])/g, " $1").trim();
    }

    // Extract title from filename
    let title = asset.name;
    // Remove extension
    title = title.replace(/\.[^.]+$/, "");
    // Remove YouTube IDs like [A-eO2FCh4L8]
    title = title.replace(/\[[A-Za-z0-9_-]+\]/g, "");
    // Replace underscores with spaces
    title = title.replace(/_/g, " ").trim();

    res.status(200).json({
      id: asset.id,
      name: asset.name,
      type: asset.type,
      sizeBytes: asset.sizeBytes,
      durationSec: asset.media?.durationSec,
      audioCodec: asset.media?.audioCodec,
      thumbnail,
      suggestedArtist: artist,
      suggestedTitle: title
    });
  } catch (error: any) {
    console.error("Failed to fetch AIMC asset:", error);
    res.status(500).json({ error: error.message || "Failed to fetch asset" });
  }
}
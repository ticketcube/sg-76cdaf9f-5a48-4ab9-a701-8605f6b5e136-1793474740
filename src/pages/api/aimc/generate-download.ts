import type { NextApiRequest, NextApiResponse } from "next";

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
    const response = await fetch(`${baseUrl}/assets/generate-presigned-url`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        inventory_id: assetId,
        expiration_time: 3600
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ 
        error: "Failed to generate download URL",
        details: text 
      });
    }

    const rawData = await response.json();
    const data = unwrapAIMC(rawData);
    const downloadUrl = data.presigned_url || data.url;

    if (!downloadUrl) {
      return res.status(500).json({ error: "No download URL in response" });
    }

    res.status(200).json({ downloadUrl });
  } catch (error: any) {
    console.error("Failed to generate download URL:", error);
    res.status(500).json({ error: error.message || "Failed to generate download URL" });
  }
}
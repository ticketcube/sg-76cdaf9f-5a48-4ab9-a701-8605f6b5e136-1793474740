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

  const { filename, fileSize, contentType } = req.body;

  if (!filename || !fileSize) {
    return res.status(400).json({ error: "Filename and fileSize required" });
  }

  const baseUrl = process.env.AIMC_API_URL || "https://otw.aimc-ln.com/v1";
  const apiKey = process.env.AIMC_API_KEY;
  const connectorId = process.env.AIMC_UPLOAD_CONNECTOR_ID || "115b2c89-246f-4d8f-8c83-71fd7fe77644";
  const uploadFolder = process.env.AIMC_UPLOAD_FOLDER || "OTW/OTWL_Audio";

  if (!apiKey) {
    return res.status(500).json({ error: "AIMC not configured" });
  }

  try {
    const response = await fetch(`${baseUrl}/assets/upload`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        connector_id: connectorId,
        filename,
        content_type: contentType || "application/octet-stream",
        file_size: fileSize,
        path: uploadFolder,
        collection_ids: [],
        method: "PUT"
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ 
        error: "Failed to generate upload URL",
        details: text 
      });
    }

    const rawData = await response.json();
    const data = unwrapAIMC(rawData);
    const uploadUrl = data.url;
    const key = data.key;
    const bucket = data.bucket;

    if (!uploadUrl) {
      return res.status(500).json({ error: "No upload URL in response" });
    }

    res.status(200).json({ uploadUrl, key, bucket });
  } catch (error: any) {
    console.error("Failed to generate upload URL:", error);
    res.status(500).json({ error: error.message || "Failed to generate upload URL" });
  }
}
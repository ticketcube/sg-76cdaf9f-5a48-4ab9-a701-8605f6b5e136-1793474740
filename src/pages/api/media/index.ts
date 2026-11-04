import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const baseUrl = process.env.AZURACAST_URL || process.env.NEXT_PUBLIC_AZURACAST_URL;
  const apiKey = process.env.AZURACAST_API_KEY;
  const stationId = process.env.AZURACAST_STATION_ID || "2";

  if (!baseUrl || !apiKey) {
    return res.status(500).json({ error: "AzuraCast not configured" });
  }

  if (req.method === "GET") {
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
  } else if (req.method === "POST") {
    try {
      // Parse multipart form data
      const form = formidable({});
      const [fields, files] = await form.parse(req);
      
      const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!uploadedFile) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Read file and prepare for upload to AzuraCast
      const fileBuffer = fs.readFileSync(uploadedFile.filepath);
      const blob = new Blob([fileBuffer], { type: uploadedFile.mimetype || "audio/mpeg" });

      // Upload to AzuraCast
      const formData = new FormData();
      formData.append("file", blob, uploadedFile.originalFilename || "upload.mp3");

      const response = await fetch(`${baseUrl}/api/station/${stationId}/files`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
        },
        body: formData
      });

      // Clean up temp file
      fs.unlinkSync(uploadedFile.filepath);

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ 
          error: "Failed to upload to AzuraCast",
          details: text 
        });
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error("Failed to upload media:", error);
      res.status(500).json({ error: "Failed to upload media" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { filename, contentType } = req.body;

  if (!filename) {
    return res.status(400).json({ error: "Filename required" });
  }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-1";
  const bucket = process.env.AWS_S3_BUCKET;
  const uploadFolder = process.env.AIMC_UPLOAD_FOLDER || "OTW/OTWL_Audio";

  if (!accessKeyId || !secretAccessKey || !bucket) {
    return res.status(500).json({ 
      error: "AWS S3 not configured",
      details: "Missing AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, or AWS_S3_BUCKET"
    });
  }

  try {
    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Generate S3 key with folder prefix
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${uploadFolder}/${timestamp}/${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });

    // Generate presigned URL (valid for 15 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    console.log("[S3 Upload] Generated presigned URL:", {
      bucket,
      key,
      contentType,
      region
    });

    res.status(200).json({ 
      uploadUrl, 
      key,
      bucket,
      region
    });

  } catch (error: any) {
    console.error("[S3 Upload] Failed to generate presigned URL:", error);
    res.status(500).json({ 
      error: "Failed to generate S3 upload URL",
      details: error.message 
    });
  }
}
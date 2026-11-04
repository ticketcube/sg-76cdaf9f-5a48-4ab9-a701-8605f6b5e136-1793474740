import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check worker token
  const authHeader = req.headers.authorization;
  const workerToken = process.env.WORKER_TOKEN;

  if (!authHeader || !workerToken || authHeader !== `Bearer ${workerToken}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Use service role to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Find oldest queued job
    const { data: jobs, error: fetchError } = await supabase
      .from("extraction_jobs")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error("Failed to fetch queued job:", fetchError);
      return res.status(500).json({ error: "Failed to fetch job" });
    }

    if (!jobs || jobs.length === 0) {
      return res.status(204).send("");
    }

    const job = jobs[0];

    // Mark as downloading
    const { error: updateError } = await supabase
      .from("extraction_jobs")
      .update({ status: "downloading", updated_at: new Date().toISOString() })
      .eq("id", job.id);

    if (updateError) {
      console.error("Failed to claim job:", updateError);
      return res.status(500).json({ error: "Failed to claim job" });
    }

    // Generate fresh download link
    const baseUrl = process.env.AIMC_API_URL || "https://otw.aimc-ln.com/v1";
    const apiKey = process.env.AIMC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "AIMC not configured" });
    }

    const downloadRes = await fetch(`${baseUrl}/assets/generate-presigned-url`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inventory_id: job.asset_id,
        expiration_time: 3600
      })
    });

    if (!downloadRes.ok) {
      await supabase
        .from("extraction_jobs")
        .update({ 
          status: "failed", 
          error: "Failed to generate download URL",
          updated_at: new Date().toISOString()
        })
        .eq("id", job.id);
      return res.status(500).json({ error: "Failed to generate download URL" });
    }

    const downloadData = await downloadRes.json();
    const unwrapped = downloadData.data || downloadData;
    const downloadUrl = unwrapped.presigned_url || unwrapped.url;

    res.status(200).json({
      ...job,
      download_url: downloadUrl
    });
  } catch (error: any) {
    console.error("Failed to claim job:", error);
    res.status(500).json({ error: error.message || "Failed to claim job" });
  }
}
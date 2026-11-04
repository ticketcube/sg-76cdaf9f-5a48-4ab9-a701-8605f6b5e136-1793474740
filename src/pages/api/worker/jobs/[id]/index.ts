import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  const workerToken = process.env.WORKER_TOKEN;

  if (!authHeader || !workerToken || authHeader !== `Bearer ${workerToken}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  const { status, error, aimc_key, radio_path, duration_sec, size_bytes } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: "Job ID and status required" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const update: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (error) update.error = error;
    if (aimc_key) update.aimc_key = aimc_key;
    if (radio_path) update.radio_path = radio_path;
    if (duration_sec) update.duration_sec = duration_sec;
    if (size_bytes) update.size_bytes = size_bytes;

    const { error: updateError } = await supabase
      .from("extraction_jobs")
      .update(update)
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update job:", updateError);
      return res.status(500).json({ error: "Failed to update job" });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Failed to update job:", error);
    res.status(500).json({ error: error.message || "Failed to update job" });
  }
}
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { assetId, assetName, artist, title, saveToAimc, saveToRadio } = req.body;

  if (!assetId || !assetName || !title) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Get auth header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Create authenticated client
    const supabaseAuth = supabase;
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Create job
    const { data: job, error: createError } = await supabase
      .from("extraction_jobs")
      .insert({
        asset_id: assetId,
        asset_name: assetName,
        artist: artist || null,
        title,
        save_to_aimc: saveToAimc,
        save_to_radio: saveToRadio,
        status: "queued",
        created_by: user.id
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create job:", createError);
      return res.status(500).json({ error: "Failed to create job" });
    }

    res.status(200).json(job);
  } catch (error: any) {
    console.error("Failed to create extraction job:", error);
    res.status(500).json({ error: error.message || "Failed to create job" });
  }
}
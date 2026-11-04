import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabaseAuth = supabase;
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: jobs, error: fetchError } = await supabase
      .from("extraction_jobs")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (fetchError) {
      console.error("Failed to fetch jobs:", fetchError);
      return res.status(500).json({ error: "Failed to fetch jobs" });
    }

    res.status(200).json(jobs || []);
  } catch (error: any) {
    console.error("Failed to fetch extraction jobs:", error);
    res.status(500).json({ error: error.message || "Failed to fetch jobs" });
  }
}
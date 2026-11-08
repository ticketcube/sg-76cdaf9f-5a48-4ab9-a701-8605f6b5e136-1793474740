import type { NextApiRequest, NextApiResponse } from "next";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Create server-side Supabase client that reads cookies from request
  const supabase = createServerSupabaseClient({ req, res });

  // Auth check with server-side client
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return res.status(401).json({ error: "Unauthorized - please log in" });
  }

  // Check admin status from user_profiles table
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("is_admin")
    .eq("user_id", user.id)
    .single();

  const isAdmin = profile?.is_admin === true;

  if (!isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  if (req.method === "GET") {
    // Get all feature flags
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("flag_name", { ascending: true });

    if (error) {
      console.error("Error fetching feature flags:", error);
      return res.status(500).json({ error: "Failed to fetch feature flags" });
    }

    return res.status(200).json({ data });
  }

  if (req.method === "PATCH") {
    // Update a specific flag
    const { flag_name, enabled } = req.body;

    if (!flag_name || typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { data, error } = await supabase
      .from("feature_flags")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("flag_name", flag_name)
      .select()
      .single();

    if (error) {
      console.error("Error updating feature flag:", error);
      return res.status(500).json({ error: "Failed to update feature flag" });
    }

    return res.status(200).json({ success: true, data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
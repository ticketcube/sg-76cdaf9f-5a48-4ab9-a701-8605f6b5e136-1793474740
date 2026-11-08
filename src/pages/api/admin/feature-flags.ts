import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient, type CookieOptions } from "@supabase/auth-helpers-nextjs";
import { serialize, parse } from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Track cookies to set
  const cookiesToSet: string[] = [];

  // Create server-side Supabase client with proper cookie handlers
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {
          // Serialize cookie with proper options
          const serialized = serialize(name, value, {
            path: options.path || "/",
            maxAge: options.maxAge,
            httpOnly: options.httpOnly,
            secure: options.secure,
            sameSite: options.sameSite as any
          });
          cookiesToSet.push(serialized);
        },
        remove(name: string, options: CookieOptions) {
          const serialized = serialize(name, "", {
            path: options.path || "/",
            maxAge: 0
          });
          cookiesToSet.push(serialized);
        }
      }
    }
  );

  // Auth check with server-side client
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  // Set accumulated cookies
  if (cookiesToSet.length > 0) {
    res.setHeader("Set-Cookie", cookiesToSet);
  }
  
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
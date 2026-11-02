import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Admin-only endpoint that uses service role key
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, displayName, role, isAdmin } = req.body;

  if (!email || !password || !displayName || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate role
  const validRoles = ["otwl-dj", "otwl-podcast", "otwl-staff"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for admin-created users
      user_metadata: {
        display_name: displayName
      }
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || "Failed to create user" });
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .insert({
        user_id: authData.user.id,
        email: email,
        username: email.split("@")[0], // Use email prefix as default username
        display_name: displayName,
        role: role,
        is_admin: isAdmin || false
      });

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: profileError.message });
    }

    return res.status(200).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        created_at: authData.user.created_at
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
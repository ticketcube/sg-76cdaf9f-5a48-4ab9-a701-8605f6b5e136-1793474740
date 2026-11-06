import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/integrations/supabase/client";

interface ListenerLocation {
  description: string;
  location: {
    lat: number;
    lon: number;
  };
  listeners: number;
}

interface ListenersResponse {
  total: number;
  unique: number;
  current: ListenerLocation[];
}

// ADMIN-ONLY: This endpoint exposes exact coordinates for internal analytics
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListenersResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized - admin access required" });
    }

    const token = authHeader.substring(7);
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized - admin access required" });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden - admin access required" });
    }

    // Fetch exact listener data from AzuraCast
    const azuracastUrl = process.env.AZURACAST_URL;
    const stationId = process.env.AZURACAST_STATION_ID;
    const apiKey = process.env.AZURACAST_API_KEY;

    if (!azuracastUrl || !stationId || !apiKey) {
      throw new Error("Missing AzuraCast configuration");
    }

    const response = await fetch(`${azuracastUrl}/api/station/${stationId}/listeners`, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`AzuraCast API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Group by exact location for admin view
    const locationMap = new Map<string, { location: { lat: number; lon: number }; listeners: number }>();
    
    if (Array.isArray(data)) {
      data.forEach((listener: any) => {
        if (listener.location && listener.location.lat && listener.location.lon) {
          const key = `${listener.location.description || 'Unknown'}`;
          const existing = locationMap.get(key);
          if (existing) {
            existing.listeners += 1;
          } else {
            locationMap.set(key, {
              location: {
                lat: listener.location.lat,
                lon: listener.location.lon
              },
              listeners: 1
            });
          }
        }
      });
    }

    const current: ListenerLocation[] = Array.from(locationMap.entries()).map(([description, data]) => ({
      description,
      location: data.location,
      listeners: data.listeners
    }));

    const result: ListenersResponse = {
      total: Array.isArray(data) ? data.length : 0,
      unique: current.length,
      current
    };

    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to fetch admin listeners:", error);
    res.status(500).json({ error: "Failed to fetch listener data" });
  }
}
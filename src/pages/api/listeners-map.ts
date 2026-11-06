import type { NextApiRequest, NextApiResponse } from "next";

interface ListenerSpot {
  lat: number;
  lon: number;
  count: number;
  label: string;
}

interface ListenersMapResponse {
  total: number;
  located: number;
  spots: ListenerSpot[];
  source: "live" | "demo" | "unconfigured" | "error";
}

// Round coordinates to ~100km grid (roughly 1 degree lat/lon)
function roundCoordinates(lat: number, lon: number): { lat: number; lon: number } {
  return {
    lat: Math.round(lat),
    lon: Math.round(lon)
  };
}

// Group listeners by rounded coordinates and apply privacy rules
function aggregateListeners(rawListeners: any[]): ListenerSpot[] {
  const locationMap = new Map<string, { lat: number; lon: number; count: number; cities: Set<string> }>();

  rawListeners.forEach((listener: any) => {
    if (listener.location?.lat && listener.location?.lon) {
      const rounded = roundCoordinates(listener.location.lat, listener.location.lon);
      const key = `${rounded.lat},${rounded.lon}`;
      const city = listener.location.description || "Unknown";

      const existing = locationMap.get(key);
      if (existing) {
        existing.count += 1;
        existing.cities.add(city);
      } else {
        locationMap.set(key, {
          lat: rounded.lat,
          lon: rounded.lon,
          count: 1,
          cities: new Set([city])
        });
      }
    }
  });

  // Convert to array and apply privacy rules
  return Array.from(locationMap.values()).map(spot => {
    // Only show city name if 3 or more listeners in that spot
    const label = spot.count >= 3 && spot.cities.size === 1
      ? Array.from(spot.cities)[0]
      : spot.count >= 3
      ? `${spot.count} cities`
      : "Listening";

    return {
      lat: spot.lat,
      lon: spot.lon,
      count: spot.count,
      label
    };
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListenersMapResponse>
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      total: 0,
      located: 0,
      spots: [],
      source: "error"
    });
  }

  try {
    const azuracastUrl = process.env.AZURACAST_URL;
    const stationId = process.env.AZURACAST_STATION_ID;
    const apiKey = process.env.AZURACAST_API_KEY;

    // Return unconfigured state if env vars missing
    if (!azuracastUrl || !stationId || !apiKey) {
      return res.status(200).json({
        total: 0,
        located: 0,
        spots: [],
        source: "unconfigured"
      });
    }

    const response = await fetch(`${azuracastUrl}/api/station/${stationId}/listeners`, {
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`AzuraCast API returned ${response.status}`);
    }

    const rawListeners = await response.json();

    if (!Array.isArray(rawListeners)) {
      throw new Error("Unexpected response format");
    }

    const spots = aggregateListeners(rawListeners);

    const result: ListenersMapResponse = {
      total: rawListeners.length,
      located: spots.reduce((sum, s) => sum + s.count, 0),
      spots,
      source: "live"
    };

    // Cache for 30 seconds at CDN level
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to fetch listeners for map:", error);
    
    // Return error state instead of failing
    res.status(200).json({
      total: 0,
      located: 0,
      spots: [],
      source: "error"
    });
  }
}
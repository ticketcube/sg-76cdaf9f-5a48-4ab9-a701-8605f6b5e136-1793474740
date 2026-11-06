import type { NextApiRequest, NextApiResponse } from "next";

interface ListenerSpot {
  lat: number;
  lon: number;
  count: number;
  label: string;
}

interface SafeListenersResponse {
  total: number;
  located: number;
  spots: ListenerSpot[];
}

/**
 * Privacy-safe public endpoint for listener map
 * - Rounds coordinates to ~100km (1 decimal place ≈ 11km precision)
 * - Hides city names for locations with < 3 listeners
 * - Aggregates by rounded coordinates
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SafeListenersResponse | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
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
    
    // Privacy-safe aggregation by rounded coordinates
    const locationMap = new Map<string, { lat: number; lon: number; count: number; cities: Set<string> }>();
    
    if (Array.isArray(data)) {
      data.forEach((listener: any) => {
        if (listener.location && listener.location.lat && listener.location.lon) {
          // Round to 1 decimal place (~11km precision, provides ~100km privacy zone)
          const roundedLat = Math.round(listener.location.lat * 10) / 10;
          const roundedLon = Math.round(listener.location.lon * 10) / 10;
          const key = `${roundedLat},${roundedLon}`;
          
          const existing = locationMap.get(key);
          if (existing) {
            existing.count += 1;
            if (listener.location.description) {
              existing.cities.add(listener.location.description);
            }
          } else {
            const cities = new Set<string>();
            if (listener.location.description) {
              cities.add(listener.location.description);
            }
            locationMap.set(key, {
              lat: roundedLat,
              lon: roundedLon,
              count: 1,
              cities
            });
          }
        }
      });
    }

    // Convert to public-safe format
    const spots: ListenerSpot[] = Array.from(locationMap.values()).map((data) => {
      let label: string;
      
      if (data.count < 3) {
        // Privacy: hide city names for small groups
        label = "Private";
      } else if (data.cities.size === 0) {
        label = "Unknown";
      } else if (data.cities.size === 1) {
        label = Array.from(data.cities)[0];
      } else {
        // Multiple cities in this rounded area
        const cityList = Array.from(data.cities).slice(0, 2);
        label = data.cities.size > 2 
          ? `${cityList.join(", ")} +${data.cities.size - 2}` 
          : cityList.join(", ");
      }

      return {
        lat: data.lat,
        lon: data.lon,
        count: data.count,
        label
      };
    });

    const result: SafeListenersResponse = {
      total: Array.isArray(data) ? data.length : 0,
      located: spots.length,
      spots
    };

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to fetch listeners:", error);
    res.status(500).json({ error: "Failed to fetch listener data" });
  }
}
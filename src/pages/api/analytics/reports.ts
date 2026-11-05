import type { NextApiRequest, NextApiResponse } from "next";

interface SongPlay {
  title: string;
  artist: string;
  plays: number;
}

interface ReportData {
  overview: {
    total_listeners: number;
    unique_listeners: number;
    average_listeners: number;
    peak_listeners: number;
  };
  top_songs: SongPlay[];
  hourly_listeners: Array<{
    hour: number;
    listeners: number;
  }>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ReportData | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { start, end } = req.query;
    const azuracastUrl = process.env.AZURACAST_URL;
    const stationId = process.env.AZURACAST_STATION_ID;
    const apiKey = process.env.AZURACAST_API_KEY;

    if (!azuracastUrl || !stationId || !apiKey) {
      throw new Error("Missing AzuraCast configuration");
    }

    const headers = {
      "X-API-Key": apiKey,
      "Accept": "application/json"
    };

    const params = new URLSearchParams();
    if (start) params.append("start", start as string);
    if (end) params.append("end", end as string);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const [overviewRes, historyRes] = await Promise.all([
      fetch(`${azuracastUrl}/api/station/${stationId}/reports/overview${queryString}`, {
        headers,
        cache: "no-store"
      }),
      fetch(`${azuracastUrl}/api/station/${stationId}/history${queryString}`, {
        headers,
        cache: "no-store"
      })
    ]);

    if (!overviewRes.ok || !historyRes.ok) {
      throw new Error("Failed to fetch reports");
    }

    const overview = await overviewRes.json();
    const history = await historyRes.json();

    const songPlays = new Map<string, { title: string; artist: string; plays: number }>();
    
    if (Array.isArray(history)) {
      history.forEach((entry: any) => {
        if (entry.song) {
          const key = `${entry.song.title}-${entry.song.artist}`;
          const existing = songPlays.get(key);
          if (existing) {
            existing.plays += 1;
          } else {
            songPlays.set(key, {
              title: entry.song.title,
              artist: entry.song.artist,
              plays: 1
            });
          }
        }
      });
    }

    const top_songs = Array.from(songPlays.values())
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 20);

    const hourlyMap = new Map<number, number>();
    if (Array.isArray(history)) {
      history.forEach((entry: any) => {
        if (entry.played_at) {
          const date = new Date(entry.played_at * 1000);
          const hour = date.getHours();
          hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
        }
      });
    }

    const hourly_listeners = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      listeners: hourlyMap.get(i) || 0
    }));

    const result: ReportData = {
      overview: {
        total_listeners: overview.total_listeners || 0,
        unique_listeners: overview.unique_listeners || 0,
        average_listeners: overview.average_listeners || 0,
        peak_listeners: overview.peak_listeners || 0
      },
      top_songs,
      hourly_listeners
    };

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
}
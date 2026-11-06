import type { NextApiRequest, NextApiResponse } from "next";

// Aggregated, anonymous listener locations for the /embed/listeners map.
// Calls AzuraCast's listener report server-side (it needs AZURACAST_API_KEY),
// then throws away IPs, user agents and exact coordinates. Only rounded
// ~1 degree buckets with counts leave this route.

const BASE_URL =
  process.env.AZURACAST_URL || process.env.NEXT_PUBLIC_AZURACAST_URL || "https://radio.onestowatch.live";
const API_KEY = process.env.AZURACAST_API_KEY;
const STATION = process.env.AZURACAST_STATION_ID || process.env.NEXT_PUBLIC_STATION_SHORTCODE || "otw_radio";

const CACHE_MS = 30_000;
// A bucket shows a city name only when at least this many listeners share it.
const MIN_FOR_CITY = 3;

interface AzuraListener {
  hash?: string;
  location?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
    lat?: number | null;
    lon?: number | null;
  } | null;
}

export interface ListenerSpot {
  lat: number;
  lon: number;
  count: number;
  label: string;
}

export interface ListenersMapResponse {
  total: number;
  located: number;
  spots: ListenerSpot[];
  countries: { country: string; count: number }[];
  source: "live" | "demo" | "unconfigured" | "error";
  updated: string;
}

let cache: { at: number; body: ListenersMapResponse } | null = null;

const countryName = (code: string) => {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) || code;
  } catch {
    return code;
  }
};

function aggregate(listeners: AzuraListener[]): Omit<ListenersMapResponse, "source" | "updated"> {
  // One entry per unique listener hash where AzuraCast gives one.
  const seen = new Set<string>();
  const unique = listeners.filter((l) => {
    if (!l.hash) return true;
    if (seen.has(l.hash)) return false;
    seen.add(l.hash);
    return true;
  });

  const buckets = new Map<string, { lat: number; lon: number; count: number; cities: Map<string, number>; country: string }>();
  const countries = new Map<string, number>();
  let located = 0;

  for (const l of unique) {
    const loc = l.location;
    const country = loc?.country ? countryName(loc.country) : "";
    if (country) countries.set(country, (countries.get(country) || 0) + 1);
    if (typeof loc?.lat !== "number" || typeof loc?.lon !== "number") continue;
    if (loc.lat === 0 && loc.lon === 0) continue;
    located++;
    const lat = Math.round(loc.lat);
    const lon = Math.round(loc.lon);
    const key = `${lat},${lon}`;
    const b = buckets.get(key) || { lat, lon, count: 0, cities: new Map(), country };
    b.count++;
    if (loc.city) b.cities.set(loc.city, (b.cities.get(loc.city) || 0) + 1);
    buckets.set(key, b);
  }

  const spots: ListenerSpot[] = [...buckets.values()]
    .map((b) => {
      const topCity = [...b.cities.entries()].sort((a, c) => c[1] - a[1])[0]?.[0];
      const label = b.count >= MIN_FOR_CITY && topCity ? `${topCity}, ${b.country}` : b.country || "Unknown";
      return { lat: b.lat, lon: b.lon, count: b.count, label };
    })
    .sort((a, b) => b.count - a.count);

  return {
    total: unique.length,
    located,
    spots,
    countries: [...countries.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function demoData(): AzuraListener[] {
  const places: [string, string, number, number, number][] = [
    ["Los Angeles", "US", 34.05, -118.24, 14],
    ["New York", "US", 40.71, -74.0, 11],
    ["Chicago", "US", 41.88, -87.63, 6],
    ["Austin", "US", 30.27, -97.74, 5],
    ["Nashville", "US", 36.16, -86.78, 4],
    ["Seattle", "US", 47.61, -122.33, 3],
    ["Atlanta", "US", 33.75, -84.39, 3],
    ["Toronto", "CA", 43.65, -79.38, 2],
    ["London", "GB", 51.51, -0.13, 2],
    ["Mexico City", "MX", 19.43, -99.13, 1],
  ];
  const out: AzuraListener[] = [];
  places.forEach(([city, country, lat, lon, n]) => {
    for (let i = 0; i < n; i++) out.push({ hash: `${city}-${i}`, location: { city, country, lat, lon } });
  });
  return out;
}

async function publicListenerCount(): Promise<number> {
  try {
    const r = await fetch(`${BASE_URL}/api/nowplaying/${STATION}`, { headers: { Accept: "application/json" } });
    if (!r.ok) return 0;
    const d = await r.json();
    return d?.listeners?.unique ?? d?.listeners?.current ?? 0;
  } catch {
    return 0;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ListenersMapResponse | { error: string }>) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

  if (req.query.demo === "1") {
    return res.status(200).json({ ...aggregate(demoData()), source: "demo", updated: new Date().toISOString() });
  }

  if (cache && Date.now() - cache.at < CACHE_MS) return res.status(200).json(cache.body);

  if (!API_KEY) {
    const total = await publicListenerCount();
    return res.status(200).json({
      total, located: 0, spots: [], countries: [], source: "unconfigured", updated: new Date().toISOString(),
    });
  }

  try {
    const r = await fetch(`${BASE_URL}/api/station/${STATION}/listeners`, {
      headers: { Accept: "application/json", "X-API-Key": API_KEY },
    });
    if (!r.ok) throw new Error(`AzuraCast listeners returned ${r.status}`);
    const data: AzuraListener[] = await r.json();
    const body: ListenersMapResponse = {
      ...aggregate(Array.isArray(data) ? data : []),
      source: "live",
      updated: new Date().toISOString(),
    };
    cache = { at: Date.now(), body };
    return res.status(200).json(body);
  } catch (err) {
    console.error("listeners-map:", err);
    const total = await publicListenerCount();
    return res.status(200).json({
      total, located: 0, spots: [], countries: [], source: "error", updated: new Date().toISOString(),
    });
  }
}
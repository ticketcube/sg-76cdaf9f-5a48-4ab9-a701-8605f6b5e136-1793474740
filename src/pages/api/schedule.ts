import type { NextApiRequest, NextApiResponse } from "next";
import grid from "../../../otw-radio/config/schedule.json";
import {
  STATION_TZ,
  UnifiedScheduleDay,
  UnifiedScheduleItem,
  UnifiedScheduleResponse,
  nextDateKey,
  zonedDateKey,
  zonedMidnight,
} from "@/lib/schedule";

// Unified OTW Radio schedule: every scheduled playlist AND every scheduled
// streamer (DJ/host) slot from AzuraCast, one list per day in station time.
// Gaps are filled with the default rotation (OTW Playlist), so each day reads
// as a full 24 hours. Only playlist and show names leave this route: never
// song titles, so the site never publishes an advance song list.
//
// Server-only env: AZURACAST_URL, AZURACAST_STATION_ID (id or shortcode).

const AZURACAST_URL = (process.env.AZURACAST_URL || "https://radio.onestowatch.live").replace(/\/+$/, "");
const STATION = process.env.AZURACAST_STATION_ID || process.env.NEXT_PUBLIC_STATION_SHORTCODE || "otw_radio";
const DAYS_AHEAD = 7;

// Shape of GET /api/station/{station}/schedule rows (public endpoint).
interface AzuraScheduleRow {
  id: number;
  type: "playlist" | "streamer" | string;
  name: string;
  title?: string;
  description?: string | null;
  start_timestamp: number; // unix seconds
  end_timestamp: number;
  start: string; // ISO 8601
  end: string;
  is_now: boolean;
}

const rotation = grid.blocks.otw_playlist;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) {
      console.error(`AzuraCast ${res.status} for ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`AzuraCast fetch failed for ${url}:`, err);
    return null;
  }
}

/** One call per day, each asking for everything ongoing or upcoming from that
 *  day's midnight. This gets past slots for today and does not depend on how
 *  far ahead AzuraCast computes its schedule. */
async function fetchScheduleRows(dayStarts: number[]): Promise<{ rows: AzuraScheduleRow[]; ok: boolean }> {
  const results = await Promise.all(
    dayStarts.map((start) =>
      fetchJson<AzuraScheduleRow[]>(
        `${AZURACAST_URL}/api/station/${encodeURIComponent(STATION)}/schedule?rows=100&now=${encodeURIComponent(
          new Date(start).toISOString()
        )}`
      )
    )
  );
  const seen = new Set<string>();
  const rows: AzuraScheduleRow[] = [];
  for (const list of results) {
    for (const row of list || []) {
      const key = `${row.type}:${row.id}:${row.start_timestamp}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }
  return { rows, ok: results.some((r) => r !== null) };
}

async function fetchLive(): Promise<{ isLive: boolean; streamerName: string | null; since: number | null }> {
  const data = await fetchJson<{ live?: { is_live?: boolean; streamer_name?: string; broadcast_start?: number | null } }>(
    `${AZURACAST_URL}/api/nowplaying/${encodeURIComponent(STATION)}`
  );
  const live = data?.live;
  return {
    isLive: Boolean(live?.is_live),
    streamerName: live?.is_live ? live.streamer_name || null : null,
    since: live?.broadcast_start ? live.broadcast_start * 1000 : null,
  };
}

function toItems(rows: AzuraScheduleRow[]): UnifiedScheduleItem[] {
  return rows
    .map((row) => {
      const start = row.start_timestamp ? row.start_timestamp * 1000 : Date.parse(row.start);
      const end = row.end_timestamp ? row.end_timestamp * 1000 : Date.parse(row.end);
      return {
        key: `${row.type}-${row.id}-${start}`,
        type: row.type === "streamer" ? "streamer" : "playlist",
        title: row.title || row.name,
        description: row.description || null,
        start,
        end,
        continuesFromPreviousDay: false,
      } as UnifiedScheduleItem;
    })
    .filter((i) => Number.isFinite(i.start) && Number.isFinite(i.end) && i.end > i.start);
}

/** Clip items to the day, resolve overlaps (live beats streamer beats playlist,
 *  then the later start wins, like AzuraCast's interrupt), fill gaps with rotation. */
function buildDay(date: string, start: number, end: number, items: UnifiedScheduleItem[]): UnifiedScheduleDay {
  const priority: Record<string, number> = { live: 3, streamer: 2, playlist: 1, rotation: 0 };
  const inDay = items
    .filter((i) => i.end > start && i.start < end)
    .map((i) => ({
      ...i,
      key: `${i.key}-${date}`,
      continuesFromPreviousDay: i.start < start,
      start: Math.max(i.start, start),
      end: Math.min(i.end, end),
    }))
    .sort((a, b) => a.start - b.start || priority[b.type] - priority[a.type]);

  // Split the day at every item edge, pick the item on air in each segment,
  // then merge consecutive segments of the same item.
  const bounds = Array.from(new Set([start, end, ...inDay.flatMap((i) => [i.start, i.end])])).sort((a, b) => a - b);
  const out: UnifiedScheduleItem[] = [];
  let lastSource: string | null = null; // item the previous segment came from
  for (let b = 0; b < bounds.length - 1; b++) {
    const segStart = bounds[b];
    const segEnd = bounds[b + 1];
    const onAir = inDay
      .filter((i) => i.start <= segStart && i.end >= segEnd)
      .sort((x, y) => priority[y.type] - priority[x.type] || y.start - x.start)[0];
    const prev = out[out.length - 1];
    if (onAir) {
      if (prev && lastSource === onAir.key && prev.end === segStart) prev.end = segEnd;
      // A playlist resumed after a live slot gets its own row and its own key.
      else out.push({ ...onAir, key: `${onAir.key}-${segStart}`, start: segStart, end: segEnd });
      lastSource = onAir.key;
      continue;
    }
    lastSource = null;
    if (prev && prev.type === "rotation" && prev.end === segStart) {
      prev.end = segEnd;
    } else {
      out.push({
        key: `rotation-${segStart}`,
        type: "rotation",
        title: rotation.title,
        description: rotation.description,
        start: segStart,
        end: segEnd,
        continuesFromPreviousDay: false,
      });
    }
  }
  return { date, start, end, items: out };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<UnifiedScheduleResponse | { error: string }>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const tz = grid.station.timezone || STATION_TZ;
  const now = Date.now();

  // Day windows in station time, today first.
  const windows: { date: string; start: number; end: number }[] = [];
  let key = zonedDateKey(now, tz);
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const next = nextDateKey(key);
    windows.push({ date: key, start: zonedMidnight(key, tz), end: zonedMidnight(next, tz) });
    key = next;
  }

  const [{ rows, ok }, live] = await Promise.all([fetchScheduleRows(windows.map((w) => w.start)), fetchLive()]);
  const items = toItems(rows);

  // Someone is on air without a scheduled slot right now: show it as a live item.
  const scheduledStreamerNow = items.some((i) => i.type === "streamer" && i.start <= now && i.end > now);
  if (live.isLive && !scheduledStreamerNow) {
    const liveStart = live.since && live.since <= now ? live.since : now;
    items.push({
      key: `live-${liveStart}`,
      type: "live",
      title: live.streamerName ? `Live: ${live.streamerName}` : "Live on OTW Radio",
      description: null,
      start: liveStart,
      // Unknown end: hold the slot for 15 minutes past now; the next refresh extends it.
      end: now + 15 * 60 * 1000,
      continuesFromPreviousDay: false,
    });
  }

  const body: UnifiedScheduleResponse = {
    station: { name: grid.station.name, timezone: tz },
    generatedAt: now,
    live: { isLive: live.isLive, streamerName: live.streamerName },
    days: windows.map((w) => buildDay(w.date, w.start, w.end, items)),
    azuracastOk: ok,
  };

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return res.status(200).json(body);
}

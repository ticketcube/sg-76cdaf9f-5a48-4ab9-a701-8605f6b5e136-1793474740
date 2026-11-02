// Shared types and time helpers for the unified OTW Radio schedule.
// Used by the /api/schedule route (server) and the Schedule component (browser).

export const STATION_TZ = "America/New_York";

export type ScheduleItemType = "playlist" | "streamer" | "live" | "rotation";

export interface UnifiedScheduleItem {
  /** Stable key for React lists. */
  key: string;
  /** playlist = scheduled AzuraCast playlist, streamer = scheduled DJ/host slot,
   *  live = someone is on air right now without a scheduled slot,
   *  rotation = gap in the AzuraCast schedule, filled by the default OTW Playlist. */
  type: ScheduleItemType;
  title: string;
  description: string | null;
  /** Unix ms, clipped to the day it is listed under. */
  start: number;
  end: number;
  /** True when the item started before this day (crosses midnight). */
  continuesFromPreviousDay: boolean;
}

export interface UnifiedScheduleDay {
  /** YYYY-MM-DD in station time. */
  date: string;
  /** Unix ms of local midnight that starts this day. */
  start: number;
  end: number;
  items: UnifiedScheduleItem[];
}

export interface UnifiedScheduleResponse {
  station: { name: string; timezone: string };
  generatedAt: number;
  live: { isLive: boolean; streamerName: string | null };
  days: UnifiedScheduleDay[];
  /** False when AzuraCast could not be reached; days then show rotation only. */
  azuracastOk: boolean;
}

/** Offset of `tz` from UTC at instant `ts`, in ms (EST = -5h). */
export function tzOffsetMs(ts: number, tz: string = STATION_TZ): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(ts / 1000) * 1000;
}

/** YYYY-MM-DD for instant `ts` in `tz`. */
export function zonedDateKey(ts: number, tz: string = STATION_TZ): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(ts)
  );
}

/** Unix ms of midnight in `tz` on the calendar day `dateKey` (YYYY-MM-DD). DST safe. */
export function zonedMidnight(dateKey: string, tz: string = STATION_TZ): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let ts = guess - tzOffsetMs(guess, tz);
  // Re-check once in case the offset changed between the guess and the answer.
  ts = guess - tzOffsetMs(ts, tz);
  return ts;
}

/** Calendar day after `dateKey`. */
export function nextDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

export function formatTime(ts: number, tz: string = STATION_TZ): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(new Date(ts));
}

export function formatDay(dateKey: string, style: "short" | "long" = "long"): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  // Noon UTC keeps the calendar date stable in any US time zone.
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: style,
    month: style === "long" ? "long" : undefined,
    day: style === "long" ? "numeric" : undefined,
  }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

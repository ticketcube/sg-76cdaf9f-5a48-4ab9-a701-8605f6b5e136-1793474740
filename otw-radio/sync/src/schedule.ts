import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config.js";

export interface DailySlot {
  start: string;
  end: string;
  block: "otw_playlist" | "weekly_feature" | "guest_curator";
  airing?: "premiere" | "repeat";
}

export interface Schedule {
  station: { name: string; shortcode: string; timezone: string };
  daily: DailySlot[];
  blocks: Record<string, { title: string; azuracast: Record<string, unknown> }>;
  features: Record<string, { slug: string; title: string; description: string; proposed?: boolean }>;
}

export interface EpisodeItem {
  aimcAssetId: string;
  title: string;
  artist: string;
  video?: boolean;
  /** Optional direct URL, used instead of asking AIMC for a download link. */
  sourceUrl?: string;
}

export interface EpisodeDay {
  date: string;
  feature?: { title: string; items: EpisodeItem[] };
  guestCurator?: { curator: string; items: EpisodeItem[] };
}

export async function loadSchedule(): Promise<Schedule> {
  const raw = await readFile(path.join(config.configDir, "schedule.json"), "utf8");
  return JSON.parse(raw) as Schedule;
}

export async function loadEpisodeDay(date: string): Promise<EpisodeDay> {
  const raw = await readFile(path.join(config.configDir, "episodes", `${date}.json`), "utf8");
  return JSON.parse(raw) as EpisodeDay;
}

/** "1000" -> 1000, the integer form AzuraCast schedule items use. */
export const hhmm = (value: string): number => Number(value);

/** ISO weekday, 1 = Monday ... 7 = Sunday, matching the keys in schedule.features. */
export function isoWeekday(date: string): number {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function slotsFor(schedule: Schedule, block: DailySlot["block"]): DailySlot[] {
  return schedule.daily.filter((slot) => slot.block === block);
}

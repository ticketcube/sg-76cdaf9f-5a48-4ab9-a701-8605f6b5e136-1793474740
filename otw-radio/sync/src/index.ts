import "dotenv/config";
import path from "node:path";
import { aimc } from "./aimc.js";
import { extractAudio } from "./audio.js";
import { azuracast, type PlaylistInput } from "./azuracast.js";
import { config } from "./config.js";
import {
  hhmm,
  isoWeekday,
  loadEpisodeDay,
  loadSchedule,
  slotsFor,
  type DailySlot,
  type EpisodeItem,
  type Schedule,
} from "./schedule.js";

const slug = (text: string) =>
  text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/** One-time: the always-on rotation that fills every hour with no scheduled block. */
async function setup(schedule: Schedule, dryRun: boolean) {
  const block = schedule.blocks.otw_playlist.azuracast as { playlist: string; order: PlaylistInput["order"] };
  const input: PlaylistInput = {
    name: block.playlist,
    type: "default",
    source: "songs",
    order: block.order,
    is_enabled: true,
    weight: 3,
    avoid_duplicates: true,
    schedule_items: [],
  };
  console.log(`setup: upsert playlist "${input.name}"`);
  if (!dryRun) await azuracast.upsertPlaylist(input);
}

/** Builds a dated playlist for one block, scheduled into every slot that block owns that day. */
async function syncBlock(opts: {
  schedule: Schedule;
  date: string;
  block: DailySlot["block"];
  label: string;
  items: EpisodeItem[];
  dryRun: boolean;
}) {
  const { schedule, date, block, label, items, dryRun } = opts;
  if (items.length === 0) {
    console.log(`${date} ${block}: no items, the OTW Playlist rotation will cover these hours`);
    return;
  }
  const blockConfig = schedule.blocks[block].azuracast as {
    playlistPrefix: string;
    order: PlaylistInput["order"];
    backendOptions: string[];
  };
  const playlistInput: PlaylistInput = {
    name: `${blockConfig.playlistPrefix} ${date} ${label}`,
    type: "default",
    source: "songs",
    order: blockConfig.order,
    is_enabled: true,
    include_in_requests: false,
    backend_options: blockConfig.backendOptions,
    schedule_items: slotsFor(schedule, block).map((slot) => ({
      start_time: hhmm(slot.start),
      end_time: hhmm(slot.end),
      start_date: date,
      end_date: date,
    })),
  };
  console.log(`${date} ${block}: playlist "${playlistInput.name}" in ${playlistInput.schedule_items!.length} slot(s)`);
  if (dryRun) {
    items.forEach((item, i) => console.log(`  ${i + 1}. ${item.artist} - ${item.title} (${item.aimcAssetId})`));
    return;
  }

  const playlist = await azuracast.upsertPlaylist(playlistInput);
  for (const [i, item] of items.entries()) {
    const fileName = `${String(i + 1).padStart(2, "0")}-${slug(`${item.artist} ${item.title}`)}.mp3`;
    const mediaPath = `${slug(blockConfig.playlistPrefix)}/${date}/${fileName}`;
    const sourceUrl = item.sourceUrl ?? (await aimc.getDownloadUrl(item.aimcAssetId));
    console.log(`  ${i + 1}. extracting ${item.aimcAssetId}`);
    const audio = await extractAudio(sourceUrl, path.join(config.workDir, mediaPath), item);
    const media = await azuracast.uploadFile(mediaPath, audio);
    await azuracast.updateFile(media.id, {
      title: item.title,
      artist: item.artist,
      playlists: [playlist.id],
      // The site reads these from now-playing to start the matching AIMC video in step.
      custom_fields: { aimc_asset_id: item.aimcAssetId, has_video: item.video ? "1" : "0" },
    });
  }
}

async function sync(schedule: Schedule, date: string, dryRun: boolean) {
  const day = await loadEpisodeDay(date);
  const feature = schedule.features[String(isoWeekday(date))];
  await syncBlock({
    schedule,
    date,
    block: "weekly_feature",
    label: day.feature?.title ?? feature?.title ?? "Feature",
    items: day.feature?.items ?? [],
    dryRun,
  });
  await syncBlock({
    schedule,
    date,
    block: "guest_curator",
    label: day.guestCurator?.curator ?? "Guest",
    items: day.guestCurator?.items ?? [],
    dryRun,
  });
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const dryRun = rest.includes("--dry-run");
  const schedule = await loadSchedule();
  if (command === "setup") return setup(schedule, dryRun);
  if (command === "sync") {
    const date = rest.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));
    if (!date) throw new Error("Usage: npm run sync -- sync YYYY-MM-DD [--dry-run]");
    return sync(schedule, date, dryRun);
  }
  console.log("Usage:\n  npm run sync -- setup [--dry-run]\n  npm run sync -- sync YYYY-MM-DD [--dry-run]");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

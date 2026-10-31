# Softgen build brief: OTW Radio site

Paste everything below the line into a new Softgen project. Upload `config/schedule.json` with it, or paste its contents where the brief says. When Softgen asks, connect the project to the GitHub repository for OTW Radio.

---

Build **OTW Radio**, the web player and schedule for a 24/7 internet radio station run by Ones To Watch (OTW), an emerging-artist brand. It will live at onestowatch.live and also be embedded on onestowatch.com.

## Stack

- Next.js (App Router) with TypeScript and Tailwind CSS.
- No database at launch. All data comes from the AzuraCast public API and from `config/schedule.json` in the repo.
- Environment variables: `NEXT_PUBLIC_AZURACAST_URL` (for example `https://radio.onestowatch.live`), `NEXT_PUBLIC_STATION_SHORTCODE` (`otw_radio`), and server-only `AIMC_API_URL` and `AIMC_API_KEY`.

## Data sources

1. **Now playing.** `GET {AZURACAST_URL}/api/nowplaying/{shortcode}`. Use `now_playing.song` (title, artist, art, `custom_fields`), `now_playing.elapsed`, `now_playing.duration`, `playing_next`, `song_history`, `listeners.current`, `live.is_live`, `live.streamer_name`, and `station.hls_url` and `station.mounts` for stream URLs. Poll every 15 seconds. A websocket upgrade can come later.
2. **Schedule.** Read `config/schedule.json`. It defines a daily grid (`daily`: start, end, block), block titles (`blocks`), and a feature per ISO weekday (`features`, 1 = Monday ... 7 = Sunday). Today's 10:00 and 15:00 blocks show that weekday's feature title. Times are in `station.timezone`. Show them in the listener's local time with the station time beside them.
3. **Video.** When `now_playing.song.custom_fields.has_video` is `"1"`, call a server route `/api/video?asset={custom_fields.aimc_asset_id}`. That route calls AIMC with the server-only key and returns a short-lived URL to the asset's MP4 proxy. Stub the AIMC call behind one function with a TODO, because the route is not confirmed yet.

## Pages

1. **Home `/`.**
   - A large now-playing card: album art, artist, title, a LIVE badge when `live.is_live` is true, otherwise the current block name, such as "OTW WEEKLY FEATURES: ARTIST INTERVIEW".
   - A play and pause button for the HLS stream (use hls.js, with a fallback to the MP3 mount). Add volume and a listener count.
   - **Watch mode.** When the current track has video, show a "Watch" toggle. It plays the AIMC proxy muted in a 16:9 frame, starting at `elapsed` seconds, while the radio audio keeps playing. Re-sync when drift is over 2 seconds, and allow a fixed offset for stream delay.
   - Up next, and the last 5 tracks.
   - Today's schedule as a list, with the current block highlighted.
2. **Schedule `/schedule`.** The daily grid and the weekly features, laid out like the station's promo graphic: black header bars with white condensed uppercase text, times on the left and block names on the right. Mark the Saturday and Sunday features "Coming soon" while `proposed` is true.
3. **Features `/features/[slug]`.** One page per weekly feature: title, description, airtimes (10am and 3pm on its day), and a list of recent episodes (placeholder data for now).
4. **Embed `/embed/player`.** A compact player (about 360 × 120) with no site chrome, for an iframe on onestowatch.com. It has the same stream, now playing and LIVE badge. Make it transparent-background friendly, and set headers so onestowatch.com may frame it.

## Persistent player

The audio must not stop when navigating between pages. Put the player in the root layout as a sticky bottom bar on every page except `/embed/player`.

## Design

- OTW style: black and white, with bold condensed uppercase headings (for example Oswald or Bebas Neue for headings, Inter for body), and full-bleed artist photo collages behind dark overlays.
- Mobile first. The player bar must work one-handed on a phone.
- Accessible: keyboard-operable player controls, labelled buttons, and visible focus.

## Quality bar

- Handle AzuraCast being unreachable: show "Reconnecting…" and keep retrying, never a blank page.
- No API keys in client code. Only `NEXT_PUBLIC_*` values reach the browser.
- Include a README section on environment variables and on deploying to Vercel.

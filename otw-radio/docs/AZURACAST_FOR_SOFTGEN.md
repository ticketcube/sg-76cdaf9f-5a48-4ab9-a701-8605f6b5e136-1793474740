# AzuraCast reference for the site (read before any AzuraCast work)

This is the short, OTW-specific version of the AzuraCast API docs (`/docs/developers/apis/` on any AzuraCast install). Check the full API reference at `{AZURACAST_URL}/docs/api/` if an endpoint here doesn't behave as described, because routes can shift between AzuraCast versions.

## The rule

AzuraCast makes the sound. The site shows it. If a feature touches audio files, playlists, rotation, scheduling of what plays, or the live signal, it is done in AzuraCast's admin, not in the site. Fans never see an AzuraCast page.

## What the site may call

| Need | Endpoint | Auth | Call from |
| --- | --- | --- | --- |
| Now playing, art, elapsed, live DJ, listeners, stream URLs | `GET /api/nowplaying/{station}` | none | Server route `/api/nowplaying` (cache 10s) |
| Same, cheaper, from cache | `GET /api/nowplaying_static/{station}.json` | none | Server route or browser |
| Real-time updates instead of polling (later) | Server-sent events at `/api/live/nowplaying/sse` | none | Browser |
| AzuraCast's own upcoming schedule (playlists and streamer slots) | `GET /api/station/{station}/schedule` | none | Server route. Our grid still comes from `schedule.json` |
| Station info and mounts | `GET /api/station/{station}` | none | Server route |
| Album art | URL in `now_playing.song.art` | none | Browser (`<img>`) |
| Play history beyond the last few tracks | `GET /api/station/{station}/history` | API key | Server only, staff pages later |
| Listener report | `GET /api/station/{station}/listeners` | API key | Server only, staff analytics later |

Useful now-playing fields: `now_playing.song.{title, artist, art, custom_fields}`, `now_playing.elapsed`, `now_playing.duration`, `song_history`, `listeners.current`, `live.is_live`, `live.streamer_name`, `station.hls_url`, `station.mounts`, `station.listen_url`. Our custom fields are `aimc_asset_id` and `has_video`.

Authenticated calls send the header `X-API-Key: {AZURACAST_API_KEY}` from a server route or the sync service. Never from the browser.

## What the site must not build

- **Next song titles.** `playing_next` exists in the API, but the licenses forbid advance song lists. Show the next programme block instead.
- **On-demand playback or podcasts** (`/ondemand`, public podcasts). Letting fans pick and replay tracks breaks the non-interactive radio license and the "live shows air once" rule. Leave them off in AzuraCast too.
- **Song requests** (`/requests`). Off at launch. They need a licensing check first.
- **Uploading, tagging or deleting media, or editing playlists.** That is AzuraCast's admin or the `otw-radio/sync` service.
- **Creating or showing DJ/streamer accounts or passwords.** Staff create these in AzuraCast. The site only reads `live.streamer_name`.
- **Embedding AzuraCast's public player page** (`/public/{station}`). Use our own player and `/embed/player`.
- **Restarting the station or changing its settings.**

## Done in AzuraCast admin, not in the site

Upload and tag tracks, build playlists and rotation rules, schedule the 10am premiere and 3pm repeat, set up HLS, create streamer accounts for hosts, run the live takeover (hosts connect with OBS or a broadcast app), and export play logs for SoundExchange.

## Optional hook back to the site

AzuraCast can call a web hook on song change. Later, point one at a site route to refresh the now-playing cache, instead of polling.

## Environment variables

Server only: `AZURACAST_URL`, `AZURACAST_API_KEY`, `AZURACAST_STATION_ID`, `AIMC_API_URL`, `AIMC_API_KEY`. Browser safe: `NEXT_PUBLIC_AZURACAST_URL`, `NEXT_PUBLIC_STATION_SHORTCODE=otw_radio`.

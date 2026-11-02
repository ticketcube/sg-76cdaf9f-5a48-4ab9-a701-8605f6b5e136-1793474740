# Softgen vs AzuraCast: who does what

**AzuraCast is the engine room** (it makes the sound). **The Softgen site (onestowatch.live) is the storefront and control panel** (it's what people see and touch). Rule of thumb: if it touches audio files or the live signal, it belongs in AzuraCast. If it's a page a human reads, it belongs in the site, which reads AzuraCast through server routes so keys stay out of the browser.

| Audience | AzuraCast | Softgen site |
| --- | --- | --- |
| OTW staff | Upload and tag tracks, playlists and rotation, schedule the 10am premiere and 3pm repeat, create host accounts, pull play logs for SoundExchange | Launch: edit JSON files in `otw-radio/config/`. Later: admin area on Supabase |
| DJs / hosts | Streamer account, going live through OBS or RTMP, live takeover of AutoDJ | Host profile pages and the "on air now" card. Later: host dashboard |
| Fans | Only the stream (Icecast/HLS) and now-playing API, behind the scenes. Never the AzuraCast UI | Everything: player, now playing, schedule, feature, host and artist pages, watch mode, embeds, ticket links. Later: accounts, points, subscriptions |

## Domains

- **radio.onestowatch.live**: AzuraCast (stream, now-playing API, admin). Staff and hosts only.
- **onestowatch.live**: this Softgen site. A password-protected staff dashboard, plus the `/embed/*` widgets and the API routes they use.
- **onestowatch.com**: where fans listen, through the embeds.

## Task board, in launch order

Each task is a file in `.softgen/tasks/`.

| # | Audience | Task | When |
| --- | --- | --- | --- |
| 6 | Fans | Fix now-playing, stream and schedule wiring | Launch, first |
| 8 | Fans | Embeds are the station on onestowatch.com | Launch |
| 15 | Staff | Station dashboard and lock the staff site | Launch |
| 7 | Fans | Now-playing card component and embed | Launch |
| 10 | DJs / hosts | Host profiles and on-air widget | Launch |
| 11 | Fans | Artist ticket links in the embeds | Launch |
| 9 | Fans, staff | Weekly feature widgets | Launch, if time |
| 3 | Fans | Watch mode and live video takeover (in the embeds) | When the AIMC route is confirmed |
| 12 | Staff | OTW staff admin | Later, needs Supabase |
| 13 | DJs / hosts | Host dashboard | Later, needs Supabase |
| 14 | Fans, staff | Fan accounts, points, subscriptions and analytics | Later, needs Supabase |

Tasks 1, 2, 4 and 5 are already done. Task 6 exists because task 1's player points its now-playing fetch at the MP3 stream, and `/api/schedule` reads a `config/schedule.json` that isn't at the repo root.

## Guardrails for every task

Softgen should read `docs/AZURACAST_FOR_SOFTGEN.md` before any AzuraCast work.


- No AzuraCast, AIMC or Supabase keys in client code. Only `NEXT_PUBLIC_*` values reach the browser.
- Never show the next song title. The licenses forbid advance song lists; show the next programme block instead.
- Live venue shows air once. No replay unless the artist opts in.
- No stream passwords or AzuraCast logins anywhere in the site.

## What to paste into Softgen

Paste these one at a time, waiting for each to finish:

1. `Read otw-radio/docs/AZURACAST_FOR_SOFTGEN.md, then do task 6 on the board (.softgen/tasks/task-6.md). Follow its checklist exactly and mark it done when the acceptance passes.`
2. `Do task 8 (.softgen/tasks/task-8.md).`
3. `Do task 15 (.softgen/tasks/task-15.md). I will set STAFF_PASSWORD in the environment.`
4. `Do task 7 (.softgen/tasks/task-7.md). Never show the next song title.`
5. `Do task 10 (.softgen/tasks/task-10.md). Create otw-radio/config/hosts.json with two placeholder hosts and one guest curator.`
6. `Do task 11 (.softgen/tasks/task-11.md). Create otw-radio/config/artists.json with five placeholder OTW artists.`
7. `Do task 9 (.softgen/tasks/task-9.md). Create otw-radio/config/features.json with placeholder copy for all seven features.`
8. `Do task 3 (.softgen/tasks/task-3.md). Keep the AIMC call stubbed.`

Don't start tasks 12 to 14 until a Supabase project is chosen for the site.

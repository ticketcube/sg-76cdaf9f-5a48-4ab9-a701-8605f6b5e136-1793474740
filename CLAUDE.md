# LiveNation.Live: project brief for Claude

Read this first. It is the business context; `docs/AI_AGENT_GUIDE.md` is the code guide.

LiveNation.Live is a hybrid video and audio internet radio channel for Live Nation. Its MVP is **OTW Radio on onestowatch.live**, run with Ones To Watch (OTW), the emerging-artist brand. The radio is audio first, with video when it earns it. The paid live-venue channel (earlier working name LiveNation.tv) is the scale case it grows into.

Owner: Alan (Fabrakovs), Working Bear Productions. Decks carry the Bear logo top right.

## The idea in one paragraph

Every Live Nation room can go on air, live, like radio. A fixed camera and mic per room, run by AIMC automation, captures each show with no crew. The artist chooses VIDEO or AUDIO. Fans pay for the live moment through subscriptions, sponsors, bar licenses and ticket sales. The artist keeps the recording to monetize elsewhere. Between live shows, a 24/7 audio station (OTW Radio) carries the OTW Playlist, weekly features, guest curators and interviews, pulled from AIMC.

## Rules that hold everywhere

1. **Live shows are live only.** A venue broadcast airs once, as it happens. The channel never rebroadcasts it unless the artist opts in. Recordings go to the artist.
2. **Recorded premieres are allowed.** Features stored in AIMC air at a fixed time as if live, with no skipping. The 10am feature repeats at 3pm. This is not a rebroadcast of a live show.
3. **Forward-looking figures are illustrative.** Label them that way on every slide and doc. Planning costs are estimates, not quotes.
4. **Licensing is the critical path.** No public stream before the SoundExchange Notice of Use and ASCAP, BMI, SESAC and GMR licenses. US listeners only at launch. Statutory play limits: in any 3 hours, no more than 3 songs from one album or 4 by one artist. No advance song lists. Live shows need artist consent (broadcast addendum in OTW offers). Video needs direct sync and master rights.
5. **Use phase lengths, not calendar dates,** in decks for Product. The radio plan's dates (soft launch 11 Jan 2027, public launch 27 Jan 2027) are planning targets.
6. **Keys never go in the browser or the repo.** AIMC, AzuraCast and Supabase keys stay server-side in environment variables.

## Key numbers

**LiveNation.tv scale case** (2,000 rooms, 100 shows per room per year, 120,000 broadcasts, illustrative):
- Revenue about $168M: subscriptions $120M (All-access $9.99, Audio $4.99), sponsors $30M, 5,000 bars at $299 a month $18M.
- Profit is $60.1M on a flat 30% revenue share, or $45M under the waterfall deal.
- Waterfall: LN funds capture, recoups 75/25, then 50/50. The venue gets 20% of LN's half. Artists reinvest 10%, matched 1:1 by LN. An average show takes about $1,150 in receipts, of which the artist gets $390 (34%).
- Breakeven is about 1.8x live viewers per paid attendee, around 1,200 viewers a show. The scale case is 5.7x.
- Free-only case: sponsors and ads must cover about $54M, which is roughly a $19 CPM at 4 spots an hour on 13M monthly fans.

**onestowatch.live commerce** (AI Growth Agent page, Sep 28 to Oct 27, 2026):
- 18,760 clicks, 63 orders (0.34%), $195 average order, $12.3K in tickets, $147 commission (about 1.2%).
- Clicks grew 2.3x from September to October.
- At 13M fans and 1 click per fan a month, that is about $102M in tickets a year. LN keeps an assumed 15% (unmeasured), about $15M.

**OTW.live pilot:**
- 25 real OTW roster shows in 17 HOB, Fillmore, Irving Plaza and Wiltern rooms. Budget $565K.
- Phases:
  - Soft launch: 4 to 6 weeks, 10 shows, 8 rooms.
  - Build: 6 to 8 weeks.
  - Paid pilot: 6 to 8 weeks, 15 shows, 12 rooms.
  - Readout: 4 weeks.

**OTW Radio:**
- About $90K to $160K one-time, and $650K to $1M a year before recording royalties.
- About 6 FTE.
- SoundExchange royalties come to about $26K a year per 100 average listeners.

## OTW Radio programming grid (ET)

| Time | Block | Source |
| --- | --- | --- |
| Midnight to 10am | OTW Playlist | AzuraCast rotation |
| 10am to noon | Weekly Feature premiere | AIMC |
| Noon to 3pm | Guest Curator Playlist | Guest artist picks and intros |
| 3pm to 5pm | Weekly Feature repeat | Same episode |
| 5pm to midnight | OTW Playlist (live venue shows can take over) | AzuraCast |

Weekly features:
- Mon: Weekly Recap
- Tue: Chef's Choice
- Wed: Touring Artists
- Thu: GWLMMWLG
- Fri: Artist Interview
- Sat: Live From the Rooftop (proposed)
- Sun: Best of the Week (proposed)

The grid's source of truth is `otw-radio/config/schedule.json`.

## Tech stack

- **Playout:** AzuraCast, self-hosted with Docker. It provides Icecast/HLS streams, scheduling, live DJ input, play logs for royalties, and the now-playing API.
- **AIMC:** the OTW media lake on S3, with about 2,149 assets. Assets carry the tags `Artist`, `Series`, `Format` and `Artist Spotify ID`, plus MP4 proxies and thumbnails. It is the show warehouse for radio and the capture system for venues.
- **Extraction worker** (`worker/`) now does the AIMC-to-AzuraCast audio work from a job queue. The original **sync service** (`otw-radio/sync`, TypeScript, Node 20 and ffmpeg):
  1. Reads AIMC.
  2. Extracts loudness-normalized MP3s.
  3. Uploads them to AzuraCast with the custom fields `aimc_asset_id` and `has_video`.
  4. Builds dated playlists.
  - The AIMC REST routes in `sync/src/aimc.ts` are placeholders until the AIMC team confirms them.
- **Site:** onestowatch.live, a Next.js app built in Softgen, backed by Supabase (auth, playlists, schedule, extraction jobs) with an admin panel for DJs and playlists.
  - Sticky player, schedule, feature pages, and an `/embed/player` page for onestowatch.com.
  - Watch mode plays the AIMC MP4 proxy muted, in step with the audio. It starts at `elapsed` and re-syncs when drift is over 2 seconds.
  - Video URLs come from the server route `/api/video`.
- **Later:** Mux or AWS IVS for real video streams, plus TuneIn, smart speakers and an ad vendor.

## This repository

This is the Softgen-managed repo for the OTW Radio site and its services. Softgen commits here too (author `softgenai`), so pull before you work, keep commits small, and expect Softgen commits between yours. For the codebase itself (architecture, conventions, phases), read `docs/AI_AGENT_GUIDE.md` first.

| Path | What it is |
| --- | --- |
| `src/` | Next.js 15 site (pages router, TypeScript, Tailwind, shadcn/ui), always dark |
| `src/pages/api/` | Server routes: `aimc/` (assets, presigned download and upload), `extraction/`, `worker/`, `playlists/`, `admin/` (users, live DJs), `now-playing`, `schedule` |
| `src/integrations/supabase/` | Supabase client and generated types |
| `supabase/migrations/` | Schema: playlists, playlist_tracks, schedule_slots, extraction_jobs |
| `worker/` | Docker worker that extracts audio from AIMC video and delivers it to AIMC and AzuraCast over SFTP |
| `deploy/` | Linode setup, nginx for the radio, worker deploy, self-hosted Supabase compose |
| `otw-radio/` | Original station kit: `config/schedule.json`, sync service, docs, `SOFTGEN_PROMPT.md` |
| `.softgen/` | Softgen's task board |

The package name is still `softgen-firebase-starter`, but the backend is Supabase. Hosting is Vercel for the site, with Linode for AzuraCast and the worker.

Environment variables used in code (values live in Vercel, the worker host or the Claude cloud environment, never in the repo):
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only)
- AzuraCast: `AZURACAST_URL`, `AZURACAST_API_KEY`, `AZURACAST_STATION_ID`, `NEXT_PUBLIC_AZURACAST_URL`, `NEXT_PUBLIC_STREAM_URL`
- AIMC: `AIMC_API_URL`, `AIMC_API_KEY`, `AIMC_UPLOAD_CONNECTOR_ID`, `AIMC_UPLOAD_FOLDER` (server only)
- Worker: `WORKER_TOKEN`, `APP_URL`, `RADIO_FOLDER`, `SFTP_HOST`, `SFTP_PORT`, `SFTP_USER`, `SFTP_PRIVATE_KEY_PATH`

## Supabase

The Supabase connector reaches the ticketcube org: `ticketcube` and `otwchart` are active; `ticketcube's Project`, `YourWay`, `4points` and `5up` are paused. Confirm which project `NEXT_PUBLIC_SUPABASE_URL` points to before running SQL or migrations, and change schema only through `supabase/migrations/`.

## Source documents (claude.ai)

- OTW Radio launch plan (doc): https://claude.ai/artifact/WQu7WpDM3th4xuBZ43wJWP
- OTW.live MVP for Product (deck): https://claude.ai/artifact/BK1F8awLjvcCEQLMZBZ23N
- OTW.live pilot plan for LiveNation.tv (doc): https://claude.ai/artifact/GSvkswX1XznxzEGLqQwoPn
- LiveNation.tv Strategy: https://claude.ai/artifact/5tKZyb9ADnpReHHpykAiSy
- LiveNation.tv insights from 2013 venue data: https://claude.ai/artifact/JNqinmHLGVZ5n9aUS9c1hq

Files in the LiveNation.tv project folder:
- `livenation-tv/`:
  - `strategy-summary-for-modeling.md` (source of truth)
  - `livenation-tv-otw-pilot-model.xlsx`
  - the PowerPoint decks (white, letter and Bear-branded)
- `otw-radio/`

## Open decisions

- Which entity holds the licenses: Live Nation, OTW or a new station entity?
- US-only at launch (recommended)?
- Ad-supported, or one presenting sponsor?
- Bar fee split: the model assumes 30%, the deal says 60% to artists and venues, a difference of about $5.4M a year.
- Formats for Chef's Choice and GWLMMWLG, and who picks guest curators and hosts.
- Weekend features.
- Recording rights language for OTW offers.
- AIMC route confirmation and a `Radio Cleared` tag.
- The LN take rate on driven ticket sales (15% is assumed).

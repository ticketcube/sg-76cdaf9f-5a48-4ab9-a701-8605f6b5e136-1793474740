# OTW Radio

24/7 internet radio for [Ones To Watch](https://onestowatch.live): the OTW Playlist rotation, daily weekly features, guest curator hours, artist interviews and occasional live shows, with video when the artist wants it.

Built on [AzuraCast](https://www.azuracast.com) (open source, self-hosted). Recorded shows live in **AIMC**, the OTW media lake, and air as scheduled premieres: pre-recorded, played at a fixed time, experienced as live.

## How it fits together

```
AIMC media lake ──(sync)──> AzuraCast ──> audio stream (Icecast/HLS) ──> onestowatch.live player
   │  recorded shows,          playout,                                  │  embeds on onestowatch.com
   │  interviews, sessions     schedule,                                 │
   │                           live DJ input                             │
   └──── MP4 proxy (presigned, server-side) ─────────────────────────────> video in step with the audio
```

1. Producers list the AIMC assets for each day in `config/episodes/YYYY-MM-DD.json`.
2. The **sync service** (`sync/`) fetches each asset from AIMC, extracts broadcast audio with ffmpeg, uploads it to AzuraCast, and builds a dated playlist scheduled into that block's slots from `config/schedule.json`.
3. **AzuraCast** plays the OTW Playlist rotation around the clock and switches to the dated playlists at 10am, noon and 3pm.
4. The **site** (built in Softgen, see `SOFTGEN_PROMPT.md`) plays the stream, shows now playing and the schedule, and when the current track has `has_video = 1` it plays the AIMC video proxy from the same point in the show.

## Programming

| Time (ET) | Block |
| --- | --- |
| Midnight to 10am | OTW Playlist |
| 10am to noon | OTW Weekly Feature (premiere) |
| Noon to 3pm | Guest Curator Playlist |
| 3pm to 5pm | OTW Weekly Feature (repeat) |
| 5pm to midnight | OTW Playlist |

Weekly features: Monday OTW Weekly Recap, Tuesday Chef's Choice, Wednesday OTW Touring Artists, Thursday GWLMMWLG, Friday Artist Interview. Weekend features are proposals. Full detail in [docs/PROGRAMMING.md](docs/PROGRAMMING.md).

## Repository layout

| Path | What it is |
| --- | --- |
| `config/schedule.json` | The grid. Single source of truth for the sync service and the site |
| `config/episodes/` | One file per air date listing the AIMC assets to premiere |
| `sync/` | TypeScript service: AIMC to AzuraCast |
| `docs/AZURACAST_SETUP.md` | Server, station, playlists, custom fields, embeds |
| `docs/AIMC_INTEGRATION.md` | Data contract, premiere logic, video sync |
| `docs/PROGRAMMING.md` | Grid and feature formats |
| `SOFTGEN_PROMPT.md` | Paste-ready brief for building the site in Softgen |

## Quick start

```bash
# 1. Stand up AzuraCast on a server (see docs/AZURACAST_SETUP.md), create the station
#    and an API key, then:
cp .env.example .env    # fill in AZURACAST_* and AIMC_*

# 2. Sync service (needs Node 20+ and ffmpeg)
cd sync
npm install
set -a; source ../.env; set +a
npm run sync -- setup --dry-run              # preview
npm run sync -- setup                        # creates the OTW Playlist rotation
npm run sync -- sync 2026-11-02 --dry-run    # preview a day
npm run sync -- sync 2026-11-02              # load and schedule it
```

Run `sync` for each air date a day or more ahead, by hand or from a nightly cron.

## Status

- [x] Grid and feature config
- [x] Sync service: AzuraCast playlists, uploads, scheduling, custom fields (typechecked, dry-run tested)
- [x] AIMC routes in `sync/src/aimc.ts` (Media Lake API, `X-API-Key` auth). Needs `AIMC_API_URL` and an API key in `.env`
- [ ] Site: build from `SOFTGEN_PROMPT.md`
- [ ] Licensing: SoundExchange Notice of Use and PRO licenses before the first public stream

## License

MIT for the code in this repository (change before publishing if Live Nation needs a different license). AzuraCast itself is Apache 2.0. Media in AIMC is not part of this repository and is not open source.

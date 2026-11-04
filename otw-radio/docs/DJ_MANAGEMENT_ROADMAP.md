# DJ management roadmap

How OTW staff run DJs, hosts and guest curators from the staff site (onestowatch.live) without anyone outside staff ever logging in to AzuraCast (radio.onestowatch.live).

Phases use lengths, not dates. Lengths are planning estimates.

## The idea

AzuraCast stays the engine. The staff site becomes the only door for DJs. Staff (and later the DJs themselves) work in the site, and the site's server routes call the AzuraCast API with a restricted key to create streamer accounts, put slots on the AzuraCast schedule, rotate passwords and load pre-recorded sets.

A DJ only ever gets two things from us:

1. **A slot**, booked and approved in the site.
2. **Encoder credentials for that slot** (server, port, mount, username, password) to type into OBS, Mixxx, BUTT or a broadcast app. These are a streamer login, not an AzuraCast login. They cannot open the AzuraCast admin, and with "enforce schedule" on they only work during the booked slot.

```
DJ (browser) ──► onestowatch.live (pages)
                     │
                     ▼
             server routes (/api/dj/*, /api/staff/dj/*)
                     │  X-API-Key (server env only)
                     ▼
             radio.onestowatch.live (AzuraCast API)
                     ▲
DJ encoder (OBS etc.) ── slot credentials, live only during the slot
```

## Rules this must keep

- **Keys stay server-side.** `AZURACAST_API_KEY` and any Supabase service key live in server environment variables. Nothing reaches the browser except `NEXT_PUBLIC_*` values.
- **No AzuraCast logins for DJs.** Only per-DJ streamer credentials, shown once, scoped to a slot.
- **No advance song lists.** The site never publishes a DJ's tracklist before or during the set. DJs must not pre-announce specific songs at specific times. Tracklists are collected for royalties only, and shown publicly (if ever) after air.
- **Statutory play limits.** In any 3 hours, no more than 3 songs from one album or 4 by one artist. Pre-recorded sets are checked before approval. Live DJs agree to the rule and their tracklists are checked after air.
- **Live shows are live only.** A live venue show, or a live DJ set, airs once. Live recordings are off by default, and any recording goes to the artist or DJ, not into rotation.
- **Recorded premieres are allowed.** An approved pre-recorded set airs at its fixed time as if live, with no skipping, and may repeat only where the grid says so (like the 10am feature repeating at 3pm).
- **Licensing first.** DJ sets only air after the station licenses are in place and the DJ has signed the DJ agreement. Live venue shows need the artist's broadcast consent.
- **US listeners only at launch**, same as the rest of the station.

## What changes in the current docs

`AZURACAST_FOR_SOFTGEN.md` (PR #2) currently says the site must not create or show streamer accounts. This roadmap reverses that in one narrow way: from Phase 1, **named server routes** may create, schedule, rotate and disable streamers through a restricted API key. The site still never shows an AzuraCast admin login, never stores a streamer password, and never edits playlists or rotation outside the routes listed here. Phase 0 updates that doc and task 13 to match.

## How DJ schedules work in the AzuraCast API

Checked against AzuraCast's published OpenAPI spec (v0.24). Confirm on our install at `https://radio.onestowatch.live/docs/api/` before building, because routes can shift between versions.

**A DJ's slots live on their streamer account.** Each streamer (`/api/station/{id}/streamers`) has `streamer_username`, `streamer_password`, `display_name`, `comments`, `is_active`, `enforce_schedule`, `reactivate_at` and a list of `schedule_items`. Each schedule item has `start_time` and `end_time` as 24-hour numbers (`1700` is 5pm), `days` (1 is Monday, 7 is Sunday) and `loop_once`. AzuraCast's schedule editor also takes an optional start and end date per item, which is how a one-off slot is booked; the published spec leaves those two fields out, so test them on our install. Times are read in the **station's time zone**.

**Endpoints the site uses for schedules:**

| Need | Endpoint | Auth |
| --- | --- | --- |
| All DJs and their slots | `GET /api/station/{id}/streamers` | Key with "manage station streamers" |
| Create, edit, book, disable a DJ, change password | `POST /api/station/{id}/streamers`, `PUT` or `DELETE /api/station/{id}/streamer/{sid}` | Same |
| DJ slots as calendar events (streamer id, username, start, end, art) | `GET /api/station/{id}/streamers/schedule` | Same. The spec lists no date range; AzuraCast's own calendar passes `start` and `end`, so test those |
| Upcoming playlists and DJ slots together, for public pages | `GET /api/station/{id}/schedule?rows=N` | None. Already used by the unified schedule (PR #3) |
| Who is live now and since when | `GET /api/nowplaying/{id}` (`live.is_live`, `live.streamer_name`, `live.broadcast_start`) | None |
| Go-live and drop-off events | Web hooks with triggers `live_connect` and `live_disconnect` | Set up in AzuraCast |
| Cut a DJ off air | `POST /api/station/{id}/backend/disconnect` | Key with "manage station broadcasting" |
| Royalty report for a date range | `GET /api/station/{id}/reports/soundexchange?start_date=&end_date=` | Key with "view station reports" |

**"Where" to broadcast is fixed per station, not per DJ.** Every DJ connects to the same place: host `radio.onestowatch.live`, the station's DJ port (`dj_port`), and the DJ mount point (`dj_mount_point`), with their own username and password, as an Icecast or Shoutcast source. AzuraCast's admin shows these under Streamers/DJs as connection info. Reading them through the API needs admin rights, so copy them once into server env vars (`AZURACAST_DJ_HOST`, `AZURACAST_DJ_PORT`, `AZURACAST_DJ_MOUNT`) instead of giving the site an admin key.

**Passwords can't be read back.** AzuraCast stores them hashed, so the site can only set a new one. That is why this plan shows a password once and changes it whenever it's shown again.

**Time zone.** The station is currently set to `America/Los_Angeles`, but the grid in `schedule.json` is Eastern. A slot booked as `1700` would start at 5pm Pacific, which is 8pm Eastern. Set the station to `America/New_York` in Phase 0, before anyone books a slot.

## Phase 0: AzuraCast and decisions (about 1 week)

Mostly AzuraCast admin work by staff, plus decisions. No site code.

- [ ] **Change the station's time zone to `America/New_York`** (Edit Profile in AzuraCast) so slot times match the Eastern grid.
- [ ] In AzuraCast, create a role **`otw-site-bot`** scoped to the OTW station with only: "manage station streamers", "view station reports", and (for Phase 3) "manage station media" and "manage station automation". No global permissions, and not "manage station broadcasting".
- [ ] Create a user for that role and an API key on it. Put the key in the site's server env as `AZURACAST_API_KEY` (replacing any admin key). An AzuraCast API key has exactly its user's permissions, so a leaked key cannot touch other stations or settings.
- [ ] Create a second user and role with only "manage station broadcasting", and put its key in `AZURACAST_BROADCAST_KEY`. Only the "cut live feed" route uses it, because that permission can also stop and restart the station.
- [ ] Copy the DJ connection info (host, DJ port, DJ mount point) from AzuraCast into `AZURACAST_DJ_HOST`, `AZURACAST_DJ_PORT` and `AZURACAST_DJ_MOUNT`.
- [ ] Station settings: streamers/DJs on, live broadcast recording off by default, on-demand and requests off (already the plan).
- [ ] Add AzuraCast web hooks for "live DJ connected" and "live DJ disconnected" pointing at a site route (built in Phase 1) with a shared secret.
- [ ] Decide the Supabase project for DJ accounts (see "Supabase" below). Phase 1 does not need it. Phases 2 onward do.
- [ ] Draft the DJ agreement: license compliance, play limits, no pre-announcing songs, no unreleased or uncleared tracks without written clearance, recordings policy, conduct, payment (if any).
- [ ] Update `AZURACAST_FOR_SOFTGEN.md` and task 13 to match this roadmap.

**Done when** the station runs on Eastern time, the site has its restricted keys and DJ connection info, and the DJ agreement exists in draft.

## Phase 1: Staff DJ desk, no database (2 to 3 weeks)

Staff manage DJs from onestowatch.live behind the existing `STAFF_PASSWORD` lock (task 15). DJs get no login yet, but each one gets a private schedule link. AzuraCast itself stores the DJs and their slots, so no database is needed.

Staff pages:

- `/djs`: list of DJs, read from `GET /api/station/{id}/streamers` and joined to `otw-radio/config/hosts.json` (task 10) by `azuracast_streamer`. Shows active or disabled, next slot, and who is live now.
- `/djs/new`: create a DJ. Server creates the streamer with a random password and `enforce_schedule: true`.
- `/djs/[slug]`: book slots (adds `schedule_items` on the streamer), cancel slots, disable the DJ, **rotate credentials**, and **cut the live feed** (disconnect the current streamer).
- `/djs/schedule`: a week calendar of every DJ slot (`streamers/schedule`) laid over the grid from `schedule.json`, all in Eastern time.

Booking checks, run on the server before any write to AzuraCast:

- The slot doesn't overlap another DJ's slot.
- The slot doesn't land on the 10am to noon premiere or the 3pm to 5pm repeat, unless staff override it.
- One-off slots carry a start and end date, so they don't repeat every week by accident.

DJ schedule link (what DJs see, with no login):

- Staff send each DJ a private link, `/dj/s/[token]`. The token is signed with a server secret, names one streamer and expires (for example after 90 days). Staff can revoke it by rotating the secret for that DJ.
- The page answers **when**: the DJ's upcoming slots, in Eastern time and in the DJ's own time zone (from their browser), with a countdown to the next one and which programme block it sits in.
- It answers **where**: host, port, mount point, username and source type, with copy buttons and an OBS or BUTT settings card (format and bitrate). It also says that the encoder only connects during the slot.
- The password is not on the page. A "Get my password" button changes it and shows the new one once, and only from 30 minutes before a slot until the slot ends.
- A calendar feed, `/dj/s/[token]/calendar.ics`, so slots show up in Google Calendar, Apple Calendar or Outlook and update when staff move them. The feed holds times and the block name only, never connection details.
- Nothing on the page or the feed lists songs.

Credentials:

- The server generates the password, sets it on the streamer, and shows it **once** to staff on a "send to DJ" screen with copy-paste OBS settings (server, port, mount, username). It is never saved by the site.
- Optional: instead of staff pasting it, the server makes a one-time link (`/dj/credentials/[token]`), where the token is encrypted with a server secret, expires after 24 hours, and holds the streamer id. Opening it **rotates** the password and shows the new one. Opening it twice just rotates again, so a forwarded link stops working the moment the DJ uses theirs.
- After each slot, staff can rotate again. With enforce schedule on, a leaked password only works inside a booked slot anyway.

Monitoring:

- `/api/hooks/azuracast` receives the connect and disconnect web hooks, verifies the secret, and refreshes the "on air now" card (task 10) right away.
- Dashboard panel: who is on air, slot start and end, listener count during the slot.
- **Missed slot alert**: if a slot has started and no `live_connect` has arrived within 5 minutes, the dashboard flags it. AutoDJ keeps playing the OTW Playlist, so the station never goes silent.

Server routes (all server-side):

| Route | Who | Calls in AzuraCast |
| --- | --- | --- |
| `GET /api/staff/dj` | Staff | `GET /api/station/{id}/streamers` |
| `POST /api/staff/dj` | Staff | `POST /api/station/{id}/streamers` |
| `PATCH /api/staff/dj/[id]` (slots, active, display name) | Staff | `PUT /api/station/{id}/streamer/{sid}` |
| `POST /api/staff/dj/[id]/rotate` | Staff | `PUT .../streamer/{sid}` with a new password |
| `GET /api/staff/dj/schedule` | Staff | `GET /api/station/{id}/streamers/schedule` |
| `POST /api/staff/dj/disconnect` | Staff | `POST /api/station/{id}/backend/disconnect` with `AZURACAST_BROADCAST_KEY` |
| `GET /api/dj/[token]` | DJ link | `GET /api/station/{id}/streamer/{sid}`, returns slots only |
| `POST /api/dj/[token]/password` | DJ link | `PUT .../streamer/{sid}` with a new password, only near a slot |
| `GET /dj/s/[token]/calendar.ics` | DJ link | Same data as `GET /api/dj/[token]` |
| `POST /api/hooks/azuracast` | AzuraCast | none, receives web hooks |

Cache the schedule reads for about 60 seconds. The DJ routes must never return the password field, the API key or another DJ's data.

**Done when** staff can add a DJ, book a slot and send the link, and the DJ can see when and where to broadcast, add it to their calendar, get their password at slot time and go live, all without anyone opening AzuraCast.

## Phase 2: DJ portal and approvals (needs Supabase, 4 to 6 weeks)

DJs get their own sign-in on the staff site, at a separate area (`/dj/*`) that the `STAFF_PASSWORD` middleware lets through to Supabase Auth instead.

Onboarding:

- [ ] Invite only. Staff invite by email; the DJ signs in with a magic link.
- [ ] Profile: display name, bio, photo, socials, role (`dj`, `host`, `guest_curator`). Staff approve profile changes before they show on onestowatch.com.
- [ ] Sign the DJ agreement in the portal (name, date, version stored).
- [ ] US location and tax or payment details only if DJs are paid (open decision).

Booking:

- [ ] Staff publish **open slots** that fit the grid in `schedule.json` (for example, live takeovers in the 5pm to midnight OTW Playlist block, or a guest curator's Noon to 3pm slot).
- [ ] A DJ requests a slot. Staff approve or decline in `/djs/requests`.
- [ ] On approval, the server adds the slot to the DJ's AzuraCast streamer (Phase 1 routes). The unified schedule (PR #3) then shows it automatically, because it already reads streamer slots from AzuraCast.
- [ ] Cancel and swap rules: a DJ can cancel up to a cutoff staff set; after that only staff can.

Go-live screen:

- [ ] The Phase 1 DJ schedule page (when, where, calendar feed) moves behind sign-in, so the private link is no longer needed.
- [ ] The password is revealed only from a short window before the slot (for example 30 minutes), by **rotating** it at reveal time. The site never stores it.
- [ ] After the slot, the server rotates the password again and the DJ's encoder stops working.
- [ ] A "test your setup" step: a private test mount or a scheduled practice slot outside air time, if AzuraCast is set up for it.

This replaces task 13 (host dashboard).

**Done when** a DJ can sign in, sign the agreement, request a slot, get approved, and go live, with no staff help beyond the approval.

## Phase 3: Pre-recorded sets (3 to 4 weeks)

For guest curators and DJs who can't be live. Uses the existing `otw-radio/sync` pipeline.

- [ ] Upload in the portal: the DJ uploads a WAV or MP3 to storage through a signed upload URL (Supabase Storage or the S3 bucket next to AIMC). Files never pass through AzuraCast's admin.
- [ ] A tracklist is **required** with every upload: artist, title, album, label, ISRC if known, start time in the set.
- [ ] Automatic checks on the server:
  - Length fits the booked slot.
  - Statutory play limits on the tracklist, plus the 3 hours around the slot when the grid is known.
  - Loudness normalized with the same ffmpeg settings as the sync service.
- [ ] Staff review: listen, check the tracklist, approve or send back with a note.
- [ ] On approval, the server uploads the file to AzuraCast media and creates a one-off scheduled playlist for that slot (or the sync service does it, so all AzuraCast writes stay in one place). It airs at its fixed time like a premiere. No skipping, and no on-demand copy.
- [ ] Repeats only where the grid allows. The file is removed from AzuraCast after its last scheduled airing.
- [ ] Optional: approved sets also go into AIMC with `Series: DJ Set` so they live with the rest of the OTW archive.

**Done when** a curator can upload a set and tracklist, staff approve it, and it airs at its slot without anyone touching AzuraCast.

## Phase 4: Play logs, royalties and DJ stats (2 to 3 weeks)

- [ ] Live set tracklists: after each live slot the DJ must submit their tracklist in the portal within a set time. Staff get a reminder when it's late.
- [ ] Reconciliation: match each slot's tracklist to the AzuraCast history for that time (`GET /api/station/{id}/history`, server-side) and to listener counts, so SoundExchange reports cover live sets as well as AutoDJ.
- [ ] Flag play-limit breaches after air and show them to staff.
- [ ] Monthly export that merges AzuraCast's SoundExchange report (`GET /api/station/{id}/reports/soundexchange`) with DJ tracklists for live sets, for SoundExchange and the PROs. AzuraCast only knows the songs in a live set if the DJ's encoder sends track titles, so the tracklist fills the gap.
- [ ] DJ stats in the portal: average and peak listeners for their slots. Never other DJs' numbers.
- [ ] Tracklists can be shown publicly on a DJ's page **after** the set has aired, if staff want that.

**Done when** the monthly royalty export includes every live and pre-recorded DJ set.

## Later

- Video DJ sets through Mux or AWS IVS, with the same slot and credential model.
- Guest curator picks: a curator chooses tracks from the cleared library in the portal (search AzuraCast media or AIMC with a `Radio Cleared` tag) and records voice intros, instead of uploading a mixed set.
- DJ payments, if the program pays.
- Live venue show takeovers using the same slot model, gated on the artist's broadcast consent in the OTW offer.

## Supabase

Phase 1 needs no database. AzuraCast holds DJs and slots, and `hosts.json` holds profiles.

From Phase 2, DJ accounts need **a Supabase project that hasn't been chosen yet**. Pick or create a dedicated project before starting Phase 2 (the active `ticketcube` and `otwchart` projects belong to other work). Suggested tables:

| Table | Holds |
| --- | --- |
| `djs` | user id, slug, display name, role, bio, photo, socials, `azuracast_streamer_id`, status |
| `agreements` | dj id, agreement version, signed at |
| `slots` | start, end, block, status (open, requested, approved, cancelled, aired), dj id |
| `sets` | slot id, storage path, duration, loudness, review status, reviewer note |
| `tracklists` | slot id, rows of artist, title, album, label, ISRC, offset |
| `audit_log` | who did what, when (bookings, approvals, rotations, disconnects) |

Use row-level security so a DJ only ever sees their own rows. Never store a streamer password in any table.

## Softgen tasks

Each line becomes a `.softgen/tasks/task-N.md` file once PR #2 is merged, numbered after task 15. Paste them one at a time.

| # | Phase | Task | Needs |
| --- | --- | --- | --- |
| 16 | 0 | Update `AZURACAST_FOR_SOFTGEN.md` and task 13 for server-side streamer management | PR #2 |
| 17 | 1 | Staff DJ list and create DJ (`/djs`, `/djs/new`, `GET/POST /api/staff/dj`) | Task 15, restricted key |
| 18 | 1 | Book and cancel slots with booking checks, disable DJ, staff DJ calendar (`/djs/schedule`) | 17 |
| 19 | 1 | DJ schedule link: when and where, calendar feed, password at slot time | 18 |
| 20 | 1 | AzuraCast web hook route, live card refresh, missed slot alert, cut live feed | 17, task 10 |
| 21 | 2 | DJ sign-in, profile and agreement (`/dj/*`) | Supabase |
| 22 | 2 | Open slots, requests and staff approvals | 21 |
| 23 | 2 | Move the DJ schedule page behind sign-in | 22 |
| 24 | 3 | Pre-recorded set upload, tracklist and automatic checks | 21, storage |
| 25 | 3 | Staff set review and push to AzuraCast | 24 |
| 26 | 4 | Tracklist submission, reconciliation and royalty export | 22 |
| 27 | 4 | DJ stats | 26 |

Every task carries the guardrails above: no keys in the browser, no streamer passwords stored, no advance song lists, and AzuraCast routes confirmed against our version's API reference.

## Open decisions

- Who the DJs are: OTW staff, OTW artists, outside DJs, or all three. This sets how strict onboarding is.
- Whether DJs are paid, and so whether the portal needs tax and payment details.
- Which Supabase project holds DJ accounts.
- Where uploads land: Supabase Storage or the AIMC S3 bucket.
- Whether live DJ sets may be recorded for the DJ, and whether a DJ can opt in to a replay (the default is live once).
- Which grid blocks DJs can book: only the 5pm to midnight takeovers and the Noon to 3pm guest curator slot, or more.
- Who approves bookings and sets (one staff owner or a rota).

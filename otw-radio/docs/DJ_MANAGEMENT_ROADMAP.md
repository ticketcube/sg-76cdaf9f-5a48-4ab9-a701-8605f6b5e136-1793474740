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

## Phase 0: AzuraCast and decisions (about 1 week)

Mostly AzuraCast admin work by staff, plus decisions. No site code.

- [ ] In AzuraCast, create a role **`otw-site-bot`** scoped to the OTW station with only: manage streamers/DJs, manage media, manage playlists, view reports. No global or system permissions.
- [ ] Create a user for that role and an API key on it. Put the key in the site's server env as `AZURACAST_API_KEY` (replacing any admin key). An AzuraCast API key has exactly its user's permissions, so a leaked key cannot touch other stations or settings.
- [ ] Station settings: streamers/DJs on, live broadcast recording off by default, on-demand and requests off (already the plan).
- [ ] Add AzuraCast web hooks for "live DJ connected" and "live DJ disconnected" pointing at a site route (built in Phase 1) with a shared secret.
- [ ] Decide the Supabase project for DJ accounts (see "Supabase" below). Phase 1 does not need it. Phases 2 onward do.
- [ ] Draft the DJ agreement: license compliance, play limits, no pre-announcing songs, no unreleased or uncleared tracks without written clearance, recordings policy, conduct, payment (if any).
- [ ] Update `AZURACAST_FOR_SOFTGEN.md` and task 13 to match this roadmap.

**Done when** the site has a restricted key and the DJ agreement exists in draft.

## Phase 1: Staff DJ desk, no database (2 to 3 weeks)

Staff manage DJs from onestowatch.live behind the existing `STAFF_PASSWORD` lock (task 15). DJs get nothing to log into yet. AzuraCast itself is the store, so no database is needed.

Staff pages:

- `/djs`: list of DJs, read from `GET /api/station/{id}/streamers` and joined to `otw-radio/config/hosts.json` (task 10) by `azuracast_streamer`. Shows active or disabled, next slot, and who is live now.
- `/djs/new`: create a DJ. Server creates the streamer with a random password and `enforce_schedule: true`.
- `/djs/[slug]`: book slots (adds `schedule_items` on the streamer), cancel slots, disable the DJ, **rotate credentials**, and **cut the live feed** (disconnect the current streamer).

Credentials:

- The server generates the password, sets it on the streamer, and shows it **once** to staff on a "send to DJ" screen with copy-paste OBS settings (server, port, mount, username). It is never saved by the site.
- Optional: instead of staff pasting it, the server makes a one-time link (`/dj/credentials/[token]`), where the token is encrypted with a server secret, expires after 24 hours, and holds the streamer id. Opening it **rotates** the password and shows the new one. Opening it twice just rotates again, so a forwarded link stops working the moment the DJ uses theirs.
- After each slot, staff can rotate again. With enforce schedule on, a leaked password only works inside a booked slot anyway.

Monitoring:

- `/api/hooks/azuracast` receives the connect and disconnect web hooks, verifies the secret, and refreshes the "on air now" card (task 10) right away.
- Dashboard panel: who is on air, slot start and end, listener count during the slot.

Server routes (all staff-only, all server-side):

| Route | Calls in AzuraCast |
| --- | --- |
| `GET /api/staff/dj` | `GET /api/station/{id}/streamers` |
| `POST /api/staff/dj` | `POST /api/station/{id}/streamers` |
| `PATCH /api/staff/dj/[id]` (slots, active, display name) | `PUT /api/station/{id}/streamer/{id}` |
| `POST /api/staff/dj/[id]/rotate` | `PUT .../streamer/{id}` with a new password |
| `POST /api/staff/dj/disconnect` | AzuraCast's "disconnect current streamer" backend action |
| `POST /api/hooks/azuracast` | none, receives web hooks |

Confirm each route against `{AZURACAST_URL}/docs/api/` on our version before building. Routes can shift between AzuraCast versions.

**Done when** staff can add a DJ, book a slot, hand over credentials, watch them go live on schedule, and cut them off, all without opening AzuraCast.

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

- [ ] The DJ's dashboard shows their next slot, a countdown, and OBS settings.
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
- [ ] Monthly export that merges AzuraCast's play log with DJ tracklists for SoundExchange and the PROs.
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
| 18 | 1 | Book and cancel slots, disable DJ (`PATCH /api/staff/dj/[id]`) | 17 |
| 19 | 1 | Credentials: show once, one-time link, rotate | 17 |
| 20 | 1 | AzuraCast web hook route, live card refresh, cut live feed | 17, task 10 |
| 21 | 2 | DJ sign-in, profile and agreement (`/dj/*`) | Supabase |
| 22 | 2 | Open slots, requests and staff approvals | 21 |
| 23 | 2 | DJ go-live screen with reveal-by-rotation | 22 |
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

# AzuraCast setup for OTW Radio

Menu names below follow recent AzuraCast releases. They move between versions, so check the [AzuraCast docs](https://www.azuracast.com/docs/) if one isn't where this says.

## 1. Server

- One Linux VM (Ubuntu LTS), 2 to 4 vCPU, 4 GB RAM, 80 GB disk to start. Audio-only streaming is light. Grow disk with the media library, or point media at S3 (step 6).
- DNS: `radio.onestowatch.live` as an A record to the server.
- Install with the official Docker installer:

```bash
mkdir -p /var/azuracast && cd /var/azuracast
curl -fsSL https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/docker.sh > docker.sh
chmod a+x docker.sh
./docker.sh install
```

- In the web setup, create the admin account, set the site base URL to `https://radio.onestowatch.live` and enable Let's Encrypt.
- Under System Settings, allow cross-origin API calls from `https://onestowatch.live` and `https://onestowatch.com` so the site can read now-playing.

## 2. Station

| Setting | Value |
| --- | --- |
| Name | OTW Radio |
| Short name | `otw_radio` (must match `config/schedule.json`) |
| Time zone | America/New_York (must match `config/schedule.json`) |
| Broadcasting | Icecast frontend, Liquidsoap backend |
| Mount points | `/radio.mp3` at 128 kbps MP3, `/radio.aac` at 64 kbps AAC for mobile |
| HLS | Enabled, for iOS and the web player |
| Streamers / DJs | Enabled, for live interviews and live shows |
| Song requests | Off at launch |

## 3. Custom fields

Administration, Custom Fields. Add two, with these exact short names:

| Short name | Purpose |
| --- | --- |
| `aimc_asset_id` | The AIMC asset a track came from |
| `has_video` | `1` when the site should play the AIMC video in step |

The sync service writes both. The site reads them from now-playing.

## 4. API key

My Account, API Keys. Create one for the sync service and put it in `AZURACAST_API_KEY`. The station's numeric ID (from its URL in the admin) goes in `AZURACAST_STATION_ID`.

## 5. Playlists

Run `npm run sync -- setup` to create the **OTW Playlist** rotation. Upload or move the music library into it (Music Files, select, Add to Playlist).

Everything else is created by `npm run sync -- sync YYYY-MM-DD`: one dated `Feature …` playlist scheduled 10:00 to 12:00 and 15:00 to 17:00, and one dated `Guest Curator …` playlist scheduled 12:00 to 15:00. Both play their tracks once, in order, and interrupt the rotation on time. Delete old dated playlists monthly, or add a cleanup step to the sync service.

## 6. Media storage (optional)

Administration, Storage Locations can point station media at an S3 bucket instead of local disk. Use a separate bucket from the AIMC media lake. The radio copy is derived MP3s, not masters.

## 7. Embeds for the site

From the station Profile page, Embed Widgets gives iframe code for the player, the schedule and recent history. These are the fallback. The Softgen-built site uses the public API directly:

| Need | Endpoint |
| --- | --- |
| Now playing, up next, listeners | `GET /api/nowplaying/otw_radio` |
| Schedule | `GET /api/station/otw_radio/schedule` |
| Live updates without polling | Centrifugo websocket (see AzuraCast docs, "Now Playing data") |
| Stream URLs | Listed in the now-playing response under `station.mounts` and `station.hls_url` |

## 8. Royalty reporting

Reports, SoundExchange Royalties exports the play log in the format SoundExchange asks for. Run it monthly and keep the files. PRO reporting uses the same play history.

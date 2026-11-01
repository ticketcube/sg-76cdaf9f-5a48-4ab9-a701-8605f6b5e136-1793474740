# AIMC integration

AIMC runs on AWS Media Lake and serves as the OTW media warehouse for every show that airs "live" but was recorded ahead. AzuraCast holds only derived MP3s for what is scheduled.

## Architecture

- **Backend**: AWS Media Lake (S3-backed storage with REST API)
- **Authentication**: Bearer token via `AIMC_API_KEY` environment variable
- **Integration**: Confirmed routes via AWS Media Lake open-source connector documentation

## What AIMC holds today (checked 2026-10-30)

- About 2,149 public assets, mostly OTW YouTube video (MKV and MP4), plus WAV podcast audio.
- Keyword search counts: 63 assets match "interview", 121 videos match "live", 129 audio files.
- Each asset carries tags, an MP4 proxy and a thumbnail, and media info. Example (Wilderado, Live From the Rooftop):

```json
{
  "id": "asset:uuid:b19d0bad-efe8-46e7-a3d8-0b2b2cd49cbb",
  "type": "Video",
  "tags": {
    "Artist": "Wilderado",
    "Series": "Live From the Rooftop",
    "Format": "Live Performance",
    "Artist Spotify ID": "1Tp7C6LzxZe9Mix6rn4zbI"
  },
  "media": { "durationSec": 217.6, "audioCodec": "opus", "width": 1920, "height": 1080 },
  "representations": [
    { "id": "asset:uuid:2415ff53-…:proxy", "purpose": "proxy", "format": "MP4" },
    { "id": "asset:uuid:2415ff53-…:thumbnail", "purpose": "thumbnail", "format": "JPEG" }
  ]
}
```

- The OTW artist, partner and series collections exist but were empty when checked.

## Production API Routes

The sync service uses two authenticated AWS Media Lake REST endpoints:

| Route | Method | Returns | Used for |
| --- | --- | --- | --- |
| `/assets/{id}` | GET | Asset metadata (tags, media info, representations) | Title, artist, proxy ID lookup |
| `/assets/{id}/download` | GET | Presigned S3 URL (short-lived) | ffmpeg reads audio; site plays video proxy |

Optional query parameter: `?representation={representationId}` to download a specific representation (proxy, thumbnail) instead of the original asset.

Tags the radio uses: `Artist`, `Series`, `Format`, `Artist Spotify ID`. Adding a `Radio Cleared` tag (yes or no) in AIMC would let producers see at a glance which assets have the artist and guest releases needed to air.

## Premiere flow

1. A producer writes `config/episodes/YYYY-MM-DD.json` with the AIMC asset IDs for the feature and guest curator blocks, in play order.
2. `npm run sync -- sync YYYY-MM-DD` for each asset: get a presigned URL, run ffmpeg (audio only, loudness-normalised MP3), upload to AzuraCast at `feature/YYYY-MM-DD/NN-artist-title.mp3`, add it to the dated playlist, set `aimc_asset_id` and `has_video`.
3. AzuraCast airs the playlist at 10:00 and again at 15:00. Listeners hear it at the same moment, with no skipping, so it plays as live.

Later, a producer UI (or a Softgen admin page) can write the episode files, and an AIMC collection per air date could replace them.

## Video in step with the audio

AzuraCast is audio only. For a track with `has_video = 1`:

1. The site reads now-playing: the current song's `custom_fields.aimc_asset_id`, `played_at` and `elapsed`.
2. A server route on the site asks AIMC for a presigned URL to that asset's MP4 proxy. Keys stay on the server, and the URL expires.
3. The site plays the video muted under the live audio, starting at `elapsed` seconds, and re-syncs if it drifts more than about 2 seconds.

That gives a "watch" mode without a second streaming system. If video demand grows, move to a real video stream (Mux or AWS IVS) fed by the same schedule.

## Environment Setup

Required environment variables for sync service:

```bash
# AWS Media Lake connection
AIMC_API_URL=https://otw.aimc-ln.com/v1
AIMC_API_KEY=your-api-key-here

# AzuraCast connection
AZURACAST_URL=http://onestowatch.live
AZURACAST_API_KEY=your-api-key-here
AZURACAST_STATION_ID=2
```

The AIMC API key must have read permissions for asset metadata and download URL generation.

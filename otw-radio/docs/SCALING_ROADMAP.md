# OTW Radio Scaling Roadmap

Comprehensive outline of what to build on top of AzuraCast to scale the station from launch to enterprise-level operation.

## Current State (v1.0 - Launch Ready)

✅ **Core Infrastructure**
- AzuraCast instance with Icecast/Liquidsoap
- AIMC integration for media warehouse
- Sync service for episode scheduling
- Basic web player with Now Playing

✅ **Content Workflow**
- Manual episode JSON files
- CLI-based sync tool
- Audio extraction and normalization
- Custom fields for video sync

## Phase 1: Operations & Analytics (Months 1-3)

### 1.1 Real-time Analytics Dashboard

**Why**: Understand listener behavior, peak hours, geographic distribution, and content performance.

**Build**:
```
/api/analytics/
├── listeners
│   ├── current (websocket + polling fallback)
│   ├── historical (daily/weekly/monthly aggregates)
│   └── geographic (IP geolocation via CloudFlare or MaxMind)
├── tracks
│   ├── performance (plays, skip rate, listener retention)
│   ├── trending (most played, most requested)
│   └── artist-stats (play counts per artist)
└── streams
    ├── bandwidth (real-time + historical)
    ├── codec-distribution (MP3 vs AAC vs HLS)
    └── device-types (mobile vs desktop)
```

**AzuraCast APIs to use**:
- `GET /api/nowplaying/{station}` - current listeners
- `GET /api/station/{station}/history` - play history (paginated)
- `GET /api/station/{station}/listeners` - detailed listener connections
- **Websocket**: Connect to `ws://radio.onestowatch.live/api/live/nowplaying/{station}` for real-time updates

**New services**:
- Analytics aggregation worker (Redis/PostgreSQL time-series)
- Geographic IP lookup service
- Dashboard UI (Chart.js or Recharts)

### 1.2 Automated Reporting

**Why**: Monthly royalty reports, sponsor metrics, artist performance reports.

**Build**:
- Weekly email digest (top tracks, listener growth, peak hours)
- Monthly SoundExchange export automation (already manual in AzuraCast)
- Artist performance reports (plays per asset, listener engagement)
- Sponsor impression tracking (for future ad slots)

**Implementation**:
- Cron job pulls AzuraCast history API daily
- Stores in PostgreSQL with materialized views
- Report generator service (PDF via Puppeteer or email templates)

### 1.3 Health Monitoring & Alerts

**Why**: Catch stream outages, sync failures, or degraded performance before listeners notice.

**Build**:
```
/health-checks/
├── stream-availability (ping mount points every 60s)
├── sync-service-status (last successful sync timestamp)
├── aimc-connectivity (check Media Lake API)
├── disk-space (AzuraCast server monitoring)
└── listener-drops (detect sudden listener count drops)
```

**Alerting**:
- Discord/Slack webhook for critical issues
- PagerDuty integration for on-call team
- Status page (statuspage.io or self-hosted)

## Phase 2: Content Management System (Months 3-6)

### 2.1 Producer Dashboard

**Why**: Replace manual JSON file editing with a user-friendly interface.

**Build**:
```
/admin/
├── episodes
│   ├── create (date picker, block selection)
│   ├── search AIMC assets (with preview)
│   ├── drag-to-reorder playlist
│   └── schedule + publish
├── weekly-features
│   ├── manage recurring features
│   ├── assign to days of week
│   └── archive/restore
└── calendar
    ├── month view of scheduled content
    ├── quick-edit inline
    └── bulk operations (copy week template)
```

**API Layer**:
- `POST /api/admin/episodes` - creates episode JSON + triggers sync
- `GET /api/admin/aimc/search?q=artist` - proxies AIMC search with caching
- `GET /api/admin/aimc/assets/{id}/preview` - returns presigned thumbnail/proxy URL
- `PUT /api/admin/episodes/{date}` - updates episode + re-syncs

**Auth**:
- Role-based access (Admin, Producer, Viewer)
- OAuth2 with Google Workspace or GitHub
- Session management (JWT + refresh tokens)

### 2.2 AIMC Collection Manager

**Why**: Organize assets into collections instead of manual ID lists.

**Build**:
- Sync with AIMC collections API (if available)
- Create "smart playlists" based on tags (e.g., "all live performances from Q4 2026")
- Auto-populate episodes from collections

**Fallback**:
- Build own collection system in PostgreSQL
- Tag assets locally (supplement AIMC tags)
- Search/filter UI for producers

### 2.3 Schedule Templates

**Why**: Reduce repetitive work for weekly/monthly programming patterns.

**Build**:
- Save episode configurations as templates
- "Copy last week" function
- Recurring features auto-fill
- Holiday/special-event overrides

## Phase 3: Live Streaming & DJ Features (Months 6-9)

### 3.1 DJ Portal

**Why**: Enable remote live broadcasts without giving DJs full AzuraCast admin access.

**Build**:
```
/dj/
├── login (scoped credentials per DJ)
├── go-live
│   ├── connection details (Icecast mount point, credentials)
│   ├── broadcast-test (pre-flight audio check)
│   └── schedule-conflicts (warn if overlapping)
├── playout
│   ├── upload tracks for live set
│   ├── cue-next-track (manual control)
│   └── backsell/intro voice-over queue
└── history
    ├── past shows
    ├── listener stats
    └── download VOD (if recorded)
```

**AzuraCast Integration**:
- Use AzuraCast streamer/DJ accounts API
- `POST /api/station/{station}/streamers` - create DJ account
- Monitor live broadcasts via nowplaying API (`station.is_online` flag)

### 3.2 Live Show Management

**Why**: Schedule live interviews, performances, and Q&A sessions.

**Build**:
- Calendar booking for live slots
- Automated pre-show announcements ("Live in 15 minutes")
- Greenroom/backstage chat (WebRTC or Twilio)
- Auto-record live shows for replay/VOD

**Implementation**:
- Integrate with Google Calendar or Calendly
- Webhook from booking → creates AzuraCast streamer slot
- RTMP/SRT encoder guide for guests

### 3.3 Video Simulcast (Phase 3b)

**Why**: Scale video beyond the current "sync to AIMC proxy" approach.

**Options**:
1. **Current (good for <100 concurrent viewers)**:
   - Keep presigned URL approach
   - Add video player controls (play/pause)
   - Improve sync algorithm (WebSocket time codes)

2. **Scale (100-1000 viewers)**:
   - Mux.com or AWS IVS for live video streaming
   - Liquidsoap → ffmpeg → RTMP to Mux
   - Site embeds Mux player
   - Costs ~$10-20 per streamed hour

3. **Enterprise (1000+ viewers)**:
   - Full broadcast setup (OBS → RTMP → Cloudflare Stream or AWS MediaLive)
   - Multi-bitrate adaptive streaming
   - DVR/rewind capability

## Phase 4: Audience Engagement (Months 9-12)

### 4.1 Song Requests & Voting

**Why**: Listener participation drives engagement and loyalty.

**Build**:
```
/requests/
├── search-catalog (filter by available tracks)
├── submit-request (with optional message)
├── vote-on-requests (upvote/downvote)
└── request-queue (public view of pending)
```

**AzuraCast Integration**:
- Enable "Song Requests" in station settings
- `GET /api/station/{station}/requests` - list requestable tracks
- `POST /api/station/{station}/request/{media_id}` - submit request
- Moderate via AzuraCast admin or custom approval queue

### 4.2 Live Chat

**Why**: Community building during live shows and premieres.

**Options**:
1. **Simple**: Embed Discord widget
2. **Custom**: WebSocket chat server (Socket.io or Phoenix Channels)
3. **Premium**: Twitch-style chat with emotes, badges, moderation

**Features**:
- Display username + avatar
- Rate limiting (prevent spam)
- Moderator commands (/mute, /ban)
- Chat replay for VODs

### 4.3 Social Integration

**Why**: Cross-promote to Instagram, Twitter, TikTok.

**Build**:
- Auto-post "Now Playing" to Twitter/X every 30 minutes
- Instagram Stories template with track artwork
- TikTok-ready clip generator (30s preview of new tracks)
- Spotify playlist sync (create OTW Radio playlist with recently played)

**APIs**:
- Twitter API v2 for posts
- Instagram Graph API (requires FB Business account)
- Spotify Web API for playlist management

### 4.4 Email Notifications

**Why**: Keep listeners informed of favorite artists, new content.

**Build**:
- Newsletter signup (weekly roundup of featured artists)
- "Notify me when artist X airs" (user sets preferences)
- Push notifications (web push API or OneSignal)

## Phase 5: Business Intelligence (Months 12-18)

### 5.1 Revenue Attribution

**Why**: Understand ROI for partnerships, sponsorships, advertising.

**Build**:
- Track referral sources (utm_source in listener IPs)
- Conversion tracking (listener → Spotify follower, ticket buyer, merch purchaser)
- Sponsor reporting (impressions, geographic reach)

**Integration**:
- Google Analytics 4 (for web traffic)
- Mixpanel or Amplitude (for listener behavior funnels)
- Custom attribution database (link listener IP sessions to conversions)

### 5.2 Artist Insights Portal

**Why**: Provide value to featured artists (drive exclusives, loyalty).

**Build**:
```
/artists/{spotify_id}/
├── dashboard
│   ├── total-plays-on-otw
│   ├── listener-demographics
│   ├── peak-listening-times
│   └── geographic-reach
├── content
│   ├── tracks-featured
│   ├── video-simulcast-views
│   └── social-mentions
└── export
    ├── one-sheet-pdf (for press kits)
    └── csv-data
```

**Access Control**:
- Magic link authentication (email-based, no password)
- Spotify OAuth (prove artist identity)

### 5.3 Label & Partner Portals

**Why**: Scale partnerships with record labels, venues, festivals.

**Build**:
- Label dashboard (all their artists' performance)
- Venue integration (cross-promote live shows)
- Festival partner page (preview lineup tracks)

## Phase 6: Infrastructure & Reliability (Ongoing)

### 6.1 CDN & Edge Caching

**Why**: Reduce AzuraCast server load, improve global latency.

**Build**:
- CloudFlare Stream or AWS CloudFront for HLS streams
- Cache nowplaying API responses (60s TTL)
- Static asset CDN for track artwork, video thumbnails

**Implementation**:
- CloudFlare Workers for API caching logic
- Origin shield on AzuraCast server (nginx proxy)

### 6.2 Redundancy & Failover

**Why**: Minimize downtime during server maintenance or outages.

**Build**:
- Secondary AzuraCast instance (hot standby)
- DNS failover (Route 53 health checks)
- Automated backup/restore (daily snapshots)

**Cost**:
- Standby server can be smaller (2 vCPU, 2 GB RAM, only streams during failover)

### 6.3 Auto-Scaling

**Why**: Handle viral moments (artist shares station, festival partnership).

**Build**:
- Kubernetes deployment for web app (auto-scale pods)
- AzuraCast behind load balancer (multiple stream origins)
- Icecast relay servers (geographic distribution)

**Triggers**:
- Scale up when listener count > 1000
- Scale down during off-peak hours (3am-6am ET)

## Phase 7: Advanced Features (18+ months)

### 7.1 Personalization Engine

- Machine learning recommendations (per-listener taste profiles)
- Dynamic ad insertion (based on listener location, time-of-day)
- A/B testing for track ordering

### 7.2 Mobile Apps

- Native iOS/Android apps (React Native or Flutter)
- Offline mode (download tracks for offline playback)
- Background audio (continue playing when app is backgrounded)

### 7.3 Voice Integration

- Alexa Skill / Google Assistant Action
- "Hey Google, play OTW Radio"
- Voice-controlled requests ("Play the latest by Wilderado")

## Technology Recommendations

### Backend Services
- **Web Framework**: Next.js API routes (keep it in same repo)
- **Database**: PostgreSQL (Supabase or self-hosted)
- **Cache**: Redis (session storage, API response caching)
- **Queue**: BullMQ (sync jobs, report generation)
- **Search**: Meilisearch or Algolia (AIMC asset search)

### Infrastructure
- **Hosting**: Vercel (frontend) + Fly.io or Railway (backend services)
- **Monitoring**: Sentry (error tracking) + Grafana (metrics)
- **Logging**: Better Stack or Datadog

### Estimated Costs by Phase

| Phase | Monthly Cost | One-time Dev |
|-------|--------------|-------------|
| Current | $40 (AzuraCast server) | Done |
| Phase 1 (Analytics) | +$20 (PostgreSQL, Redis) | 3-4 weeks |
| Phase 2 (CMS) | +$0 (same infra) | 4-6 weeks |
| Phase 3 (Live) | +$50 (video, 100 viewers) | 4-6 weeks |
| Phase 4 (Engagement) | +$30 (chat, email) | 3-4 weeks |
| Phase 5 (BI) | +$100 (analytics, CDN) | 6-8 weeks |
| Phase 6 (Scale) | +$200 (redundancy, edge) | 2-3 weeks |

Total: ~$440/month for enterprise-ready infrastructure serving 1000+ concurrent listeners.

## Prioritization Matrix

**Do First** (High Impact, Low Effort):
1. Analytics dashboard (understand your audience)
2. Producer dashboard (reduce operational friction)
3. Health monitoring (prevent outages)

**Do Soon** (High Impact, Medium Effort):
4. DJ portal (enable live content)
5. Song requests (audience engagement)
6. CDN (improve global latency)

**Do Later** (Medium Impact, High Effort):
7. Video simulcast scaling (only if demand exceeds 100 viewers)
8. Artist insights portal (build when you have enough data)
9. Mobile apps (when web traffic justifies it)

**Nice to Have** (Low Priority):
- Voice assistants
- Personalization engine
- Label portals

## Next Steps

1. **Week 1-2**: Implement basic analytics (listener count over time, top tracks)
2. **Week 3-4**: Build producer dashboard (episode creation UI)
3. **Month 2**: Set up health monitoring and alerting
4. **Month 3**: Launch DJ portal for first live show
5. **Month 4+**: Iterate based on user feedback and growth metrics

Questions to answer before scaling:
- What's the target listener count in 6 months? 12 months?
- Will there be advertising? (affects ad insertion, targeting features)
- Will artists pay for insights? (affects pricing, data granularity)
- Is live video a must-have or nice-to-have? (drastically affects costs)
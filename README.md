# OTW Radio Web Player

**Status:** Production-ready v1.0  
**Live:** [radio.onestowatch.live](https://radio.onestowatch.live)  
**Admin:** [radio.onestowatch.live/admin](https://radio.onestowatch.live/admin)

A 24/7 internet radio station with live DJ streaming, programming schedule, and admin management. Built for Ones To Watch to showcase their roster with real-time audio and video integration.

---

## 🎯 Core Features

### Public Features
- **Live Audio Player**: Persistent sticky player that continues across page navigation
- **Programming Schedule**: 5 daily blocks + rotating weekly specials
- **Now Playing**: Real-time track information from AzuraCast
- **Responsive Design**: Mobile-first, dark-themed UI matching OTW brand

### DJ Features  
- **Web DJ Interface**: One-click access to streaming controls via AzuraCast
- **Live Status**: Real-time detection when DJs go live
- **Profile Management**: Display name, bio, social links

### Admin Features
- **DJ Management**: Create DJ accounts, set AzuraCast credentials, monitor live status
- **User Management**: Create/manage admin and DJ users
- **Playlist Management**: Visual playlist editor with AIMC sync
- **Live Monitoring**: Dashboard showing current DJ, listener count, broadcast duration

---

## 🏗️ Tech Stack

**Frontend:**
- Next.js 15.2 (Page Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React 18

**Backend:**
- Supabase (Auth, Database, Storage)
- AzuraCast (Streaming infrastructure)
- Next.js API Routes (backend orchestration)

**External Integrations:**
- AzuraCast API (station management, live status, streamers)
- AIMC API (optional playlist sync)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase project
- AzuraCast instance with station configured

### Environment Setup

```bash
# Clone and install
npm install

# Configure environment (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AZURACAST_API_KEY=your_azuracast_api_key
NEXT_PUBLIC_AZURACAST_URL=https://radio.onestowatch.live

# Run development server
npm run dev
```

### Initial Setup

1. **Database**: Supabase migrations in `supabase/migrations/` auto-create tables
2. **Admin User**: Create first admin via Supabase SQL editor:
   ```sql
   INSERT INTO user_profiles (user_id, email, username, display_name, role, is_admin)
   VALUES (
     'your-auth-user-id',
     'admin@example.com',
     'admin',
     'Admin User',
     'admin',
     true
   );
   ```
3. **AzuraCast Station**: Configure station shortcode as `otw_radio`

---

## 📁 Project Structure

```
src/
├── pages/
│   ├── index.tsx              # Homepage with audio player
│   ├── schedule.tsx           # Full schedule view
│   ├── auth/login.tsx         # Authentication
│   ├── admin/
│   │   ├── index.tsx          # Admin dashboard
│   │   ├── djs.tsx            # DJ management (Phase 2 complete)
│   │   ├── users.tsx          # User management
│   │   └── playlists.tsx      # Playlist editor
│   └── api/
│       ├── schedule.ts        # Schedule data
│       ├── now-playing.ts     # Live status
│       └── admin/
│           └── live-djs.ts    # DJ status + AzuraCast integration
├── components/
│   ├── AudioPlayer.tsx        # Persistent audio player
│   ├── Schedule.tsx           # Schedule grid component
│   └── ui/                    # shadcn/ui components
├── integrations/
│   └── supabase/              # Supabase client + types
└── styles/
    └── globals.css            # Dark theme + design system

config/
└── schedule.json              # Programming schedule definition

otw-radio/sync/                # AIMC sync service (optional)
```

---

## 🎨 Design System

**Permanent Dark Theme:**
- Background: `#0A0A0A` (near-black)
- Foreground: `#FAFAFA` (clean white)
- Primary: `#ED1D42` (crimson red for "LIVE")
- Accent: `#1F1F1F` (dark grey)

**Typography:**
- Display: Sora (headings)
- Body: IBM Plex Sans
- Mono: IBM Plex Mono (data/time)

**Key Classes:**
- `.live-indicator` - Pulsing "LIVE" badge
- `.status-live::before` - Red dot indicator
- `.glow-primary` - Crimson glow effect

---

## 🔐 Authentication & Authorization

**Roles:**
- `admin`: Full access to admin panel, user/DJ/playlist management
- `otwl-dj`: Access to Web DJ interface, profile management
- (Future: `listener`, `verified-listener` for chat/requests)

**Row-Level Security (RLS):**
All tables have RLS enabled. Key policies:
- `user_profiles`: Users read own data, admins read/write all
- Admin endpoints require `is_admin = true`
- DJ endpoints require `role = 'otwl-dj'`

---

## 📡 AzuraCast Integration

**Station Details:**
- Station ID: `2`
- Shortcode: `otw_radio`
- Web DJ URL: `https://radio.onestowatch.live/public/otw_radio/dj`

**API Endpoints Used:**
- `GET /api/nowplaying/otw_radio` - Live status, track info (public)
- `GET /api/station/otw_radio/streamers` - All DJ accounts (requires API key)
- `POST /api/station/otw_radio/playlists` - Playlist management (requires API key)

**DJ Workflow:**
1. Admin creates streamer account in AzuraCast Admin Panel
2. Admin sets `azuracast_streamer_username` in `/admin/djs`
3. Admin shares credentials securely with DJ
4. DJ clicks "Open Web DJ" button to stream
5. System auto-detects when DJ goes live (matches `streamer_name` to profile)

**Live Status Detection:**
- Polls `/api/nowplaying` every 30 seconds
- Matches `live.streamer_name` to `user_profiles.azuracast_streamer_username`
- Shows listener count, broadcast duration, current track
- Alerts if unmatched streamer is live

---

## 🔧 Key Configuration Files

### Schedule Definition (`config/schedule.json`)
```json
{
  "blocks": [
    {
      "id": "morning",
      "name": "Morning Mix",
      "time": "6:00 AM - 10:00 AM",
      "description": "...",
      "playlist": "morning_mix"
    }
  ]
}
```

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        # For admin operations
AZURACAST_API_KEY                # For DJ/playlist management
NEXT_PUBLIC_AZURACAST_URL

# Optional
AIMC_API_KEY                     # For playlist sync
AIMC_PARTNER_ID
```

---

## 🚧 Development Roadmap

**✅ Phase 1 Complete:** Static schedule, audio player, admin panel  
**✅ Phase 2 Complete:** DJ management, AzuraCast integration, live status  
**🔄 Phase 3 In Progress:** AIMC playlist sync automation  
**📋 Phase 4 Planned:** Listener features (chat, requests, favorites)

See `docs/SCALING_ROADMAP.md` and `public/DJ_MANAGEMENT_ROADMAP.md` for detailed plans.

---

## 📚 Documentation

- `docs/AZURACAST_SETUP.md` - AzuraCast configuration guide
- `docs/PROGRAMMING.md` - Schedule structure and playlist logic
- `docs/SCALING_ROADMAP.md` - Full feature roadmap
- `docs/LINODE_DEPLOYMENT.md` - Self-hosted deployment guide
- `public/DJ_MANAGEMENT_ROADMAP.md` - DJ system phases

---

## 🐛 Known Issues

**Database:**
- `duplicate key value violates unique constraint "user_profiles_user_id_key"` - Use UPSERT instead of INSERT when creating profiles, or check if profile exists first

**Preview:**
- If audio player shows "Internal Server Error", restart Next.js dev server
- Refresh preview iframe if stuck on white screen

---

## 📝 License

MIT License - see LICENSE file

---

## 🤖 AI Agent Context

For AI assistants working on this project, see `.softgen/project.md` for design system details and `docs/AI_AGENT_GUIDE.md` for architecture overview and common patterns.

**Key Principles:**
- Dark theme only (no light mode toggle)
- AzuraCast is the source of truth for streaming/DJ status
- Supabase handles auth, database, and files
- Use `azuracast_streamer_username` for DJ matching (not email, not display name)
- RLS policies protect all tables
- Prefer server-side API key usage over client-side
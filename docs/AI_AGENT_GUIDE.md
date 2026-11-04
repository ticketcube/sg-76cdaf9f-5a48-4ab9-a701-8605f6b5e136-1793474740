# AI Agent Guide - OTW Radio

**Purpose:** Onboarding document for AI assistants (Softgen, Cursor, etc.) working on the OTW Radio codebase.

---

## 📋 Project Context

**What is OTW Radio?**
A 24/7 internet radio station for Ones To Watch. DJs stream live via AzuraCast Web DJ interface. The web player shows now-playing info, programming schedule, and admin tools for managing DJs and playlists.

**Current State (as of 2026-11-04):**
- ✅ Phase 1: Static schedule, audio player, admin panel
- ✅ Phase 2: DJ management with AzuraCast live status integration
- 🔄 Phase 3: AIMC playlist automation (in progress)
- 📋 Phase 4: Listener features (planned)

---

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend:** Next.js 15.2 (Page Router), React 18, TypeScript, Tailwind + shadcn/ui
- **Backend:** Supabase (Postgres + Auth + Storage + RLS)
- **Streaming:** AzuraCast (station management, Web DJ interface, live detection)
- **Deployment:** Vercel (web app) + Linode (optional self-hosted)

### Key Design Decisions

**1. Always Dark Theme**
- No light mode, no theme toggle
- Matches OTW brand (dark background, white text, crimson accents)
- CSS variables in `src/styles/globals.css` set `:root` only (no `.dark` overrides)

**2. AzuraCast as Streaming Authority**
- AzuraCast manages: DJ accounts, playlists, live status, audio stream
- Our database stores: DJ metadata, UI preferences, AzuraCast username mapping
- Never build parallel auth or duplicate AzuraCast data - always fetch live

**3. Supabase-Native Backend**
- Auth: Supabase Auth (no custom JWT, no bcrypt)
- Database: Postgres with RLS policies (no service role key in client code)
- Files: Supabase Storage (no local filesystem)

**4. Server-Side API Key Management**
- `AZURACAST_API_KEY` must stay server-side (Next.js API routes only)
- Client uses public endpoints (`/api/nowplaying`) or our proxy APIs (`/api/admin/live-djs`)

---

## 🗂️ Database Schema

### Core Tables

**user_profiles** (extends Supabase auth.users)
```sql
user_id UUID PRIMARY KEY REFERENCES auth.users(id) UNIQUE
email TEXT NOT NULL
username TEXT NOT NULL
display_name TEXT
role TEXT CHECK (role IN ('admin', 'otwl-dj', 'listener', 'verified-listener'))
is_admin BOOLEAN DEFAULT false
azuracast_streamer_username TEXT  -- Exact match to AzuraCast username
azuracast_notes TEXT              -- Admin notes about DJ setup/schedule
created_at TIMESTAMPTZ
```

**RLS Policies:**
- Users can SELECT their own profile
- Admins can SELECT/UPDATE/DELETE all profiles
- Anyone can INSERT (for signup), but trigger sets role='listener' default

**playlists** (tracks, episodes, schedule items)
```sql
id BIGSERIAL PRIMARY KEY
name TEXT NOT NULL
type TEXT (track, episode, recurring)
metadata JSONB (artist, title, duration, aimc_asset_id, has_video, etc.)
created_at TIMESTAMPTZ
```

---

## 🔌 AzuraCast Integration

### Station Configuration
- **Station ID:** `2`
- **Shortcode:** `otw_radio`
- **Base URL:** `https://radio.onestowatch.live`

### API Endpoints

**Public (no auth required):**
```
GET /api/nowplaying/otw_radio
```
Returns: live status, current track, listener count, streamer_name

**Authenticated (X-API-Key header):**
```
GET /api/station/otw_radio/streamers
GET /api/station/otw_radio/playlists
POST /api/station/otw_radio/playlists
PUT /api/station/otw_radio/playlist/{id}
```

### DJ Matching Logic

**Critical:** Match DJs by `streamer_username` field, NOT `display_name`.

**Flow:**
1. Fetch nowplaying: `live.streamer_name` (if `live.is_live == true`)
2. Fetch all streamers: `GET /api/station/otw_radio/streamers`
3. Cross-reference with `user_profiles.azuracast_streamer_username`
4. If match found: show DJ card with "LIVE" badge, listener count, broadcast time
5. If no match: show alert "Unmatched live streamer: {name}"

**Common Pitfall:** Using `display_name` or `email` for matching - these don't exist in AzuraCast's streamer response. Only `streamer_username` is reliable.

### API Route Pattern

```typescript
// src/pages/api/admin/live-djs.ts
const AZURACAST_API_KEY = process.env.AZURACAST_API_KEY; // Server-side only
const STATION_SHORTCODE = "otw_radio";

// Fetch live status (public)
const nowPlaying = await fetch(
  `${AZURACAST_BASE_URL}/api/nowplaying/${STATION_SHORTCODE}`
);

// Fetch all streamers (authenticated)
const streamers = await fetch(
  `${AZURACAST_BASE_URL}/api/station/${STATION_SHORTCODE}/streamers`,
  { headers: { "X-API-Key": AZURACAST_API_KEY } }
);

// Match to database
const djStatuses = dbDJs.map(dj => {
  const azuracastAccount = streamers.find(
    s => s.streamer_username === dj.azuracast_streamer_username
  );
  const isLive = nowPlaying.live.is_live && 
                 nowPlaying.live.streamer_name === dj.azuracast_streamer_username;
  // ...
});
```

---

## 🎨 Design System

### Color Tokens (globals.css :root)
```css
--background: 0 0% 4%;          /* #0A0A0A near-black */
--foreground: 0 0% 98%;         /* #FAFAFA white */
--primary: 348 100% 54%;        /* #ED1D42 crimson */
--accent: 0 0% 12%;             /* #1F1F1F dark grey */
--muted: 0 0% 60%;              /* Grey for secondary text */
--border: 0 0% 12%;
```

### Typography
```typescript
fontFamily: {
  sans: ['IBM Plex Sans', ...],    // Body text
  display: ['Sora', ...],          // Headings
  mono: ['IBM Plex Mono', ...]     // Data, time, code
}
```

### Key Animations
```css
.animate-pulse-glow  /* Live indicators, glowing red */
.animate-pulse-dot   /* Red dot on DJ cards */
```

### Component Patterns
- **Live indicator:** `<Radio />` icon + pulsing red dot + "LIVE" badge
- **Time display:** IBM Plex Mono with `tabular-nums`
- **Cards:** `bg-card` with `border-border`, hover effect with `glow-primary`

---

## 🔐 Authentication Patterns

### Protected Routes
```tsx
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin>
      {/* Admin-only content */}
    </ProtectedRoute>
  );
}
```

### Auth Checks
```typescript
// Client-side
const { user, profile, loading } = useAuth();
if (profile?.is_admin) { /* admin UI */ }

// Server-side API route
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from("user_profiles")
  .select("is_admin")
  .eq("user_id", user.id)
  .single();

if (!profile?.is_admin) {
  return res.status(403).json({ error: "Admin access required" });
}
```

### RLS Policy Pattern
```sql
-- Admins can read/write all
CREATE POLICY "admin_all" ON table_name
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Users can read their own
CREATE POLICY "select_own" ON table_name
FOR SELECT USING (user_id = auth.uid());
```

---

## 📡 API Route Patterns

### Supabase Client Pattern (Client-Side)
```typescript
import { supabase } from "@/integrations/supabase/client";

// Query with RLS
const { data, error } = await supabase
  .from("user_profiles")
  .select("*")
  .eq("role", "otwl-dj")
  .order("display_name", { ascending: true });
```

### Service Role Pattern (Server-Side API Routes)
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Bypasses RLS
  { auth: { persistSession: false } }
);

// Use only when RLS bypass is required (user creation, admin operations)
const { data, error } = await supabaseAdmin
  .from("user_profiles")
  .insert({ ... });
```

### AzuraCast Proxy Pattern
```typescript
// NEVER expose AZURACAST_API_KEY to client
// Use Next.js API route as proxy

export default async function handler(req, res) {
  const response = await fetch(
    `${AZURACAST_BASE_URL}/api/station/${STATION_SHORTCODE}/streamers`,
    {
      headers: {
        "X-API-Key": process.env.AZURACAST_API_KEY
      }
    }
  );
  const data = await response.json();
  return res.json(data);
}
```

---

## 🛠️ Common Tasks

### Adding a New DJ
```typescript
// 1. Create auth user (Supabase dashboard or API)
// 2. Insert profile
await supabase.from("user_profiles").insert({
  user_id: authUser.id,
  email: "dj@example.com",
  username: "djname",
  display_name: "DJ Name",
  role: "otwl-dj",
  is_admin: false
});

// 3. Create AzuraCast streamer account (AzuraCast Admin Panel)
// 4. Set azuracast_streamer_username in /admin/djs page
```

### Adding a Schedule Block
```json
// config/schedule.json
{
  "blocks": [
    {
      "id": "new_block",
      "name": "New Block Name",
      "time": "2:00 PM - 6:00 PM",
      "description": "...",
      "playlist": "azuracast_playlist_name",
      "genres": ["genre1", "genre2"]
    }
  ]
}
```

### Creating a Playlist
```typescript
// Use otw-radio/sync/ CLI tool or API route
import { azuracast } from "./azuracast";

await azuracast.createPlaylist({
  name: "Playlist Name",
  type: "default",
  source: "songs",
  order: "shuffle",
  is_enabled: true,
  schedule_items: [
    { start_time: 0, end_time: 0, days: [1,2,3,4,5] }
  ]
});
```

---

## 🐛 Common Issues & Solutions

### Issue: "duplicate key value violates unique constraint user_profiles_user_id_key"
**Cause:** Trying to insert a profile for a user_id that already exists  
**Solution:** Use UPSERT or check existence first
```typescript
const { data: existing } = await supabase
  .from("user_profiles")
  .select("user_id")
  .eq("user_id", userId)
  .single();

if (!existing) {
  await supabase.from("user_profiles").insert({ ... });
}
```

### Issue: DJ shows "Setup Required" even with AzuraCast account
**Cause:** `azuracast_streamer_username` doesn't match AzuraCast's `streamer_username`  
**Solution:** 
1. Check AzuraCast Admin → Users & Accounts → Streamers
2. Copy exact `streamer_username` value
3. Paste into "Manage Credentials" dialog in `/admin/djs`

### Issue: Unmatched live streamer alert
**Cause:** Someone is streaming but their AzuraCast username isn't in our database  
**Solution:** Either add their username to an existing DJ profile, or create a new DJ profile

### Issue: Permission denied in API route
**Cause:** RLS blocking query, or missing auth token  
**Solution:** 
- Client queries: ensure user is logged in and has correct role
- Server queries: use service role client if RLS bypass needed
- Check RLS policies match the access pattern

---

## 📝 Code Style Guidelines

### File Naming
- Components: PascalCase (`AudioPlayer.tsx`)
- Pages: lowercase (`index.tsx`, `login.tsx`)
- API routes: lowercase (`live-djs.ts`)
- Utils/services: camelCase (`authService.ts`)

### Import Order
```typescript
// 1. External
import { useState } from "react";
import Link from "next/link";

// 2. UI components
import { Button } from "@/components/ui/button";

// 3. Local components
import { AudioPlayer } from "@/components/AudioPlayer";

// 4. Services/utils
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// 5. Types
import type { DJ, DJStatus } from "@/types";
```

### Error Handling
```typescript
try {
  const { data, error } = await supabase.from("table").select();
  if (error) throw error;
  return data;
} catch (err) {
  console.error("Context-specific error message:", err);
  // Show user-friendly message
  setError("Failed to load data. Please try again.");
}
```

### TypeScript
- Always define interfaces for API responses
- Use `type` for unions, `interface` for objects
- Prefer explicit return types on functions
- No `any` - use `unknown` and narrow with guards

---

## 🚀 Deployment Checklist

### Environment Variables
- [ ] All `NEXT_PUBLIC_*` vars set in Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-only)
- [ ] `AZURACAST_API_KEY` set (server-only)
- [ ] Database connection strings configured

### Database
- [ ] Migrations applied
- [ ] RLS policies enabled on all tables
- [ ] Admin user created
- [ ] Test DJ account created

### AzuraCast
- [ ] Station configured with shortcode `otw_radio`
- [ ] API key generated with station-level permissions
- [ ] Test streamer account created
- [ ] Web DJ interface accessible

### Testing
- [ ] Audio player works on all pages
- [ ] Admin login successful
- [ ] DJ management CRUD operations work
- [ ] Live status detection working
- [ ] Schedule renders correctly

---

## 🎯 Next Steps (For AI Agents)

When continuing work on this project:

1. **Read this guide first** - understand architecture before coding
2. **Check existing patterns** - match file structure, naming, API patterns
3. **Verify schema** - run `get_database_schema` before database changes
4. **Test AzuraCast integration** - don't break DJ matching logic
5. **Preserve dark theme** - never add light mode, use existing design tokens
6. **Follow RLS** - never bypass security unless explicitly needed
7. **Document as you go** - update this guide if you add new patterns

**Common Pitfalls to Avoid:**
- ❌ Using `display_name` or `email` for DJ matching (use `streamer_username`)
- ❌ Exposing `AZURACAST_API_KEY` to client (use API route proxy)
- ❌ Bypassing RLS without justification (use service role client sparingly)
- ❌ Adding light mode toggles (permanent dark theme)
- ❌ Creating duplicate auth systems (Supabase Auth only)
- ❌ Hardcoding URLs or credentials (use environment variables)

---

## 📚 Additional Resources

- **Project Brief:** `.softgen/project.md`
- **Roadmap:** `docs/SCALING_ROADMAP.md`
- **AzuraCast Setup:** `docs/AZURACAST_SETUP.md`
- **DJ Management Plan:** `public/DJ_MANAGEMENT_ROADMAP.md`
- **Deployment Guide:** `docs/LINODE_DEPLOYMENT.md`

For questions not covered here, check existing code patterns in `src/pages/admin/djs.tsx` and `src/pages/api/admin/live-djs.ts` - they demonstrate the full stack.
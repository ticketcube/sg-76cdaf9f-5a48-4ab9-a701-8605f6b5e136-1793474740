# ListenerMap Feature Documentation

## Overview
Real-time world map visualization showing:
1. **Active listeners** (red pulsing dots from AzuraCast)
2. **City moods** (colored dots from user mood submissions)
3. **Upcoming shows** (future: show markers for scheduled events)

Built with SVG coordinate system, modular overlay architecture, and real-time polling.

---

## Component Architecture

### 1. **ListenerMap.tsx** (Main Container)
**Path:** `src/components/ListenerMap.tsx`

**Responsibilities:**
- Fetches listener data from `/api/listeners-map` every 30s
- Renders base world map (land dots via `worldDots.ts`)
- Plots listener dots (red pulsing circles sized by count)
- Extracts city coordinates from listener spots for mood overlay
- Coordinates all overlay layers via `MapOverlayManager`

**Key State:**
```typescript
const [data, setData] = useState<ListenersData | null>(null);
// ListenersData = { total, located, spots: ListenerSpot[], source }
```

**Coordinate System:**
- Equirectangular projection: `x = (lon + 180) / DOT_STEP`, `y = (DOT_LAT_TOP - lat) / DOT_STEP + 0.5`
- Grid: 180 cols × 70 rows (2° cells, lat 82° to -56°, lon -180° to 180°)
- Constants from `worldDots.ts`: `DOT_STEP = 2`, `DOT_LAT_TOP = 82`

**Data Flow:**
```
/api/listeners-map 
  ↓ (30s polling)
ListenerMap
  ↓ (extracts city coords)
MoodMapOverlay + ShowsMapOverlay
```

---

### 2. **Listener Overlay** (Red Dots)
**Rendered in:** `ListenerMap.tsx` (inline, not separate component)

**Visual Logic:**
- **Size:** `r = 0.9 + 2.6 * sqrt(count / maxCount)` (scales with listener count)
- **Animation:** Pulsing glow ring (3s loop, expands to 1.8× radius, fades 0.6→0 opacity)
- **Color:** `fill-primary` (Crimson Red from design system)
- **Tooltip:** Shows `"{label}: {count} listening"` on hover

**Label Rules:**
- ≥3 listeners in location → shows city name: `"Los Angeles, United States"`
- <3 listeners → shows country only: `"United States"`
- Aggregated by AzuraCast at ~1° grid resolution

---

### 3. **MoodMapOverlay.tsx** (Colored City Dots)
**Path:** `src/components/map/MoodMapOverlay.tsx`

**Responsibilities:**
- Feature-flagged (checks `mood_tracker_enabled` via `/api/admin/feature-flags`)
- Fetches city mood aggregates from `/api/mood/city-aggregates` every 5s
- Matches city names to coordinates (listener spots OR `cities.ts` fallback)
- Renders `CityMoodDot` for each city with active mood

**Coordinate Matching Strategy:**
1. **Primary:** Match against listener map spots (`cities` prop from ListenerMap)
2. **Fallback:** Query `MAJOR_CITIES` database (90+ cities with exact coords)
3. **Result:** Mood dots appear even when <3 listeners (no longer dependent on aggregation threshold)

**Mood Colors:**
```typescript
const MOOD_COLORS = {
  cozy: "hsl(180 60% 50%)",       // Teal
  party: "hsl(10 80% 55%)",       // Red
  reflection: "hsl(200 70% 65%)", // Light Blue
  focus: "hsl(45 80% 55%)"        // Gold
};
```

**State Management:**
```typescript
const [cityMoods, setCityMoods] = useState<CityMoodData[]>([]);
// CityMoodData = { city, mood, timestamp }

const [pulsingCities, setPulsingCities] = useState<Set<string>>(new Set());
// Triggers triple white flash animation when new mood detected
```

**Change Detection:**
- Compares `timestamp` field to detect new moods
- Sets `isPulsing` flag for 1000ms
- Passes flag to `CityMoodDot` for visual feedback

---

### 4. **CityMoodDot.tsx** (Individual Mood Dot)
**Path:** `src/components/map/CityMoodDot.tsx`

**Responsibilities:**
- Renders single mood dot at city coordinates
- Updates color reactively when mood changes
- Displays triple white flash pulse animation on mood change
- Provides hover tooltip with city/mood/timestamp

**Visual Spec:**
- **Main dot:** `r=2.5`, `opacity=0.9`, `fill={currentColor}`
- **Glow ring:** `r=4`, `opacity=0.3`, blur filter
- **Pulse animation (when `isPulsing`):**
  - 3 expanding white rings (r: 1.5→6)
  - 400ms duration each
  - Full white opacity fading to 0

**Console Logging:**
```
[CityMoodDot] Los Angeles: cozy → hsl(180 60% 50%) (timestamp)
```

**Data Attributes (for debugging):**
```html
<g data-city="Los Angeles" data-mood="cozy" data-timestamp="2026-11-10T00:09:05Z">
```

---

### 5. **ShowsMapOverlay.tsx** (Future: Show Markers)
**Path:** `src/components/map/ShowsMapOverlay.tsx`

**Status:** Implemented but not yet populated with real data

**Planned Functionality:**
- Fetch upcoming shows from `/api/shows/upcoming`
- Plot venue locations on map
- Animate markers to draw attention before show start
- Link to show details/RSVPs

---

### 6. **MapOverlayManager.tsx** (Orchestrator)
**Path:** `src/components/map/MapOverlayManager.tsx`

**Simple wrapper that:**
- Groups all overlay layers under single `<g>` element
- Ensures consistent z-index (mood/shows overlays render ON TOP of listener dots)
- Shares `width`/`height` props to all children

```tsx
<MapOverlayManager width={COLS} height={ROWS}>
  <MoodMapOverlay />
  <ShowsMapOverlay />
</MapOverlayManager>
```

---

## API Endpoints

### 1. `/api/listeners-map` (GET)
**Source:** `src/pages/api/listeners-map.ts`

**Function:** Aggregates anonymous listener locations from AzuraCast

**Data Flow:**
1. Calls AzuraCast `/api/station/{STATION}/listeners` (requires `AZURACAST_API_KEY`)
2. Deduplicates by listener hash
3. Rounds coordinates to ~1° grid
4. Aggregates counts per bucket
5. Assigns city labels when ≥3 listeners share location
6. Caches for 30s

**Response:**
```typescript
{
  total: number,           // Total unique listeners
  located: number,         // Listeners with valid coordinates
  spots: ListenerSpot[],   // Array of aggregated locations
  countries: { country, count }[],
  source: "live" | "demo" | "unconfigured" | "error",
  updated: string          // ISO timestamp
}

// ListenerSpot
{
  lat: number,    // Rounded latitude
  lon: number,    // Rounded longitude
  count: number,  // Listeners in this bucket
  label: string   // "Los Angeles, United States" OR "United States"
}
```

**Fallback Modes:**
- No API key → Returns total count only, empty spots
- Error → Returns total from public API, empty spots
- `?demo=1` → Returns hardcoded demo data (14 LA, 11 NYC, etc.)

**Environment Variables:**
- `AZURACAST_URL` (e.g., `https://radio.onestowatch.live`)
- `AZURACAST_API_KEY` (admin key for full listener data)
- `AZURACAST_STATION_ID` (e.g., `otw_radio`)

---

### 2. `/api/mood/city-aggregates` (GET)
**Source:** `src/pages/api/mood/city-aggregates.ts`

**Function:** Returns most recent mood per city (last 5 minutes)

**Query:**
```sql
SELECT city, mood_category, created_at 
FROM mood_changes
WHERE city IS NOT NULL 
  AND city NOT IN ('Unknown', 'Local')
  AND created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
```

**Deduplication:** One mood per city (most recent wins)

**Response:**
```typescript
{
  cities: [
    { city: "Los Angeles", mood: "cozy", timestamp: "..." },
    { city: "New York", mood: "party", timestamp: "..." },
    ...
  ]
}
```

---

### 3. `/api/mood/submit` (POST)
**Source:** `src/pages/api/mood/submit.ts`

**Function:** Records user mood submission with city detection

**Flow:**
1. Extract IP from `x-forwarded-for` header
2. Call `/api/mood/get-city` to resolve IP → city name
3. Insert row into `mood_changes` table
4. Return success

**Request Body:**
```typescript
{
  mood: "cozy" | "party" | "reflection" | "focus"
}
```

---

### 4. `/api/mood/get-city` (GET)
**Source:** `src/pages/api/mood/get-city.ts`

**Function:** Resolves IP address to city name via ip-api.com

**Logic:**
- Extracts IP from request headers
- Skips private IPs (127.0.0.1, 192.168.x.x) → returns `"Local"`
- Calls `http://ip-api.com/json/{ip}?fields=city`
- Returns city name or `"Unknown"` on failure

**Response:**
```typescript
{ city: "Los Angeles" }
```

---

### 5. `/api/admin/feature-flags` (GET)
**Source:** `src/pages/api/admin/feature-flags.ts`

**Function:** Returns all feature flags from Supabase

**Query:**
```sql
SELECT * FROM feature_flags
```

**MoodMapOverlay checks:**
```typescript
flag_name === "mood_tracker_enabled" && enabled === true
```

---

## Supabase Schema

### Table: `mood_changes`
**Purpose:** Stores every mood submission with timestamp and location

**Columns:**
- `id` (uuid, primary key)
- `mood_category` (text) - One of: `cozy`, `party`, `reflection`, `focus`
- `city` (text) - Resolved city name from IP (nullable)
- `created_at` (timestamptz) - Submission time
- `user_id` (uuid, nullable, FK to auth.users)

**Indexes:**
- `(city, created_at DESC)` - Fast city aggregate queries
- `created_at DESC` - Fast recent submissions queries

**RLS Policies:**
- Public insert (anyone can submit mood)
- No read/update/delete for non-admins

---

### Table: `feature_flags`
**Purpose:** Runtime toggles for experimental features

**Columns:**
- `id` (uuid, primary key)
- `flag_name` (text, unique)
- `enabled` (boolean)
- `description` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Relevant Flags:**
- `mood_tracker_enabled` - Controls MoodMapOverlay visibility

---

## Supporting Files

### `src/lib/worldDots.ts`
**Purpose:** Base world map land mask

**Data:**
- Generated from Natural Earth land-50m (public domain)
- 2° cell resolution, 180×70 grid
- `LAND_ROWS`: Array of binary strings (`"1"` = land, `"0"` = ocean)
- `DOT_STEP = 2`, `DOT_LAT_TOP = 82`

---

### `src/lib/cities.ts`
**Purpose:** Fallback city coordinates database

**Data:**
- 90+ major world cities with exact lat/lng
- Used when listener map doesn't have city-level detail (<3 listeners)
- Case-insensitive lookup via `findCity(cityName)`

**Structure:**
```typescript
export interface CityCoords {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export const MAJOR_CITIES: CityCoords[] = [
  { city: "Los Angeles", country: "United States", lat: 34.05, lng: -118.24 },
  ...
];
```

---

### `src/components/MoodTap.tsx`
**Purpose:** User-facing mood submission UI

**Location:** Displayed in `/` and `/embed/listeners`

**Flow:**
1. User taps emoji (🛋️ Cozy, 🔥 Party, 🎧 Focus, 💭 Reflection)
2. Calls `/api/mood/submit` with selected mood
3. Shows toast confirmation
4. MoodMapOverlay picks up change within 5s

---

## Data Flow Summary

```
User taps mood emoji (MoodTap.tsx)
  ↓
POST /api/mood/submit
  ↓ (resolves IP → city)
GET /api/mood/get-city (ip-api.com)
  ↓
INSERT mood_changes (Supabase)
  ↓ (5s polling)
GET /api/mood/city-aggregates
  ↓
MoodMapOverlay updates cityMoods state
  ↓
CityMoodDot renders with new color + triple white flash
```

---

## Known Issues & Optimization Opportunities

### 1. **Coordinate Mismatch (FIXED)**
- **Problem:** Listener map returned country names, mood submissions saved city names
- **Solution:** Added `cities.ts` fallback database, now mood dots appear for all major cities

### 2. **Size Hierarchy**
- **Problem:** Mood dots (r=2.5) sometimes obscured by large listener dots (r≥3.5)
- **Current:** Mood overlays render ON TOP via z-index in MapOverlayManager
- **Future:** Consider fade-out animation on listener dots when mood dot appears

### 3. **Polling Frequency**
- **Current:** Listener map 30s, mood aggregates 5s
- **Future:** WebSocket for real-time mood updates (eliminate polling lag)

### 4. **City Name Normalization**
- **Current:** Case-insensitive string match
- **Future:** Fuzzy matching ("LA" → "Los Angeles", "NYC" → "New York")

### 5. **Mood Staleness**
- **Current:** 5-minute window for city aggregates
- **Future:** Fade-out animation after 10+ minutes without new mood

### 6. **Performance (Large Maps)**
- **Current:** Renders all land dots + all listener spots on every frame
- **Future:** Memoize static elements, only re-render dynamic overlays

### 7. **Mobile Responsiveness**
- **Current:** SVG scales via `viewBox` (works on mobile)
- **Future:** Touch gestures for pan/zoom, tap city for details modal

---

## Testing Commands

**Demo Mode (Fake Listeners):**
```
Visit: /?demo=1
Result: Shows 51 demo listeners across 10 cities
```

**Feature Flag Toggle:**
```sql
-- Enable mood tracker
UPDATE feature_flags 
SET enabled = true 
WHERE flag_name = 'mood_tracker_enabled';

-- Disable mood tracker
UPDATE feature_flags 
SET enabled = false 
WHERE flag_name = 'mood_tracker_enabled';
```

**Manual Mood Submission:**
```bash
curl -X POST http://localhost:3000/api/mood/submit \
  -H "Content-Type: application/json" \
  -H "x-forwarded-for: 8.8.8.8" \
  -d '{"mood": "party"}'
```

**Check City Aggregates:**
```bash
curl http://localhost:3000/api/mood/city-aggregates
```

---

## Next Steps for Optimization

1. **WebSocket Integration** - Replace polling with real-time Supabase subscriptions
2. **Mood Decay** - Fade old moods after 10min, remove after 30min
3. **City Clustering** - Group nearby cities when zoomed out
4. **Shows Integration** - Connect ShowsMapOverlay to real calendar data
5. **Analytics Dashboard** - Track mood trends by city/time/show
6. **Performance Profiling** - Measure render time with 1000+ listener dots
7. **A11y Improvements** - Keyboard navigation, screen reader support for SVG map

---

## Environment Setup Checklist

**Required:**
- ✅ `AZURACAST_URL` - Radio stream server
- ✅ `AZURACAST_API_KEY` - Admin key for listener data
- ✅ `AZURACAST_STATION_ID` - Station shortcode
- ✅ Supabase connection (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

**Supabase Tables:**
- ✅ `mood_changes` (with RLS policies)
- ✅ `feature_flags` (with `mood_tracker_enabled` row)

**Frontend Components:**
- ✅ `ListenerMap.tsx` - Main container
- ✅ `MoodMapOverlay.tsx` - Mood layer
- ✅ `CityMoodDot.tsx` - Individual mood dot
- ✅ `MoodTap.tsx` - Submission UI
- ✅ `cities.ts` - Fallback coordinates
- ✅ `worldDots.ts` - Base map data

**API Routes:**
- ✅ `/api/listeners-map` - Listener aggregation
- ✅ `/api/mood/submit` - Mood submission
- ✅ `/api/mood/city-aggregates` - City moods
- ✅ `/api/mood/get-city` - IP geolocation

---

## Console Debug Patterns

**Listener Map:**
```
[ListenerMap] Cities passed to MoodMapOverlay: ["Los Angeles", "New York", ...]
```

**Mood Overlay:**
```
[MoodMapOverlay] Fetched city moods: [{ city: "Los Angeles", mood: "cozy", ... }]
[MoodMapOverlay] New mood for Los Angeles: party (was: cozy)
[MoodMapOverlay] Using major cities DB for "Los Angeles"
```

**City Mood Dot:**
```
[CityMoodDot] Los Angeles: cozy → hsl(180 60% 50%) (2026-11-10T00:09:05Z)
```

**To troubleshoot:**
1. Check feature flag is enabled
2. Verify mood_changes table has recent rows for test city
3. Confirm city name spelling matches between submission and MAJOR_CITIES
4. Watch console for coordinate matching logs
5. Inspect element for `data-city`, `data-mood`, `data-timestamp` attributes

---

**End of Documentation**
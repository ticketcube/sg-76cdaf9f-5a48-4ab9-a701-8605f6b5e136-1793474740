Summary
The listener map becomes the OTW Live Map, one embed with two layers: who is listening right now, and where OTW artists play in the next 72 hours, with a ticket link on every show. It turns a vanity widget into a ticket-sales surface, which is the commerce loop onestowatch.live already measures (18,760 clicks, $12.3K in tickets from Sep 28 to Oct 27, 2026).
It ships in three phases over about 6 to 8 weeks. Phase 1 fixes the base and makes it look great on every screen. Phase 2 adds the shows layer. Phase 3 adds polish and links it to radio programming.
Three things need you before Phase 2: a Ticketmaster Discovery API key for the site's server, confirmation of which affiliate link source to use, and a go-ahead to retire the duplicate listener route that Softgen added (see Layer A).
Goals and principles
The map has to read at a glance on a 375px phone and still feel premium on a 1440px desktop. These rules hold in every phase:
1. Map first, list always. The map is the hero, but every marker also exists in a list, so the widget works for touch, keyboard and screen readers.
2. One embed, any size. The same page fits a phone column, a sidebar or a full-width hero. It adapts to the iframe's width, not the device, and reports its height to the auto-resize snippet.
3. Privacy by design. No IP address, user agent or exact location leaves the server. Listener spots are rounded to about 100 km, and a city is named only when 3 or more people share it.
4. Licensing safe. The map shows places and shows, never songs. It never shows what plays next, which keeps the no-advance-song-list rule.
5. Fast. The page loads in under 1 second on 4G, with no map library and no third-party tiles.
6. Keys stay server-side. AzuraCast and Ticketmaster keys live only in environment variables.
Layer A: live listeners
The listener layer already works, but it lives in two places that need to become one before anything new is built.
What exists today:
Piece
Where
State
/api/listeners-map + /embed/listeners
PR #7, not merged
Rounds locations to about 100 km and hides city names under 3 listeners
ListenerMap on the home page
main (Softgen)
Uses /api/analytics/listeners
/api/analytics/listeners
main (Softgen)
Sends exact coordinates and the city for every listener, even a single one
listeners.tsx, listeners-map.ts, worldDots.ts at the repo root
main (Softgen)
Stray copies, not used by the app
Fix first: keep one public route with the PR #7 privacy rules, point Softgen's ListenerMap at it, keep /api/analytics/listeners for the password-locked staff dashboard only, and delete the root copies.
Improvements:
• A soft white glow per spot, sized by listener count, so listeners read as "people" and shows (crimson) read as "places to go".
• A live count with a gentle tick animation when it changes, plus "peak today" from AzuraCast's history.
• Top cities shown as a chip row under the map, using only buckets of 3 or more listeners.
• Under 5 listeners total, show "Listening now" with no number, so a quiet hour never looks empty.
Layer B: OTW shows in the next 72 hours
Each city with an OTW roster artist playing in the next 72 hours gets a crimson pin. Tapping the pin shows that city's shows, each with a Buy tickets button.
Data source. The OTW roster has 905 artists, each matched to a Ticketmaster attraction. The site's server queries the Ticketmaster Discovery API for events by those attraction IDs between now and now + 72 hours. Querying 905 artists on every page view is too slow, so the work is split:
1. Roster map (daily): match each roster artist to a Ticketmaster attraction ID and store the result in a JSON file or Supabase table.
2. Show window (every 15 minutes): fetch events for all matched IDs in batches, filtered to the 72-hour window, and cache the result.
3. Request: /api/map/shows serves the cached window in milliseconds.
What each show carries: artist, venue, city, local date and time, a price range when known, and the ticket link.
Rules:
• Hide shows that are sold out on both primary and resale, cancelled, postponed or off sale. Show "Resale only" when only resale is left.
• Use the affiliate ticket link, not the raw Ticketmaster URL, so OTW gets its commission. Tag links with UTM parameters, such as utm_source=otw_map.
• Start with the US only, to match the US-only radio launch.
• When a show is in the OTW.live pilot, add an "On air live" badge. Never add a replay link: live shows are live only.
Card copy: relative times read best, such as "Tonight 8:00 PM", "Tomorrow 7:30 PM" or "Sat 9:00 PM", in the venue's local time.
Design system and responsive layouts
The look stays in the site's design system: crimson (HSL 348 100% 54%) on near-black, Sora for headings, IBM Plex Sans for body text and IBM Plex Mono for numbers and times.
Visual language:
• Land: the existing dot matrix at 20% white. It looks like a radio-era signal map and needs no map tiles.
• Listeners: soft white dots with a slow 3-second pulse, sized by count.
• Shows: crimson diamond pins with a count badge when a city has more than one show. Listeners and shows differ by shape as well as colour, so the map still works for colour-blind viewers.
• Tonight: shows starting within 12 hours get a brighter ring, so tonight stands out from the rest of the 72 hours.
• Default view: the US, to match the launch market. A World toggle shows global listeners.
Layouts by embed width (container queries, not device detection):
Embed width
Layout
Show list
Under 480px (phones, narrow columns)
Map on top, 16:10, US view
Swipeable cards under the map, then a "See all 72h shows" sheet
480 to 900px (tablets, article columns)
Map full width, 2:1
A horizontal scroll row of show cards
Over 900px (desktop hero)
Map takes two thirds, list in a right-hand rail
A grouped list by day: Tonight, Tomorrow, then the third day
Wireframes only: the blue marks stand for the site's crimson show pins and Buy buttons, and the grey dots for listener glows.
Every layout has a header with the live listener count and a segmented control for Listeners, Shows and Both. Touch targets are at least 44px, and nothing scrolls sideways except the card row.
Interaction design
Every action works with a tap, a click or a key, and nothing important hides behind hover.
Action
Phone
Desktop
See a city's shows
Tap the pin to open a bottom sheet
Click the pin to open a popover; the rail scrolls to that city
See a listener spot
Tap for "Chicago: 6 listening"
Hover or focus shows the same tooltip
Buy tickets
A full-width crimson button on the card that opens in a new tab
Same
Switch layers
Segmented control: Listeners, Shows, Both
Same
Switch region
US or World toggle; tapping a crowded area zooms 2x
Same, plus scroll-wheel zoom with Ctrl held
Accessibility:
• The map has an accessible name, such as "42 people listening, 9 OTW shows in the next 72 hours". The list underneath is the full equivalent for screen readers.
• Pins can be reached with Tab and opened with Enter. Escape closes a sheet or popover.
• When the system asks for reduced motion, the pulses stop and dots stay still.
• Text contrast is at least 4.5:1 on the near-black card.
Empty and error states: with no shows in 72 hours, the Shows layer says "No OTW shows in the next 3 days" and links to the full tour list on onestowatch.com. When AzuraCast or Ticketmaster is down, that layer hides quietly and the other one keeps working.
Technical architecture
The browser only talks to the site's own routes. Keys, IPs and the raw Ticketmaster feed never reach it.
• Map rendering: no map library and no tiles. The land is one pre-built SVG path and markers are plain SVG, so the whole widget stays small and sharp at any size.
• Caching: listeners are cached for 30 seconds and shows for 15 minutes, both on the server and with s-maxage at the CDN. The embed polls every 30 seconds.
• Embed options: ?layers=listeners,shows, ?view=us|world, ?compact=1 and ?bg=transparent. The page posts otw:resize so the onestowatch.com snippet sizes it.
• New environment variables: TICKETMASTER_API_KEY and an affiliate ID, server only.
Roadmap
The whole plan takes about 6 to 8 weeks. Each phase ships on its own.
1. Phase 1: one map, looks great (1 to 2 weeks).
    ◦ Merge PR #7, retire the duplicate public route, and point the home page ListenerMap at the privacy-safe public route.
    ◦ Build the responsive shell: container-query layouts, the header, the layer control and the US or World toggle.
    ◦ Draw the land as one SVG path instead of 3,820 circles, for faster rendering on phones.
    ◦ Gate: the map looks right at 320, 375, 768 and 1440px, and the page loads in under 1 second on 4G.
2. Phase 2: shows layer (2 to 3 weeks).
    ◦ Build the daily roster-to-attraction match, the 15-minute show cache and /api/map/shows.
    ◦ Add show pins, cards, the bottom sheet and the desktop rail, using affiliate links with UTM tags.
    ◦ Gate: shows in the 72-hour window match Ticketmaster for 10 spot-checked artists, and every Buy link resolves.
3. Phase 3: polish and programming tie-ins (2 to 3 weeks).
    ◦ Add the "On air live" badge for OTW.live pilot shows and the "Tonight" ring.
    ◦ Add click tracking per show, the peak-listeners figure, and links from each card to the artist's OTW page.
    ◦ Gate: ticket click-through from the map is measured for 2 weeks.
Metrics, risks and open decisions
Metrics to watch (targets to set after 2 weeks of baseline data):
• Ticket clicks from the map per 1,000 embed views, and orders attributed through the affiliate link.
• Pin opens per view, and the share of views that switch layers.
• Page load time on phones (p75) and embed error rate.
Risks:
Risk
Mitigation
Wrong artist match (a common name maps to the wrong Ticketmaster attraction)
Match on Spotify ID where AIMC has it, and keep a manual override list
Ticketmaster rate limits (about 5 requests a second on the public tier)
Batch attraction IDs, refresh every 15 minutes, and serve only from cache
A quiet map in the first weeks
Default to the US view, show cities only, and hide the count under 5
Privacy complaints
Round to about 100 km and name cities only at 3+ listeners; no IPs ever leave the server
Open decisions:
• Which Ticketmaster key and affiliate account the site's server uses. The Ticketmaster connector used here already returns affiliate links, but the site needs its own server-side key.
• Whether the map covers shows outside the US at launch, or US only (recommended).
• Whether the map replaces the home page ListenerMap or sits beside it as /embed/map. Recommended: one component used in both places.
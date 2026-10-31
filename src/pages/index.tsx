export default function HomePage() {
  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto section-spacing">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-8 bg-gradient-hero rounded-2xl">
          <h1 className="page-title">
            OTW Radio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The 24/7 home for Ones To Watch artists. Live premieres, exclusive interviews, and curated programming around the clock.
          </p>
        </section>

        {/* Currently Playing */}
        <section className="feature-card">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="section-title">Currently Playing</h2>
              <span className="live-indicator bg-primary text-primary-foreground px-3 py-1 rounded">
                LIVE
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <span className="time-badge-live">05:00 PM - 12:00 AM</span>
                <span className="font-medium text-lg">OTW Playlist</span>
              </div>
              <p className="text-muted-foreground">
                Non-stop music from the Ones To Watch roster, featuring new releases, deep cuts, and artist favorites.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">24/7</div>
            <div className="stat-label">Live Stream</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">100+</div>
            <div className="stat-label">Artists</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">5</div>
            <div className="stat-label">Daily Blocks</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">∞</div>
            <div className="stat-label">Good Vibes</div>
          </div>
        </section>

        {/* Schedule Grid */}
        <section className="space-y-6">
          <h2 className="section-title">Coming Up</h2>
          <div className="schedule-grid">
            <div className="schedule-item">
              <span className="time-badge">12:00 AM</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">OTW Playlist</p>
                <p className="text-sm text-muted-foreground">Overnight Mix</p>
              </div>
            </div>
            
            <div className="schedule-item">
              <span className="time-badge">05:00 AM</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">OTW Playlist</p>
                <p className="text-sm text-muted-foreground">Morning Drive</p>
              </div>
            </div>
            
            <div className="schedule-item">
              <span className="time-badge">10:00 AM</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold status-live">Artist Interview</p>
                <p className="text-sm text-muted-foreground">This Friday</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Content */}
        <section className="space-y-6">
          <h2 className="section-title">This Week&apos;s Features</h2>
          <div className="artist-grid">
            <div className="artist-card">
              <div className="video-container mb-4">
                <div className="video-overlay">
                  <p className="text-sm font-semibold">Live Premiere</p>
                </div>
              </div>
              <h3 className="font-semibold mb-1">Artist Interview</h3>
              <p className="text-sm text-muted-foreground">Friday, 10:00 AM - 12:00 PM</p>
            </div>
            
            <div className="artist-card">
              <div className="video-container mb-4 bg-accent/50">
                <div className="video-overlay">
                  <p className="text-sm font-semibold">Special Mix</p>
                </div>
              </div>
              <h3 className="font-semibold mb-1">Curated Playlist</h3>
              <p className="text-sm text-muted-foreground">Saturday, 2:00 PM - 5:00 PM</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
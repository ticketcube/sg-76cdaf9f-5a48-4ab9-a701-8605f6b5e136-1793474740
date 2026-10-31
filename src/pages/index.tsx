export default function HomePage() {
  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <section className="text-center space-y-4">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight">
            OTW Radio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The 24/7 home for Ones To Watch artists. Live premieres, exclusive interviews, and curated programming around the clock.
          </p>
        </section>

        <section className="bg-card border border-border rounded-lg p-8 space-y-4">
          <h2 className="font-display text-2xl font-semibold">Currently Playing</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-mono">05:00 PM - 12:00 AM</span>
              <span className="text-sm font-medium">OTW Playlist</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Non-stop music from the Ones To Watch roster, featuring new releases, deep cuts, and artist favorites.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <h3 className="font-display text-lg font-semibold">Coming Up Next</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap mt-0.5">12:00 AM</span>
                <div>
                  <p className="text-sm font-medium">OTW Playlist</p>
                  <p className="text-xs text-muted-foreground">Overnight Mix</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <h3 className="font-display text-lg font-semibold">This Week</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs text-primary whitespace-nowrap mt-0.5">FRI</span>
                <div>
                  <p className="text-sm font-medium">Artist Interview</p>
                  <p className="text-xs text-muted-foreground">10:00 AM - 12:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, Radio, Music, MapPin, Clock, BarChart3 } from "lucide-react";

interface SongPlay {
  title: string;
  artist: string;
  plays: number;
}

interface ReportData {
  overview: {
    total_listeners: number;
    unique_listeners: number;
    average_listeners: number;
    peak_listeners: number;
  };
  top_songs: SongPlay[];
  hourly_listeners: Array<{
    hour: number;
    listeners: number;
  }>;
}

interface ListenerLocation {
  description: string;
  location: {
    lat: number;
    lon: number;
  };
  listeners: number;
}

interface ListenersData {
  total: number;
  unique: number;
  current: ListenerLocation[];
}

function AnalyticsContent() {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [listeners, setListeners] = useState<ListenersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let start: Date;
        
        switch (timeRange) {
          case "today":
            start = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            start = new Date(now.setDate(now.getDate() - 7));
            break;
          case "month":
            start = new Date(now.setDate(now.getDate() - 30));
            break;
        }

        const params = new URLSearchParams({
          start: Math.floor(start.getTime() / 1000).toString(),
          end: Math.floor(Date.now() / 1000).toString()
        });

        const [reportsRes, listenersRes] = await Promise.all([
          fetch(`/api/analytics/reports?${params}`),
          fetch("/api/analytics/listeners")
        ]);

        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData);
        }

        if (listenersRes.ok) {
          const listenersData = await listenersRes.json();
          setListeners(listenersData);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(() => {
      fetch("/api/analytics/listeners")
        .then(res => res.json())
        .then(data => setListeners(data))
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-foreground font-sans">Analytics Dashboard</h1>
          <div className="text-muted">Loading analytics data...</div>
        </div>
      </div>
    );
  }

  const maxHourlyListeners = reports?.hourly_listeners 
    ? Math.max(...reports.hourly_listeners.map(h => h.listeners))
    : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground font-sans">Analytics Dashboard</h1>
          <div className="flex gap-2">
            <Button
              variant={timeRange === "today" ? "default" : "outline"}
              onClick={() => setTimeRange("today")}
              size="sm"
            >
              Today
            </Button>
            <Button
              variant={timeRange === "week" ? "default" : "outline"}
              onClick={() => setTimeRange("week")}
              size="sm"
            >
              7 Days
            </Button>
            <Button
              variant={timeRange === "month" ? "default" : "outline"}
              onClick={() => setTimeRange("month")}
              size="sm"
            >
              30 Days
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-accent/50 border-muted/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Radio className="h-5 w-5 text-primary" />
              <span className="text-muted text-sm">Current Listeners</span>
            </div>
            <div className="text-4xl font-bold font-mono text-foreground">
              {listeners?.total || 0}
            </div>
          </Card>

          <Card className="bg-accent/50 border-muted/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-muted text-sm">Total Listeners</span>
            </div>
            <div className="text-4xl font-bold font-mono text-foreground">
              {reports?.overview.total_listeners || 0}
            </div>
          </Card>

          <Card className="bg-accent/50 border-muted/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-muted text-sm">Peak Listeners</span>
            </div>
            <div className="text-4xl font-bold font-mono text-foreground">
              {reports?.overview.peak_listeners || 0}
            </div>
          </Card>

          <Card className="bg-accent/50 border-muted/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-muted text-sm">Avg Listeners</span>
            </div>
            <div className="text-4xl font-bold font-mono text-foreground">
              {Math.round(reports?.overview.average_listeners || 0)}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-accent/50 border-muted/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground font-sans">Hourly Activity</h2>
            </div>
            <div className="space-y-2">
              {reports?.hourly_listeners.map((hour) => (
                <div key={hour.hour} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted w-16">
                    {hour.hour.toString().padStart(2, "0")}:00
                  </span>
                  <div className="flex-1 h-8 bg-muted/20 rounded-md overflow-hidden">
                    <div
                      className="h-full bg-primary/50 transition-all"
                      style={{
                        width: maxHourlyListeners > 0 
                          ? `${(hour.listeners / maxHourlyListeners) * 100}%` 
                          : "0%"
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono text-foreground w-12 text-right">
                    {hour.listeners}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-accent/50 border-muted/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground font-sans">Live Locations</h2>
            </div>
            <div className="space-y-3">
              {listeners?.current.length === 0 ? (
                <div className="text-muted text-sm">No active listeners</div>
              ) : (
                listeners?.current
                  .sort((a, b) => b.listeners - a.listeners)
                  .map((location, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-foreground/90 truncate flex-1">
                        {location.description}
                      </span>
                      <span className="font-mono text-sm text-primary ml-2">
                        {location.listeners}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>

        <Card className="bg-accent/50 border-muted/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Music className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground font-sans">Top Tracks</h2>
          </div>
          <div className="space-y-3">
            {reports?.top_songs.length === 0 ? (
              <div className="text-muted text-sm">No play data available</div>
            ) : (
              reports?.top_songs.map((song, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-muted/10">
                  <span className="font-mono text-2xl text-muted/50 w-8">
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{song.title}</div>
                    <div className="text-sm text-muted">{song.artist}</div>
                  </div>
                  <span className="font-mono text-sm text-primary">
                    {song.plays} {song.plays === 1 ? "play" : "plays"}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute requireAdmin>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}
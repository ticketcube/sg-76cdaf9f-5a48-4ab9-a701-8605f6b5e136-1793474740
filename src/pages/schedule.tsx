import { Badge } from "@/components/ui/badge";

const dailySchedule = [
  {
    time: "12:00 AM - 5:00 AM",
    block: "OTW Playlist",
    description: "Overnight Mix - Deep cuts and artist favorites"
  },
  {
    time: "5:00 AM - 10:00 AM",
    block: "OTW Playlist",
    description: "Morning Drive - Fresh releases and rising artists"
  },
  {
    time: "10:00 AM - 12:00 PM",
    block: "Weekly Feature",
    description: "Rotating programming (see below)",
    isFeature: true
  },
  {
    time: "12:00 PM - 3:00 PM",
    block: "Guest Curator",
    description: "Invited artists, producers, and tastemakers curate sets",
    isFeature: true
  },
  {
    time: "3:00 PM - 5:00 PM",
    block: "Weekly Feature Repeat",
    description: "Encore presentation of the morning feature",
    isFeature: true
  },
  {
    time: "5:00 PM - 12:00 AM",
    block: "OTW Playlist",
    description: "Evening Mix - The full OTW roster on rotation"
  }
];

const weeklyFeatures = [
  {
    day: "Monday",
    title: "OTW Recap",
    description: "Highlights from the past week, new releases, and trending tracks"
  },
  {
    day: "Tuesday",
    title: "Chef's Choice",
    description: "OTW editorial team picks deep cuts and hidden gems"
  },
  {
    day: "Wednesday",
    title: "Touring Artists",
    description: "Spotlight on OTW artists currently on tour with live recordings and interviews"
  },
  {
    day: "Thursday",
    title: "Girls Who Like Making Music With Like Girls",
    description: "Celebrating female and non-binary artists in the OTW community"
  },
  {
    day: "Friday",
    title: "Artist Interview",
    description: "In-depth conversations with OTW roster artists about their craft and creative process"
  }
];

function getCurrentBlock() {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const hour = et.getHours();

  if (hour >= 0 && hour < 5) return 0;
  if (hour >= 5 && hour < 10) return 1;
  if (hour >= 10 && hour < 12) return 2;
  if (hour >= 12 && hour < 15) return 3;
  if (hour >= 15 && hour < 17) return 4;
  return 5;
}

export default function SchedulePage() {
  const currentBlock = getCurrentBlock();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });

  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto section-spacing">
        <section className="text-center space-y-4 mb-12">
          <h1 className="page-title">Programming Schedule</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All times Eastern Time (ET). Same schedule every day with rotating weekly features.
          </p>
        </section>

        <section className="feature-card mb-12">
          <h2 className="section-title mb-6">Daily Schedule</h2>
          <div className="space-y-4">
            {dailySchedule.map((item, index) => (
              <div
                key={index}
                className={`schedule-item ${
                  currentBlock === index ? "bg-accent/50 border-primary" : ""
                }`}
              >
                <span className={`time-badge ${currentBlock === index ? "time-badge-live" : ""}`}>
                  {item.time}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{item.block}</p>
                    {currentBlock === index && (
                      <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                        LIVE
                      </Badge>
                    )}
                    {item.isFeature && (
                      <Badge variant="outline" className="font-mono text-xs">
                        FEATURE
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="feature-card">
          <h2 className="section-title mb-6">Weekly Features (10:00 AM - 12:00 PM ET)</h2>
          <div className="space-y-4">
            {weeklyFeatures.map((feature) => (
              <div
                key={feature.day}
                className={`schedule-item ${
                  feature.day === today ? "bg-accent/50 border-primary" : ""
                }`}
              >
                <span className={`time-badge ${feature.day === today ? "time-badge-live" : ""}`}>
                  {feature.day}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{feature.title}</p>
                    {feature.day === today && (
                      <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                        TODAY
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
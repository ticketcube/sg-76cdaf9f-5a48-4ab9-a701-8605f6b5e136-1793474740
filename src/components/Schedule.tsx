"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScheduleBlock {
  start: string;
  end: string;
  block: string;
  airing?: string;
  playlist_id?: string | null;
  playlist_name?: string | null;
  playlist_description?: string | null;
}

interface ScheduleData {
  station: {
    name: string;
    timezone: string;
  };
  daily: ScheduleBlock[];
  blocks: {
    [key: string]: {
      title: string;
      description: string;
    };
  };
  features: {
    [key: string]: {
      title: string;
      description: string;
      proposed?: boolean;
    };
  };
  debug?: {
    azuracast_playlists_count: number;
    azuracast_playlists: Array<{
      id: number;
      name: string;
      schedule_items_count: number;
    }>;
  };
}

interface WeeklyFeature {
  day: string;
  title: string;
  description: string;
}

const weeklyFeatures: WeeklyFeature[] = [
  {
    day: "Monday",
    title: "OTW Weekly Recap",
    description: "The week in OTW: news, releases and clips."
  },
  {
    day: "Tuesday",
    title: "Chef's Choice",
    description: "Curator picks from the OTW editorial team."
  },
  {
    day: "Wednesday",
    title: "OTW Touring Artists",
    description: "Artists on the road this week, with their tour dates."
  },
  {
    day: "Thursday",
    title: "GWLMMWLG",
    description: "Girls Who Like Making Music With Like Girls - celebrating female and non-binary artists."
  },
  {
    day: "Friday",
    title: "Artist Interview",
    description: "One long-form artist interview."
  }
];

function getCurrentBlock(schedule: ScheduleBlock[]): number {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const currentTime = et.getHours() * 100 + et.getMinutes();

  for (let i = 0; i < schedule.length; i++) {
    const start = parseInt(schedule[i].start);
    const end = parseInt(schedule[i].end);
    if (currentTime >= start && currentTime < end) {
      return i;
    }
  }
  return -1;
}

function formatTime(time: string): string {
  const hour = parseInt(time.substring(0, 2));
  const minute = time.substring(2);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

export function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [currentBlock, setCurrentBlock] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchSchedule = async () => {
      try {
        const response = await fetch("/api/schedule");
        if (!response.ok) return;
        const data = await response.json();
        setSchedule(data);
        setCurrentBlock(getCurrentBlock(data.daily));
      } catch (error) {
        console.warn("Failed to load schedule:", error);
      }
    };

    fetchSchedule();
    const interval = setInterval(() => {
      if (schedule) {
        setCurrentBlock(getCurrentBlock(schedule.daily));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [mounted, schedule]);

  if (!mounted || !schedule) {
    return (
      <div className="bg-card rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", timeZone: "America/New_York" });

  return (
    <div className="bg-card rounded-2xl overflow-hidden">
      {schedule?.debug && (
        <div className="border-b border-border p-4 bg-muted/50">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDebug ? "▼" : "▶"} Debug: {schedule.debug.azuracast_playlists_count} playlists from AzuraCast
          </button>
          {showDebug && (
            <div className="mt-3 space-y-2 text-xs font-mono">
              {schedule.debug.azuracast_playlists.map((p) => (
                <div key={p.id} className="bg-background p-2 rounded border border-border">
                  <div className="font-semibold">#{p.id}: {p.name}</div>
                  <div className="text-muted-foreground">Schedule items: {p.schedule_items_count}</div>
                </div>
              ))}
              <div className="mt-4 bg-background p-2 rounded border border-border">
                <div className="font-semibold mb-2">Matched slots:</div>
                {schedule.daily.map((slot, i) => (
                  <div key={i} className="text-muted-foreground">
                    {slot.start}-{slot.end}: {slot.playlist_name || "❌ No match"}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-14 px-6">
          <TabsTrigger value="today" className="font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Today
          </TabsTrigger>
          <TabsTrigger value="week" className="font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            This Week
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="p-6 space-y-3 m-0">
          {schedule.daily.map((item, index) => {
            const blockInfo = schedule.blocks[item.block];
            const isActive = currentBlock === index;
            const isFeature = item.block === "weekly_feature" || item.block === "guest_curator";

            return (
              <div
                key={index}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  isActive ? "bg-accent/50 border-primary" : "border-border hover:bg-accent/20"
                }`}
              >
                <div className={`shrink-0 text-sm font-mono px-3 py-1 rounded-full ${
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {formatTime(item.start)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{blockInfo?.title || item.block}</p>
                    {isActive && (
                      <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                        LIVE
                      </Badge>
                    )}
                    {isFeature && (
                      <Badge variant="outline" className="font-mono text-xs">
                        FEATURE
                      </Badge>
                    )}
                    {item.airing === "repeat" && (
                      <Badge variant="outline" className="font-mono text-xs">
                        ENCORE
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {blockInfo?.description || ""}
                  </p>
                  {item.playlist_name && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-sm font-medium text-foreground">
                        Playing: {item.playlist_name}
                      </p>
                      {item.playlist_description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.playlist_description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="week" className="p-6 space-y-3 m-0">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Weekly Features (10:00 AM - 12:00 PM ET)
            </h3>
            <p className="text-sm text-muted-foreground">
              Each weekday features a different curated program, premiered at 10am and repeated at 3pm.
            </p>
          </div>
          {weeklyFeatures.map((feature) => {
            const isToday = feature.day === today;

            return (
              <div
                key={feature.day}
                className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                  isToday ? "bg-accent/50 border-primary" : "border-border hover:bg-accent/20"
                }`}
              >
                <div className={`shrink-0 text-sm font-mono px-3 py-1 rounded-full min-w-[80px] text-center ${
                  isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {feature.day}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{feature.title}</p>
                    {isToday && (
                      <Badge className="bg-primary text-primary-foreground font-mono text-xs">
                        TODAY
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  STATION_TZ,
  UnifiedScheduleDay,
  UnifiedScheduleItem,
  UnifiedScheduleResponse,
  formatDay,
  formatTime,
} from "@/lib/schedule";

// Unified OTW Radio schedule: AzuraCast playlists, streamer (DJ/host) slots and
// unscheduled live takeovers on one timeline per day, in station time (ET).
// Data comes from /api/schedule, which talks to AzuraCast server-side.

const REFRESH_MS = 5 * 60 * 1000; // re-fetch the schedule
const TICK_MS = 30 * 1000; // move the "on now" marker

const TYPE_LABEL: Record<UnifiedScheduleItem["type"], string> = {
  playlist: "PLAYLIST",
  streamer: "LIVE SHOW",
  live: "LIVE",
  rotation: "ROTATION",
};

interface ScheduleProps {
  /** Compact layout for /embed/schedule on onestowatch.com. */
  embed?: boolean;
}

export function Schedule({ embed = false }: ScheduleProps) {
  const [data, setData] = useState<UnifiedScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null); // null until mounted: avoids SSR mismatch
  const [day, setDay] = useState<string>("");

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/schedule", { signal });
      if (!res.ok) throw new Error(`Schedule request failed (${res.status})`);
      const json: UnifiedScheduleResponse = await res.json();
      setData(json);
      setError(null);
      setDay((current) => (current && json.days.some((d) => d.date === current) ? current : json.days[0]?.date ?? ""));
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.warn("Failed to load schedule:", err);
      setError("Schedule is unavailable right now.");
    }
  }, []);

  // Fetch once on mount, then every few minutes. No dependency on `data`, so a
  // new response never restarts the effect (the old bug: an endless fetch loop).
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const refresh = setInterval(() => load(), REFRESH_MS);
    return () => {
      controller.abort();
      clearInterval(refresh);
    };
  }, [load]);

  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(tick);
  }, []);

  if (error && !data) {
    return (
      <div className="bg-card rounded-2xl p-6 text-center space-y-3">
        <p className="text-muted-foreground">{error}</p>
        <button onClick={() => load()} className="text-sm font-mono text-primary hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!data || now === null) {
    return (
      <div className="bg-card rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const tz = data.station.timezone || STATION_TZ;

  return (
    <div className="bg-card rounded-2xl overflow-hidden">
      {data.live.isLive && (
        <div className="flex items-center gap-2 px-6 py-3 bg-primary/10 border-b border-primary/30">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-sm">
            ON AIR NOW{data.live.streamerName ? `: ${data.live.streamerName}` : ""}
          </span>
        </div>
      )}

      <Tabs value={day} onValueChange={setDay} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto rounded-none border-b bg-transparent h-14 px-4 gap-1">
          {data.days.map((d, i) => (
            <TabsTrigger
              key={d.date}
              value={d.date}
              className="font-semibold shrink-0 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
            >
              {i === 0 ? "Today" : formatDay(d.date, "short")}
            </TabsTrigger>
          ))}
        </TabsList>

        {data.days.map((d) => (
          <TabsContent key={d.date} value={d.date} className={`${embed ? "p-4" : "p-6"} space-y-3 m-0`}>
            <DayHeader day={d} tz={tz} />
            {d.items.map((item) => (
              <ScheduleRow key={item.key} item={item} now={now} tz={tz} compact={embed} />
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {!data.azuracastOk && (
        <p className="px-6 pb-4 text-xs font-mono text-muted-foreground">
          Could not reach the station schedule. Showing the default rotation.
        </p>
      )}
    </div>
  );
}

function DayHeader({ day, tz }: { day: UnifiedScheduleDay; tz: string }) {
  const shows = day.items.filter((i) => i.type === "streamer" || i.type === "live").length;
  const playlists = day.items.filter((i) => i.type === "playlist").length;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1">
      <h3 className="font-semibold">{formatDay(day.date, "long")}</h3>
      <p className="text-xs font-mono text-muted-foreground">
        {playlists} scheduled playlist{playlists === 1 ? "" : "s"} · {shows} live show{shows === 1 ? "" : "s"} ·{" "}
        {tz === STATION_TZ ? "ET" : tz}
      </p>
    </div>
  );
}

function ScheduleRow({
  item,
  now,
  tz,
  compact,
}: {
  item: UnifiedScheduleItem;
  now: number;
  tz: string;
  compact: boolean;
}) {
  const isNow = item.start <= now && now < item.end;
  const isPast = item.end <= now;
  const isLiveType = item.type === "streamer" || item.type === "live";

  return (
    <div
      className={`flex items-start gap-4 ${compact ? "p-3" : "p-4"} rounded-lg border transition-colors ${
        isNow ? "bg-accent/50 border-primary" : "border-border hover:bg-accent/20"
      } ${isPast ? "opacity-50" : ""}`}
    >
      <div
        className={`shrink-0 text-sm font-mono px-3 py-1 rounded-full text-center min-w-[96px] ${
          isNow ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {formatTime(item.start, tz)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-semibold truncate">{item.title}</p>
          {isNow && <Badge className="bg-primary text-primary-foreground font-mono text-xs">ON NOW</Badge>}
          <Badge
            variant="outline"
            className={`font-mono text-xs ${isLiveType ? "border-primary text-primary" : "text-muted-foreground"}`}
          >
            {TYPE_LABEL[item.type]}
          </Badge>
        </div>
        <p className="text-xs font-mono text-muted-foreground">
          {item.continuesFromPreviousDay ? "Continues · " : ""}
          {formatTime(item.start, tz)} to {formatTime(item.end, tz)}
        </p>
        {item.description && !compact && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
      </div>
    </div>
  );
}

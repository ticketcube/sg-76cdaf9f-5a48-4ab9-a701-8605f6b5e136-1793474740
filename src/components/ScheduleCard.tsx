import { useState } from "react";
import { ChevronDown, ChevronUp, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSchedule } from "@/hooks/useSchedule";
import { STATION_TZ, UnifiedScheduleItem, formatDay, formatTime } from "@/lib/schedule";

// OTW Radio schedule in the same visual language as the embed player:
// a bg-accent rounded-lg p-4 card, max-w-md, small type, crimson primary.
//
//   <ScheduleCard variant="attached" />    under the player: on now + up next,
//                                          expands in place to the rest of today.
//   <ScheduleCard variant="standalone" />  its own widget: day picker + the
//                                          whole day (used by /embed/schedule).
//
// Data: /api/schedule (AzuraCast playlists, streamer slots and live takeovers,
// station time). Playlist and show names only, never upcoming song titles.

type Variant = "attached" | "standalone";

interface ScheduleCardProps {
  variant?: Variant;
  /** Attached only: how many items to show after the one on now. */
  upNext?: number;
  className?: string;
}

const TYPE_LABEL: Record<UnifiedScheduleItem["type"], string> = {
  playlist: "Playlist",
  streamer: "Live show",
  live: "Live",
  rotation: "OTW Playlist",
};

export function ScheduleCard({ variant = "standalone", upNext = 3, className = "" }: ScheduleCardProps) {
  const { data, error, now, reload } = useSchedule();
  const [expanded, setExpanded] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);

  const shell = `bg-accent rounded-lg p-4 ${className}`;

  if (error && !data) {
    return (
      <div className={shell}>
        <Header tzLabel="ET" />
        <div className="flex items-center justify-between gap-3 mt-3">
          <p className="text-muted-foreground text-xs">Schedule is unavailable right now.</p>
          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={reload}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data || now === null) {
    return (
      <div className={shell}>
        <div className="h-4 bg-muted rounded animate-pulse w-1/3 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 mb-3 last:mb-0">
            <div className="h-3 bg-muted rounded animate-pulse w-14" />
            <div className="h-3 bg-muted rounded animate-pulse flex-1" />
          </div>
        ))}
      </div>
    );
  }

  const tz = data.station.timezone || STATION_TZ;
  const tzLabel = tz === STATION_TZ ? "ET" : tz;
  const offline = !data.azuracastOk ? (
    <p className="mt-3 text-[11px] font-mono text-muted-foreground">Showing the default rotation.</p>
  ) : null;

  if (variant === "attached") {
    const today = data.days[0]?.items ?? [];
    const tomorrow = data.days[1]?.items ?? [];
    const todayEnd = data.days[0]?.end ?? Infinity;
    // Rest of today, rolling into tomorrow so late-night listeners still see what's next.
    const ahead = [...today, ...tomorrow].filter((i) => i.end > now);
    const visible = expanded ? today.filter((i) => i.end > now) : ahead.slice(0, upNext + 1);
    const canExpand = today.filter((i) => i.end > now).length > upNext + 1;

    return (
      <div className={shell}>
        <Header tzLabel={tzLabel} isLive={data.live.isLive} streamerName={data.live.streamerName} />
        <ul className="mt-3 space-y-1">
          {visible.map((item) => (
            <Row key={item.key} item={item} now={now} tz={tz} tomorrow={item.start >= todayEnd} />
          ))}
        </ul>
        {canExpand && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Show less" : "Rest of today"}
          </button>
        )}
        {offline}
      </div>
    );
  }

  const day = data.days[Math.min(dayIndex, data.days.length - 1)];

  return (
    <div className={shell}>
      <Header tzLabel={tzLabel} isLive={data.live.isLive} streamerName={data.live.streamerName} />

      <div className="mt-3 -mx-1 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Day">
        {data.days.map((d, i) => (
          <button
            key={d.date}
            role="tab"
            aria-selected={i === dayIndex}
            onClick={() => setDayIndex(i)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              i === dayIndex
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-background/40"
            }`}
          >
            {i === 0 ? "Today" : formatDay(d.date, "short")}
          </button>
        ))}
      </div>

      <ul className="mt-2 space-y-1">
        {day?.items.map((item) => (
          <Row key={item.key} item={item} now={now} tz={tz} />
        ))}
      </ul>
      {offline}
    </div>
  );
}

function Header({
  tzLabel,
  isLive = false,
  streamerName = null,
}: {
  tzLabel: string;
  isLive?: boolean;
  streamerName?: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <Radio className="h-4 w-4 text-primary shrink-0" />
        <span className="font-semibold text-foreground text-sm">Schedule</span>
        {isLive && (
          <span className="flex items-center gap-1.5 min-w-0 text-[11px] font-mono text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="truncate">ON AIR{streamerName ? `: ${streamerName}` : ""}</span>
          </span>
        )}
      </div>
      <span className="text-[11px] font-mono text-muted-foreground shrink-0">All times {tzLabel}</span>
    </div>
  );
}

function Row({
  item,
  now,
  tz,
  tomorrow = false,
}: {
  item: UnifiedScheduleItem;
  now: number;
  tz: string;
  tomorrow?: boolean;
}) {
  const isNow = item.start <= now && now < item.end;
  const isPast = item.end <= now;
  const isLiveType = item.type === "streamer" || item.type === "live";

  return (
    <li
      className={`flex items-center gap-3 rounded-md px-2 py-2 ${
        isNow ? "bg-primary/10 ring-1 ring-primary/40" : ""
      } ${isPast ? "opacity-40" : ""}`}
    >
      <span
        className={`w-16 shrink-0 font-mono text-xs ${isNow ? "text-primary" : "text-muted-foreground"}`}
      >
        {isNow ? "NOW" : formatTime(item.start, tz)}
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground text-sm truncate">{item.title}</div>
        <div className="text-muted-foreground text-xs truncate">
          {tomorrow && "Tomorrow · "}
          {isNow ? `Until ${formatTime(item.end, tz)}` : `${formatTime(item.start, tz)} to ${formatTime(item.end, tz)}`}
          {item.type !== "rotation" && ` · ${TYPE_LABEL[item.type]}`}
        </div>
      </div>
      {isLiveType && <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Live" />}
    </li>
  );
}

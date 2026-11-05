import { useEffect, useRef, useState } from "react";
import { Radio } from "lucide-react";

interface ScheduleItem {
    start: string;
    end: string;
    start_timestamp?: number;
    end_timestamp?: number;
    name: string;
    description?: string;
    is_now: boolean;
    type: string;
    parsed_time?: { hours: number; minutes: number; time24: number };
}

interface ScheduleData {
    today: ScheduleItem[];
    week?: Record<string, ScheduleItem[]>;
    current_day: string;
    timezone: string;
}

type Tab = "today" | "week";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TZ = "America/Los_Angeles";

function formatTime(item: ScheduleItem): string {
    const t = item.parsed_time;
    if (t) {
        const period = t.hours >= 12 ? "PM" : "AM";
        const h = t.hours === 0 ? 12 : t.hours > 12 ? t.hours - 12 : t.hours;
        return `${h}:${String(t.minutes).padStart(2, "0")} ${period}`;
    }
    // Week items: use timestamp if available, otherwise parse start string
    if (item.start_timestamp) {
        const d = new Date(item.start_timestamp * 1000);
        return d.toLocaleTimeString("en-US", { 
            hour: "numeric", 
            minute: "2-digit", 
            timeZone: TZ 
        });
    }
    const d = new Date(item.start);
    if (isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit", 
        timeZone: TZ 
    });
}

function startMs(item: ScheduleItem): number {
    return item.start_timestamp ? item.start_timestamp * 1000 : new Date(item.start).getTime();
}

function endMs(item: ScheduleItem): number {
    return item.end_timestamp ? item.end_timestamp * 1000 : new Date(item.end).getTime();
}

// Days from today onward (today first, then the next six), each holding only shows that haven't ended.
function upcomingWeek(schedule: ScheduleData): { day: string; items: ScheduleItem[] }[] {
    const now = Date.now();
    const horizon = now + 7 * 24 * 60 * 60 * 1000;
    const startIdx = Math.max(0, DAYS.indexOf(schedule.current_day));
    const ordered = [...DAYS.slice(startIdx), ...DAYS.slice(0, startIdx)];
    return ordered.map((day) => ({
        day,
        items: (schedule.week?.[day] ?? [])
            .filter((item) => endMs(item) > now && startMs(item) < horizon)
            .sort((a, b) => startMs(a) - startMs(b)),
    }));
}

function ScheduleRow({ item, showNow = true }: { item: ScheduleItem; showNow?: boolean }) {
    const live = showNow && item.is_now;
    return (
        <li className={`flex items-center gap-3 rounded-md px-2 py-2 ${live ? "bg-primary/10 ring-1 ring-primary/40" : ""}`}>
            <span className={`w-16 shrink-0 font-mono text-xs ${live ? "text-primary" : "text-muted"}`}>
                {live ? "NOW" : formatTime(item)}
            </span>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm truncate">{item.name}</div>
                {item.description && <div className="text-muted text-xs truncate">{item.description}</div>}
            </div>
            {live && <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />}
        </li>
    );
}

export function ScheduleCard() {
    const [schedule, setSchedule] = useState < ScheduleData | null > (null);
    const [loadError, setLoadError] = useState(false);
    const [tab, setTab] = useState < Tab > ("today");

    // Animate the list height when switching tabs or when data arrives,
    // so the card opens/closes downward smoothly.
    const innerRef = useRef < HTMLDivElement > (null);
    const [height, setHeight] = useState < number | undefined > (undefined);
    useEffect(() => {
        const el = innerRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/schedule");
                if (!res.ok) throw new Error("Failed to fetch");
                setSchedule(await res.json());
                setLoadError(false);
            } catch (err) {
                console.warn("Failed to load schedule:", err);
                setLoadError(true);
            }
        };
        load();
        const interval = setInterval(load, 60000);
        return () => clearInterval(interval);
    }, []);

    const tabClass = (t: Tab) =>
        `px-2.5 py-1 rounded font-mono text-[11px] uppercase tracking-wide transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
        }`;

    const week = schedule ? upcomingWeek(schedule) : [];
    const weekHasItems = week.some((d) => d.items.length > 0);

    return (
        <div className="bg-accent rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm">Schedule</span>
                </div>
                <span className="text-muted text-xs font-mono">All times PT</span>
            </div>

            <div className="flex gap-1 mb-3" role="tablist">
                <button type="button" role="tab" aria-selected={tab === "today"} className={tabClass("today")} onClick={() => setTab("today")}>
                    Today
                </button>
                <button type="button" role="tab" aria-selected={tab === "week"} className={tabClass("week")} onClick={() => setTab("week")}>
                    This Week
                </button>
            </div>

            <div style={{ height }} className="overflow-hidden transition-[height] duration-300 ease-out">
                <div ref={innerRef}>
                    {loadError && !schedule ? (
                        <div className="text-muted text-xs">Schedule unavailable. Retrying...</div>
                    ) : !schedule ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                            ))}
                        </div>
                    ) : tab === "today" ? (
                        schedule.today.length === 0 ? (
                            <div className="text-muted text-xs">No schedule for today.</div>
                        ) : (
                            <ul className="space-y-1">
                                {schedule.today.map((item, i) => (
                                    <ScheduleRow key={i} item={item} />
                                ))}
                            </ul>
                        )
                    ) : !weekHasItems ? (
                        <div className="text-muted text-xs">Nothing scheduled this week yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {week.map(({ day, items }, idx) =>
                                items.length === 0 ? null : (
                                    <div key={day}>
                                        <div className="flex items-center gap-2 px-2 mb-1">
                                            <span className={`font-mono text-[11px] uppercase tracking-wide ${idx === 0 ? "text-primary" : "text-muted"}`}>
                                                {idx === 0 ? "Today" : day}
                                            </span>
                                            <span className="h-px flex-1 bg-muted/30" />
                                        </div>
                                        <ul className="space-y-1">
                                            {items.map((item, i) => (
                                                <ScheduleRow key={i} item={item} showNow={idx === 0} />
                                            ))}
                                        </ul>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function EmbedSchedule() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-md">
                <ScheduleCard />
            </div>
        </div>
    );
}

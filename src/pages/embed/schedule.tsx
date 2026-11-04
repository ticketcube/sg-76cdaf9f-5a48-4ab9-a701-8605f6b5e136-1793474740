import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

interface ScheduleItem {
    start: string;
    end: string;
    name: string;
    description?: string;
    is_now: boolean;
    type: string;
    parsed_time?: { hours: number; minutes: number; time24: number };
}

interface ScheduleData {
    today: ScheduleItem[];
    week: Record<string, ScheduleItem[]>;
    current_day: string;
    timezone: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTime(item: ScheduleItem): string {
    const t = item.parsed_time;
    if (!t) return item.start || "--:--";
    const period = t.hours >= 12 ? "PM" : "AM";
    const h = t.hours === 0 ? 12 : t.hours > 12 ? t.hours - 12 : t.hours;
    return `${h}:${String(t.minutes).padStart(2, "0")} ${period}`;
}

function Row({ item, live }: { item: ScheduleItem; live: boolean }) {
    const now = live && item.is_now;
    return (
        <li className={`flex items-center gap-3 rounded-md px-2 py-2 ${now ? "bg-primary/10 ring-1 ring-primary/40" : ""}`}>
            <span className={`w-16 shrink-0 font-mono text-xs ${now ? "text-primary" : "text-muted"}`}>
                {now ? "NOW" : formatTime(item)}
            </span>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm truncate">{item.name}</div>
                {item.description && <div className="text-muted text-xs truncate">{item.description}</div>}
            </div>
            {now && <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />}
        </li>
    );
}

export function ScheduleCard() {
    const [schedule, setSchedule] = useState < ScheduleData | null > (null);
    const [loadError, setLoadError] = useState(false);
    const [tab, setTab] = useState < "today" | "week" > ("today");

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
        const id = setInterval(load, 60000);
        return () => clearInterval(id);
    }, []);

    // Week ordered starting from today
    const start = schedule ? Math.max(0, DAYS.indexOf(schedule.current_day)) : 0;
    const weekDays = [...DAYS.slice(start), ...DAYS.slice(0, start)];

    const tabBtn = (key: "today" | "week", label: string) => (
        <button
            onClick={() => setTab(key)}
            className={`text-xs font-mono px-2 py-1 rounded-md transition-colors ${tab === key ? "bg-primary/10 text-primary ring-1 ring-primary/40" : "text-muted hover:text-foreground"
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-accent rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm">Schedule</span>
                </div>
                <span className="text-muted text-xs font-mono">All times PT</span>
            </div>

            <div className="flex gap-2 mb-3">
                {tabBtn("today", "Today")}
                {tabBtn("week", "This Week")}
            </div>

            {loadError && !schedule ? (
                <div className="text-muted text-xs">Schedule unavailable. Retrying...</div>
            ) : !schedule ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-muted rounded animate-pulse" />)}
                </div>
            ) : tab === "today" ? (
                schedule.today.length === 0 ? (
                    <div className="text-muted text-xs">No schedule for today.</div>
                ) : (
                    <ul className="space-y-1">
                        {schedule.today.map((item, i) => <Row key={i} item={item} live />)}
                    </ul>
                )
            ) : (
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {weekDays.map((day) => {
                        const items = schedule.week?.[day] ?? [];
                        const isToday = day === schedule.current_day;
                        return (
                            <div key={day}>
                                <div className={`font-mono text-xs uppercase tracking-wide mb-1 ${isToday ? "text-primary" : "text-muted"}`}>
                                    {isToday ? `${day} · Today` : day}
                                </div>
                                {items.length === 0 ? (
                                    <div className="text-muted text-xs px-2 py-1">No scheduled programming</div>
                                ) : (
                                    <ul className="space-y-1">
                                        {items.map((item, i) => <Row key={i} item={item} live={isToday} />)}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
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
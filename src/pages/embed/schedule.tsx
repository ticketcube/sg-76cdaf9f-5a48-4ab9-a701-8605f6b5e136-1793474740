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
    current_day: string;
    timezone: string;
}

function formatTime(item: ScheduleItem): string {
    const t = item.parsed_time;
    if (!t) return "--:--";
    const period = t.hours >= 12 ? "PM" : "AM";
    const h = t.hours === 0 ? 12 : t.hours > 12 ? t.hours - 12 : t.hours;
    return `${h}:${String(t.minutes).padStart(2, "0")} ${period}`;
}

export function ScheduleCard() {
    const [schedule, setSchedule] = useState < ScheduleData | null > (null);
    const [loadError, setLoadError] = useState(false);

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

    return (
        <div className="bg-accent rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-foreground text-sm">Today's Schedule</span>
                </div>
                <span className="text-muted text-xs font-mono">All times ET</span>
            </div>

            {loadError && !schedule ? (
                <div className="text-muted text-xs">Schedule unavailable. Retrying...</div>
            ) : !schedule ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                    ))}
                </div>
            ) : schedule.today.length === 0 ? (
                <div className="text-muted text-xs">No schedule for today.</div>
            ) : (
                <ul className="space-y-1">
                    {schedule.today.map((item, i) => (
                        <li
                            key={i}
                            className={`flex items-center gap-3 rounded-md px-2 py-2 ${item.is_now ? "bg-primary/10 ring-1 ring-primary/40" : ""
                                }`}
                        >
                            <span className={`w-16 shrink-0 font-mono text-xs ${item.is_now ? "text-primary" : "text-muted"}`}>
                                {item.is_now ? "NOW" : formatTime(item)}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-foreground text-sm truncate">{item.name}</div>
                                {item.description && <div className="text-muted text-xs truncate">{item.description}</div>}
                            </div>
                            {item.is_now && <span className="h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />}
                        </li>
                    ))}
                </ul>
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
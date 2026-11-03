import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface ScheduleItem {
  start: string;
  end: string;
  name: string;
  description?: string;
  is_now: boolean;
  type: string;
  parsed_time: {
    hours: number;
    minutes: number;
    time24: number;
  };
}

interface ScheduleData {
  today: ScheduleItem[];
  week: {
    [key: string]: ScheduleItem[];
  };
  current_day: string;
  timezone: string;
}

function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHour}:${displayMinutes} ${period}`;
}

export default function EmbedSchedule() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [mounted, setMounted] = useState(false);

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
      } catch (error) {
        console.warn("Failed to load schedule:", error);
      }
    };

    fetchSchedule();
    const interval = setInterval(fetchSchedule, 60000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted || !schedule) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            OTW Radio Schedule
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            All times Eastern Time (ET) • Updates automatically
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Today's Schedule
          </h2>
          <div className="space-y-2">
            {schedule.today.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No schedule available for today</p>
            ) : (
              schedule.today.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded border ${
                    item.is_now 
                      ? "bg-red-50 border-red-500" 
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="shrink-0">
                    <div className={`flex items-center gap-1.5 font-mono text-xs px-2 py-1 rounded ${
                      item.is_now 
                        ? "bg-red-500 text-white" 
                        : "bg-gray-200 text-gray-700"
                    }`}>
                      <Clock className="w-3 h-3" />
                      {formatTime(item.parsed_time.hours, item.parsed_time.minutes)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">
                        {item.name}
                      </p>
                      {item.is_now && (
                        <span className="bg-red-500 text-white font-mono text-[10px] px-1.5 py-0.5 rounded">
                          ON AIR
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
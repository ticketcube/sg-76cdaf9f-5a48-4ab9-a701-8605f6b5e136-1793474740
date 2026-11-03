import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Radio } from "lucide-react";

interface ScheduleItem {
  start: string;
  end: string;
  name: string;
  description?: string;
  is_now: boolean;
  type: string;
  parsed_time?: {
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

interface NowPlayingData {
  live?: {
    is_live: boolean;
    streamer_name?: string;
  };
}

function formatTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const displayMinutes = minutes.toString().padStart(2, "0");
  return `${displayHour}:${displayMinutes} ${period}`;
}

function getDisplayTime(item: ScheduleItem): string {
  if (item.parsed_time?.hours !== undefined && item.parsed_time?.minutes !== undefined) {
    return formatTime(item.parsed_time.hours, item.parsed_time.minutes);
  }
  return item.start || "--:--";
}

export function Schedule() {
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
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

  useEffect(() => {
    if (!mounted) return;

    const fetchNowPlaying = async () => {
      try {
        const response = await fetch("/api/now-playing");
        if (!response.ok) return;
        const data = await response.json();
        setNowPlaying(data);
      } catch (error) {
        console.warn("Failed to load now playing:", error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 15000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted || !schedule) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isLive = nowPlaying?.live?.is_live ?? false;
  const streamerName = nowPlaying?.live?.streamer_name;
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-gray-50/50 h-14 px-6 gap-6">
          <TabsTrigger 
            value="today" 
            className="font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-[14px]"
          >
            Today's Schedule
          </TabsTrigger>
          <TabsTrigger 
            value="week" 
            className="font-semibold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 pb-[14px]"
          >
            Full Week
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="p-6 space-y-3 m-0">
          {schedule.today.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No schedule available for today</p>
            </div>
          ) : (
            schedule.today.map((item, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 p-5 rounded-lg border transition-all ${
                  item.is_now 
                    ? "bg-red-50 border-primary shadow-sm" 
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="shrink-0">
                  <div className={`flex items-center gap-2 font-mono text-sm px-3 py-1.5 rounded-full ${
                    item.is_now 
                      ? "bg-primary text-white" 
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {getDisplayTime(item)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.is_now && !isLive && (
                      <Badge className="bg-primary text-white font-mono text-xs shadow-sm">
                        ON AIR
                      </Badge>
                    )}
                    {item.is_now && isLive && (
                      <>
                        <Badge className="bg-primary text-white font-mono text-xs shadow-sm animate-pulse">
                          LIVE
                        </Badge>
                        {streamerName && (
                          <span className="text-xs text-gray-600 font-mono">
                            {streamerName}
                          </span>
                        )}
                      </>
                    )}
                    {item.type === "playlist" && !isLive && (
                      <Badge variant="outline" className="font-mono text-xs border-gray-300 text-gray-600">
                        PLAYLIST
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="week" className="p-6 m-0">
          <div className="space-y-8">
            {dayOrder.map((day) => {
              const daySchedule = schedule.week[day] || [];
              const isToday = day === schedule.current_day;

              return (
                <div key={day} className={`${isToday ? "border-l-4 border-primary pl-5" : ""}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className={`text-lg font-semibold ${isToday ? "text-primary" : "text-gray-900"}`}>
                      {day}
                    </h3>
                    {isToday && (
                      <Badge className="bg-primary text-white font-mono text-xs">
                        TODAY
                      </Badge>
                    )}
                  </div>

                  {daySchedule.length === 0 ? (
                    <p className="text-sm text-gray-500 italic ml-1">No scheduled programming</p>
                  ) : (
                    <div className="space-y-2">
                      {daySchedule.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                        >
                          <div className="shrink-0 font-mono text-sm text-gray-600 px-3 py-1 bg-gray-100 rounded-full">
                            {getDisplayTime(item)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import { useEffect, useState } from "react";

interface ScheduleResponse {
  blocks: {
    overnight: { title: string; description: string };
    weekly_feature: { title: string; description: string };
    guest_curator: { title: string; description: string };
  };
  features: {
    [key: string]: {
      title: string;
      description: string;
    };
  };
}

export default function EmbedSchedule() {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const res = await fetch("/api/schedule");
        if (!res.ok) {
          throw new Error(`Failed to load schedule: ${res.status}`);
        }
        const data = await res.json();
        console.log("📅 Schedule loaded:", data);
        setSchedule(data);
      } catch (err) {
        console.error("Failed to load schedule:", err);
        setError(err instanceof Error ? err.message : "Failed to load schedule");
      }
    };
    loadSchedule();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted">Loading schedule...</div>
      </div>
    );
  }

  const dailySchedule = [
    { time: "Midnight – 10AM", show: schedule.blocks.overnight.title },
    { time: "10AM - Noon", show: schedule.blocks.weekly_feature.title },
    { time: "Noon – 3PM", show: schedule.blocks.guest_curator.title },
    { time: "3PM – 5PM", show: `${schedule.blocks.weekly_feature.title} (Repeat)` },
    { time: "5PM - Midnight", show: schedule.blocks.overnight.title },
  ];

  const weeklyFeatures = [
    { day: "MONDAY", show: schedule.features["1"]?.title || "OTW WEEKLY RECAP" },
    { day: "TUESDAY", show: schedule.features["2"]?.title || "CHEF'S CHOICE" },
    { day: "WEDNESDAY", show: schedule.features["3"]?.title || "OTW TOURING ARTISTS" },
    { day: "THURSDAY", show: schedule.features["4"]?.title || "GWLMMWLG" },
    { day: "FRIDAY", show: schedule.features["5"]?.title || "ARTIST INTERVIEW" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <section>
          <h2 className="text-4xl font-bold mb-8 tracking-tight">
            DAILY SCHEDULE
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {dailySchedule.map((block, i) => (
                <div key={i} className="text-2xl leading-relaxed">
                  {block.time}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {dailySchedule.map((block, i) => (
                <div key={i} className="text-2xl leading-relaxed font-bold">
                  {block.show}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-muted pt-12">
          <h2 className="text-4xl font-bold mb-8 tracking-tight">
            WEEKLY FEATURES
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {weeklyFeatures.map((feature, i) => (
                <div key={i} className="text-2xl leading-relaxed">
                  {feature.day}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {weeklyFeatures.map((feature, i) => (
                <div key={i} className="text-2xl leading-relaxed font-bold">
                  {feature.show}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
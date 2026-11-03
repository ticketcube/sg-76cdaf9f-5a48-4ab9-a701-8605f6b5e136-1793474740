import { ScheduleCard } from "@/components/ScheduleCard";

// Public widget for onestowatch.com, styled to match /embed/player:
//   <iframe src="https://onestowatch.live/embed/schedule" width="100%" height="640"></iframe>
// For the player with the schedule under it, use /embed/player?schedule=1.
export default function EmbedSchedule() {
  return (
    <div className="flex justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <ScheduleCard variant="standalone" />
      </div>
    </div>
  );
}

import { Schedule } from "@/components/Schedule";

// Public widget for onestowatch.com: <iframe src="https://onestowatch.live/embed/schedule">.
// Same unified AzuraCast schedule as the staff page, in a compact layout.
export default function EmbedSchedule() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <Schedule embed />
      </div>
    </div>
  );
}

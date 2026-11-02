import { Schedule } from "@/components/Schedule";

export default function SchedulePage() {
  return (
    <div className="page-container">
      <div className="max-w-5xl mx-auto section-spacing">
        <section className="text-center space-y-4 mb-12">
          <h1 className="page-title">Programming Schedule</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All times Eastern Time (ET). Same schedule every day with rotating weekly features.
          </p>
        </section>

        <Schedule />
      </div>
    </div>
  );
}
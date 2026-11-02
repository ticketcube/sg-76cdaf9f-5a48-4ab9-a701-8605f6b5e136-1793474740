import { Schedule } from "@/components/Schedule";

export default function SchedulePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Programming Schedule
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            All times Eastern Time (ET). Broadcasting 24/7 with rotating features and curated playlists.
          </p>
        </header>

        <Schedule />
      </div>
    </div>
  );
}
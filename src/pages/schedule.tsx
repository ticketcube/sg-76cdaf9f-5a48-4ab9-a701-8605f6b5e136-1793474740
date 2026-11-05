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
            All times Pacific Time (PT). Broadcasting 24/7 with rotating features and curated playlists.
          </p>
        </header>

        <Schedule />
      </div>
      <!-- OTW Radio Widget -->
      <div id="otw-radio-widget">
        <iframe
          id="otw-radio-iframe"
          src="https://onestowatch.live/embed/widget"
          style="width: 100%; height: 180px; border: none; border-radius: 8px;"
          allow="autoplay"
          title="OTW Radio Player"
        ></iframe>
      </div>

      <script>
// Auto-resize iframe based on content
        window.addEventListener('message', function(e) {
  if (e.data.type === 'resize') {
    const iframe = document.getElementById('otw-radio-iframe');
        if (iframe) {
          iframe.style.height = e.data.height + 'px';
    }
  }
});
      </script>
    </div>
  );
}
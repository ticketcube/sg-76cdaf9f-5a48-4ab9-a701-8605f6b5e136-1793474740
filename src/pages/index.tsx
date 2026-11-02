import { AudioPlayer } from "@/components/AudioPlayer";
import { Schedule } from "@/components/Schedule";

export default function Home() {
  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto section-spacing">
        <section className="text-center space-y-6 mb-16">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            OTW Radio
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            24/7 music from the OnesToWatch roster. Live artist premieres, curated features, and the soundtrack of what's next.
          </p>
        </section>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div>
            <AudioPlayer />
          </div>
          <div>
            <Schedule />
          </div>
        </div>

        <section className="feature-card text-center">
          <h2 className="section-title mb-4">Always On, Always Fresh</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            OTW Radio runs 24/7 with a rotating schedule of curated playlists, weekly features, and guest curator sets. 
            When artists choose to simulcast their live performances or premieres, the station automatically switches to video mode.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="px-6 py-3 bg-accent/20 rounded-full">
              <p className="text-sm font-mono text-primary">24/7 BROADCAST</p>
            </div>
            <div className="px-6 py-3 bg-accent/20 rounded-full">
              <p className="text-sm font-mono text-primary">LIVE PREMIERES</p>
            </div>
            <div className="px-6 py-3 bg-accent/20 rounded-full">
              <p className="text-sm font-mono text-primary">GUEST CURATORS</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
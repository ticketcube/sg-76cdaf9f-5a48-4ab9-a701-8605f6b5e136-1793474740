import Head from "next/head";
import Link from "next/link";
import { Radio, ExternalLink, PlayCircle } from "lucide-react";

export default function OTWIntegrationDemo() {
  return (
    <>
      <Head>
        <title>Ones To Watch x OTW Radio - Integration Demo</title>
        <meta name="description" content="Demo of OTW Radio integrated into Ones To Watch website" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Ones To Watch Header Recreation */}
        <header className="border-b border-border bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-8">
                <Link href="https://onestowatch.com" className="flex items-center gap-2">
                  <img 
                    src="https://s3-us-west-2.amazonaws.com/onestowatch-v2/logo-o2w-1635877647.svg" 
                    alt="Ones To Watch"
                    className="h-8"
                  />
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm">
                  <a href="#" className="hover:text-primary transition-colors">Artists</a>
                  <a href="#" className="hover:text-primary transition-colors">Genre</a>
                  <a href="#" className="hover:text-primary transition-colors">Read</a>
                  <a href="#" className="hover:text-primary transition-colors">Videos</a>
                  <a href="#" className="hover:text-primary transition-colors flex items-center gap-1">
                    <Radio className="w-4 h-4 text-primary" />
                    <span className="text-primary font-semibold">Radio</span>
                  </a>
                  <a href="#" className="hover:text-primary transition-colors">Podcast</a>
                  <a href="#" className="hover:text-primary transition-colors">Shop</a>
                </nav>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section with Radio Integration */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Featured Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Featured Article */}
              <Link href="#" className="block group">
                <div className="relative aspect-[16/9] overflow-hidden rounded-lg">
                  <img 
                    src="https://s3-us-west-2.amazonaws.com/onestowatch-v2/697(1)-1768939920.jpg"
                    alt="Top 26 Artists"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-3xl font-bold text-white mb-2">
                      The Top 26 Artists to Watch in 2026
                    </h2>
                    <p className="text-white/90">Meet the Ones To Watch class of 2026.</p>
                  </div>
                </div>
              </Link>

              {/* Secondary Features Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="#" className="group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <img 
                      src="https://s3-us-west-2.amazonaws.com/onestowatch-v2/101_f_r_o_n_t6.13.22_p_m-1772739646.png"
                      alt="101 Alumni"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-bold text-white">
                        OnesToWatch Turns 11: Celebrating the Top 101 Alumni
                      </h3>
                    </div>
                  </div>
                </Link>
                
                <Link href="#" className="group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                    <img 
                      src="https://s3-us-west-2.amazonaws.com/onestowatch-v2/1-1776187611.png"
                      alt="Latest Zine"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-bold text-white">
                        Read Our Latest Zine!
                      </h3>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* OTW Radio Sidebar - THE INTEGRATION */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                {/* Radio Player Card - COMPACT */}
                <div className="bg-card rounded-lg border border-primary shadow-md overflow-hidden">
                  <div className="bg-primary text-primary-foreground px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span className="font-semibold text-sm">OTW RADIO</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs bg-black/20 px-2 py-0.5 rounded-full">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span className="text-xs">LIVE</span>
                    </div>
                  </div>
                  
                  {/* Embedded Radio Player - Smaller */}
                  <div className="aspect-video bg-black">
                    <iframe
                      src="/embed/player"
                      className="w-full h-full"
                      allow="autoplay"
                      title="OTW Radio Player"
                    />
                  </div>

                  <div className="p-3">
                    <p className="text-xs font-semibold">24/7 Music Discovery</p>
                    <Link 
                      href="/schedule"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1 group"
                    >
                      <span>View Schedule</span>
                      <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>

                {/* Original Spotify Widget for Reference */}
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                  <Link href="https://open.spotify.com/playlist/0EVzFau2kULH9e5dwK2OSI" className="block">
                    <img 
                      src="https://s3-us-west-2.amazonaws.com/onestowatch-v2/site_hpcarousel_15DEB31.png"
                      alt="Now Watching Playlist"
                      className="w-full"
                    />
                    <div className="p-3">
                      <p className="font-semibold text-sm">Now Watching</p>
                      <p className="text-xs text-muted-foreground">Your go-to playlist for new music</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Discover New Music Section */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8">Discover New Music</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "daine",
                image: "https://s3-us-west-2.amazonaws.com/onestowatch-v2/daine_tile-1793755637.png",
                genre: "Pop / Electronic Pop",
                location: "Melbourne, Australia"
              },
              {
                name: "Chxrry",
                image: "https://s3-us-west-2.amazonaws.com/onestowatch-v2/chxrry_tile-1793755447.jpeg",
                genre: "Contemporary R&B / Pop",
                location: "Toronto, Ontario, Canada"
              },
              {
                name: "BINA.",
                image: "https://s3-us-west-2.amazonaws.com/onestowatch-v2/b_i_n_a._tile-1793755291.jpeg",
                genre: "Alternative / R&B",
                location: "South London, England"
              },
              {
                name: "Emma Ogier",
                image: "https://s3-us-west-2.amazonaws.com/onestowatch-v2/emma_ogier_tile-1793768707.jpeg",
                genre: "Indie / Alternative",
                location: "Houston, Texas"
              }
            ].map((artist, i) => (
              <Link key={i} href="#" className="group">
                <div className="aspect-square overflow-hidden rounded-lg mb-3">
                  <img 
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold group-hover:text-primary transition-colors">{artist.name}</h3>
                <p className="text-sm text-muted-foreground">{artist.genre}</p>
                <p className="text-xs text-muted-foreground mt-1">{artist.location}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Demo Info Banner */}
        <div className="bg-primary text-primary-foreground py-4">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">
              <strong>Integration Demo:</strong> This page shows how OTW Radio could be embedded into the Ones To Watch website.
              The radio player replaces the static Spotify widget with a live 24/7 stream featuring O2W artists.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
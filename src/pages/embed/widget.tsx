import { useEffect, useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Calendar, Radio, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import Link from "next/link";

interface NowPlaying {
  now_playing: {
    song: {
      title: string;
      artist: string;
      art?: string;
    };
  };
  station: {
    name: string;
    listen_url: string;
  };
}

interface ScheduleItem {
  name: string;
  start_time: string;
  end_time: string;
  is_now: boolean;
}

export default function EmbedWidget() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isExpanded, setIsExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize audio
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume / 100;
    }
  }, []);

  // Update parent iframe height when expanded state changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent) {
      const height = containerRef.current?.offsetHeight || (isExpanded ? 500 : 180);
      window.parent.postMessage({ type: "resize", height }, "*");
    }
  }, [isExpanded]);

  // Volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Mute control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Fetch now playing
  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch("/api/now-playing");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setNowPlaying(data);
        
        if (audioRef.current && data.station.listen_url && !audioRef.current.src) {
          audioRef.current.src = data.station.listen_url;
        }
      } catch (err) {
        console.error("Failed to fetch now playing:", err);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch schedule when expanded
  useEffect(() => {
    if (!isExpanded) return;

    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/schedule");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSchedule(data.slice(0, 4)); // Show next 4 blocks
      } catch (err) {
        console.error("Failed to fetch schedule:", err);
      }
    };

    fetchSchedule();
  }, [isExpanded]);

  const togglePlay = async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Failed to play:", err);
      }
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const song = nowPlaying?.now_playing.song;

  return (
    <div ref={containerRef} className="w-full bg-background">
      {/* Header Navigation */}
      <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4" />
          <a 
            href="https://onestowatch.live" 
            target="_parent"
            className="font-bold text-sm hover:underline"
          >
            OTW RADIO
          </a>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <a 
            href="https://onestowatch.live" 
            target="_parent"
            className="hover:underline hidden sm:inline"
          >
            Home
          </a>
          <a 
            href="https://onestowatch.live/schedule" 
            target="_parent"
            className="hover:underline hidden sm:inline"
          >
            Schedule
          </a>
          <div className="flex items-center gap-1 bg-black/20 px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>
      </div>

      {/* Compact Player */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Album art */}
          <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
            {song?.art ? (
              <img
                src={song.art}
                alt={`${song.title} artwork`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-muted-foreground rounded-full" />
              </div>
            )}
          </div>
          
          {/* Song info */}
          <div className="flex-1 min-w-0">
            {song ? (
              <>
                <div className="font-semibold text-foreground truncate text-sm">
                  {song.title || "Unknown Track"}
                </div>
                <div className="text-muted-foreground text-xs truncate">
                  {song.artist || "Unknown Artist"}
                </div>
              </>
            ) : (
              <>
                <div className="h-4 bg-muted rounded animate-pulse w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
              </>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={togglePlay}
              size="icon"
              variant="default"
              className="h-10 w-10 shrink-0"
              disabled={!nowPlaying}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            onClick={toggleMute}
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
          >
            {isMuted ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
          </Button>
          
          <Slider
            value={[volume]}
            onValueChange={([val]) => setVolume(val)}
            max={100}
            step={1}
            className="flex-1"
          />

          <Button
            onClick={toggleExpanded}
            size="sm"
            variant="ghost"
            className="ml-2 text-xs gap-1"
          >
            <Calendar className="h-3 w-3" />
            {isExpanded ? (
              <>
                Hide <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Schedule <ChevronDown className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Schedule Section */}
      {isExpanded && (
        <div className="border-t border-border">
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Coming Up</h3>
              <a
                href="https://onestowatch.live/schedule"
                target="_parent"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Full Schedule
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            
            {schedule.length > 0 ? (
              <div className="space-y-2">
                {schedule.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border text-xs ${
                      item.is_now
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/50 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{item.name}</span>
                      {item.is_now && (
                        <span className="text-primary text-[10px] font-semibold">
                          NOW PLAYING
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-[10px] mt-1">
                      {item.start_time} - {item.end_time} PT
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground text-center py-4">
                Loading schedule...
              </div>
            )}

            <div className="pt-2 border-t border-border mt-3">
              <p className="text-xs text-muted-foreground mb-2">
                24/7 music discovery featuring O2W artists
              </p>
              <a
                href="https://onestowatch.live"
                target="_parent"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Visit OTW Radio
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
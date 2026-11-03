"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface NowPlayingData {
  now_playing?: {
    song?: {
      title: string;
      artist: string;
      album?: string;
      art?: string;
    };
  };
  live?: {
    is_live: boolean;
    streamer_name?: string;
  };
  listeners?: {
    current: number;
  };
}

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [mounted, setMounted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL || "https://radio.onestowatch.live/listen/otw_radio/radio.mp3";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (!mounted) return;

    const fetchNowPlaying = async () => {
      try {
        const response = await fetch("/api/now-playing");
        if (!response.ok) {
          console.warn("Failed to fetch now playing data:", response.status);
          return;
        }
        const data = await response.json();
        setNowPlaying(data);
      } catch (error) {
        console.warn("Could not fetch now playing data:", error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 15000);

    return () => clearInterval(interval);
  }, [mounted]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  if (!mounted) return null;

  const isLive = nowPlaying?.live?.is_live ?? false;
  const song = nowPlaying?.now_playing?.song;
  const streamerName = nowPlaying?.live?.streamer_name;
  const albumArt = song?.art || "/OTWCOLOR_copy.png";

  return (
    <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl">
      <div className="relative aspect-square">
        <img
          src={albumArt}
          alt={song?.title || "OTW Radio"}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div className="text-white">
            <p className="text-sm font-medium opacity-90">OnesToWatch</p>
            <p className="text-xs opacity-70">#NowWatching</p>
          </div>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <div className="w-6 h-6 bg-black rounded-full" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          {isLive && streamerName ? (
            <>
              <Badge className="bg-primary text-primary-foreground font-mono text-xs px-3 py-1">
                LIVE
              </Badge>
              <h2 className="text-2xl font-bold text-white">
                {streamerName}
              </h2>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                {isLive && (
                  <Badge className="bg-primary text-primary-foreground font-mono text-xs px-2 py-0.5">
                    LIVE
                  </Badge>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white">
                {song?.title || "OTW Radio"}
              </h2>
              <p className="text-muted-foreground">
                {song?.artist || "OnesToWatch"}
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/10"
            disabled
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3v14l4-4 4 4 4-4 4 4V3l-4 4-4-4-4 4z"/>
            </svg>
          </Button>

          <Button
            size="lg"
            onClick={togglePlay}
            className="h-16 w-16 rounded-full bg-white hover:bg-white/90 text-black"
          >
            {isPlaying ? (
              <Pause className="h-7 w-7" fill="currentColor" />
            ) : (
              <Play className="h-7 w-7 ml-1" fill="currentColor" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-10 w-10 text-white hover:bg-white/10"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <Slider
            value={[volume]}
            onValueChange={(v) => setVolume(v[0])}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-0"
          />
        </div>
      </div>

      <audio ref={audioRef} src={streamUrl} />
    </div>
  );
}
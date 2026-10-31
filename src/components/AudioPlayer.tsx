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
    };
  };
  live?: {
    is_live: boolean;
    streamer_name?: string;
  };
}

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const streamUrl = "http://onestowatch.live:8000/radio.mp3";
  const nowPlayingUrl = "https://onestowatch.live/api/nowplaying/otw_radio";

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const response = await fetch(nowPlayingUrl);
        const data = await response.json();
        setNowPlaying(data);
      } catch (error) {
        console.error("Failed to fetch now playing data:", error);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 15000);

    return () => clearInterval(interval);
  }, []);

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

  const isLive = nowPlaying?.live?.is_live ?? false;
  const song = nowPlaying?.now_playing?.song;
  const streamerName = nowPlaying?.live?.streamer_name;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 border-t border-border backdrop-blur-xl z-50">
      <div className="container py-4">
        <div className="flex items-center gap-4 md:gap-6">
          <Button
            size="lg"
            onClick={togglePlay}
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="destructive" className="bg-primary text-primary-foreground font-mono text-xs">
                LIVE
              </Badge>
              {isLive && streamerName && (
                <span className="text-xs text-primary font-mono">
                  {streamerName}
                </span>
              )}
            </div>
            {song ? (
              <p className="text-sm font-medium truncate">
                {song.artist} - {song.title}
              </p>
            ) : (
              <p className="text-sm font-medium truncate">
                OTW Radio
              </p>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3 w-32">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8 shrink-0"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={(v) => setVolume(v[0])}
              max={100}
              step={1}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={streamUrl} />
    </div>
  );
}
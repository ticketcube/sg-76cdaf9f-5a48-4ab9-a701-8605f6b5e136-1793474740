import { useEffect, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

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

export default function EmbedPlayer() {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [audio] = useState(() => typeof window !== "undefined" ? new Audio() : null);

  useEffect(() => {
    if (!audio) return;
    audio.volume = volume / 100;
  }, [audio, volume]);

  useEffect(() => {
    if (!audio) return;
    audio.muted = isMuted;
  }, [audio, isMuted]);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch("https://radio.onestowatch.live/api/nowplaying/otw_radio");
        const data = await res.json();
        setNowPlaying(data);
        
        if (audio && data.station.listen_url && !audio.src) {
          audio.src = data.station.listen_url;
        }
      } catch (err) {
        console.error("Failed to fetch now playing:", err);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000);
    return () => clearInterval(interval);
  }, [audio]);

  const togglePlay = async () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Failed to play:", err);
      }
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  if (!nowPlaying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-muted">Loading...</div>
      </div>
    );
  }

  const { song } = nowPlaying.now_playing;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-4 bg-accent rounded-lg p-4">
          {song.art && (
            <img
              src={song.art}
              alt={`${song.title} artwork`}
              className="w-16 h-16 rounded object-cover"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-foreground truncate text-sm">
              {song.title || "Unknown Track"}
            </div>
            <div className="text-muted text-xs truncate">
              {song.artist || "Unknown Artist"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={togglePlay}
              size="icon"
              variant="default"
              className="h-10 w-10 shrink-0"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-3 px-2">
          <Button
            onClick={toggleMute}
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          
          <Slider
            value={[volume]}
            onValueChange={([val]) => setVolume(val)}
            max={100}
            step={1}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
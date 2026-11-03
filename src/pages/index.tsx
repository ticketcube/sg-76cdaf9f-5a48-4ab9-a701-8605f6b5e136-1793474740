import { useEffect, useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScheduleCard } from "@/pages/embed/schedule";
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
    const [nowPlaying, setNowPlaying] = useState < NowPlaying | null > (null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(80);
    const [loadError, setLoadError] = useState(false);
    const audioRef = useRef < HTMLAudioElement | null > (null);

    // Initialize audio element once
    useEffect(() => {
        if (typeof window !== "undefined" && !audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.volume = volume / 100;
        }
    }, []);

    // Update volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100;
        }
    }, [volume]);

    // Update mute
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // Fetch now playing data
    useEffect(() => {
        const fetchNowPlaying = async () => {
            try {
                // Use our cached API endpoint instead of direct AzuraCast
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

                const res = await fetch("/api/now-playing", {
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!res.ok) throw new Error("Failed to fetch");

                const data = await res.json();
                setNowPlaying(data);
                setLoadError(false);

                // Set audio source if we don't have one yet
                if (audioRef.current && data.station.listen_url && !audioRef.current.src) {
                    audioRef.current.src = data.station.listen_url;
                }
            } catch (err) {
                console.error("Failed to fetch now playing:", err);
                setLoadError(true);
            }
        };

        // Fetch immediately
        fetchNowPlaying();

        // Then poll every 15 seconds (our endpoint has 10s cache)
        const interval = setInterval(fetchNowPlaying, 15000);

        return () => clearInterval(interval);
    }, []);

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

    const song = nowPlaying?.now_playing.song;

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="w-full max-w-md">
                <div className="flex items-center gap-4 bg-accent rounded-lg p-4">
                    {/* Album art or placeholder */}
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
                        {loadError ? (
                            <>
                                <div className="font-semibold text-foreground text-sm">
                                    OTW Radio
                                </div>
                                <div className="text-muted text-xs">
                                    Connecting...
                                </div>
                            </>
                        ) : song ? (
                            <>
                                <div className="font-semibold text-foreground truncate text-sm">
                                    {song.title || "Unknown Track"}
                                </div>
                                <div className="text-muted text-xs truncate">
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

                    {/* Play button */}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={togglePlay}
                            size="icon"
                            variant="default"
                            className="h-10 w-10 shrink-0"
                            disabled={!nowPlaying}
                        >
                            {isPlaying ? (
                                <Pause className="h-5 w-5" />
                            ) : (
                                <Play className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Volume controls */}
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
                <div className="mt-3"><ScheduleCard /></div>
            </div>
        </div>
    );
}
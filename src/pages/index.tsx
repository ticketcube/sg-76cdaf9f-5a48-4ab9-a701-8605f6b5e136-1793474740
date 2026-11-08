import { useEffect, useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useRouter } from "next/router";
import { ScheduleCard } from "@/pages/embed/schedule";
import { ListenerMap } from "@/components/ListenerMap";
import { MoodTap } from "@/components/MoodTap";

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
    live?: {
        is_live: boolean;
        streamer_name?: string;
    };
}

// Only allow https images/links in the banner query params.
function safeUrl(value: string | string[] | undefined): string | null {
    if (typeof value !== "string") return null;
    try {
        const u = new URL(value);
        return u.protocol === "https:" ? u.toString() : null;
    } catch {
        return null;
    }
}

export default function EmbedPlayer() {
    const router = useRouter();
    // Optional banner: /?banner=https://.../ad.jpg&link=https://...
    const bannerSrc = safeUrl(router.query.banner);
    const bannerLink = safeUrl(router.query.link);
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

    // When embedded in an iframe, tell the host page our height so the iframe
    // grows/shrinks with the schedule instead of scrolling or clipping.
    useEffect(() => {
        if (typeof window === "undefined" || window.parent === window) return;
        const send = () =>
            window.parent.postMessage(
                { type: "otw-widget-height", height: Math.ceil(document.documentElement.scrollHeight) },
                "*"
            );
        const ro = new ResizeObserver(send);
        ro.observe(document.body);
        send();
        return () => ro.disconnect();
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
    const isLive = nowPlaying?.live?.is_live ?? false;
    const streamerName = nowPlaying?.live?.streamer_name;

    return (
        // Top-aligned (not vertically centered) so the player never moves
        // when the schedule below opens or closes.
        <div className="bg-background p-4">
            <div className="w-full max-w-md mx-auto">
                {bannerSrc && (
                    <div className="mb-3 overflow-hidden rounded-lg">
                        {bannerLink ? (
                            <a href={bannerLink} target="_blank" rel="noopener noreferrer sponsored">
                                <img src={bannerSrc} alt="Sponsor" className="block w-full h-auto" />
                            </a>
                        ) : (
                            <img src={bannerSrc} alt="" className="block w-full h-auto" />
                        )}
                    </div>
                )}
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
                                {isLive && streamerName ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-mono font-semibold rounded uppercase">
                                                LIVE
                                            </span>
                                        </div>
                                        <div className="font-semibold text-foreground truncate text-sm">
                                            {streamerName}
                                        </div>
                                        <div className="text-muted text-xs truncate">
                                            Live on OTW Radio
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="font-semibold text-foreground truncate text-sm">
                                            {song.title || "Unknown Track"}
                                        </div>
                                        <div className="text-muted text-xs truncate">
                                            {song.artist || "Unknown Artist"}
                                        </div>
                                    </>
                                )}
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

                {/* Mood Tap - emoji vibe tracker */}
                <div className="mt-3 flex justify-center">
                    <MoodTap nowPlaying={song ? {
                        title: song.title,
                        artist: song.artist,
                        id: undefined
                    } : undefined} />
                </div>

                <div className="mt-3"><ScheduleCard /></div>
                <div className="mt-6"><ListenerMap /></div>
               
            </div>
        </div>
    );
}
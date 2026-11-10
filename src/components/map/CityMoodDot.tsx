import { useEffect, useState } from "react";

interface CityMoodDotProps {
  city: string;
  lat: number;
  lng: number;
  mood: "cozy" | "party" | "reflection" | "focus";
  timestamp: string;
  isPulsing: boolean;
  x: number;
  y: number;
}

// Mood colors matching MoodTap
const MOOD_COLORS = {
  cozy: "hsl(180 60% 50%)",       // Teal
  party: "hsl(10 80% 55%)",       // Red
  reflection: "hsl(200 70% 65%)", // Light Blue
  focus: "hsl(45 80% 55%)"        // Gold
};

export function CityMoodDot({ 
  city, 
  mood, 
  timestamp,
  isPulsing, 
  x, 
  y 
}: CityMoodDotProps) {
  const [currentColor, setCurrentColor] = useState<string>(MOOD_COLORS[mood]);
  const [debugLog, setDebugLog] = useState<string>("");

  // Update color when mood changes
  useEffect(() => {
    const newColor = MOOD_COLORS[mood];
    const log = `[CityMoodDot] ${city}: ${mood} → ${newColor} (${timestamp})`;
    console.log(log);
    setDebugLog(log);
    setCurrentColor(newColor);
  }, [mood, timestamp, city]);

  return (
    <g data-city={city} data-mood={mood} data-timestamp={timestamp}>
      {/* Debug indicator - small text showing current mood */}
      <title>{`${city}: ${mood} (${new Date(timestamp).toLocaleTimeString()})`}</title>
      
      {/* Pulse ring when mood changes - Triple White Flash */}
      {isPulsing && (
        <circle
          cx={x}
          cy={y}
          r={1.5}
          fill="none"
          stroke="white"
          strokeWidth="0.8"
          opacity="1"
        >
          <animate
            attributeName="r"
            values="1.5;6"
            dur="0.4s"
            repeatCount="3"
            fill="freeze"
          />
          <animate
            attributeName="opacity"
            values="1;0"
            dur="0.4s"
            repeatCount="3"
            fill="freeze"
          />
        </circle>
      )}

      {/* Main mood dot - made much larger to be visible over listener dots */}
      <circle
        cx={x}
        cy={y}
        r={2.5}
        fill={currentColor}
        opacity="0.9"
        data-debug={debugLog}
      />

      {/* Subtle glow */}
      <circle
        cx={x}
        cy={y}
        r={4}
        fill={currentColor}
        opacity="0.3"
        filter="blur(0.2)"
      />
    </g>
  );
}
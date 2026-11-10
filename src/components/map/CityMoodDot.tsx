import { useEffect, useState } from "react";

interface CityMoodDotProps {
  city: string;
  lat: number;
  lng: number;
  mood: string;
  moodColor: string;
  timestamp: string;
  isPulsing: boolean;
  x: number;
  y: number;
}

export function CityMoodDot({ 
  city, 
  mood,
  moodColor,
  timestamp,
  isPulsing, 
  x, 
  y 
}: CityMoodDotProps) {
  const [currentColor, setCurrentColor] = useState<string>(moodColor);
  const [debugLog, setDebugLog] = useState<string>("");

  // Update color when mood changes
  useEffect(() => {
    const log = `[CityMoodDot] ${city}: ${mood} → ${moodColor} (${timestamp})`;
    console.log(log);
    setDebugLog(log);
    setCurrentColor(moodColor);
  }, [mood, moodColor, timestamp, city]);

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
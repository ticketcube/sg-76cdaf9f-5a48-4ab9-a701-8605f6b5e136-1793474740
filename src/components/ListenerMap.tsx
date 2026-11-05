import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

interface ListenerLocation {
  description: string;
  location: {
    lat: number;
    lon: number;
  };
  listeners: number;
}

interface ListenersData {
  total: number;
  unique: number;
  current: ListenerLocation[];
}

export function ListenerMap() {
  const [data, setData] = useState<ListenersData | null>(null);

  useEffect(() => {
    const fetchListeners = async () => {
      try {
        const response = await fetch("/api/analytics/listeners");
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch listeners:", error);
      }
    };

    fetchListeners();
    const interval = setInterval(fetchListeners, 30000);
    return () => clearInterval(interval);
  }, []);

  // Convert lat/lon to SVG coordinates (Equirectangular projection)
  const projectCoordinates = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
  };

  return (
    <div className="relative w-full h-[300px] bg-accent/30 rounded-lg overflow-hidden border border-muted/20">
      <svg
        viewBox="0 0 800 400"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* World map outline (simplified continents) */}
        <defs>
          <linearGradient id="mapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--muted))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <g stroke="hsl(var(--muted))" strokeWidth="0.5" opacity="0.2">
          {/* Latitude lines */}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`lat-${i}`}
              x1="0"
              y1={(i + 1) * 40}
              x2="800"
              y2={(i + 1) * 40}
            />
          ))}
          {/* Longitude lines */}
          {Array.from({ length: 11 }, (_, i) => (
            <line
              key={`lon-${i}`}
              x1={(i + 1) * 66.67}
              y1="0"
              x2={(i + 1) * 66.67}
              y2="400"
            />
          ))}
        </g>

        {/* Simplified continents outline */}
        <g fill="url(#mapGradient)" stroke="hsl(var(--muted))" strokeWidth="1" opacity="0.4">
          {/* North America */}
          <path d="M 100 80 Q 150 60 200 80 L 220 120 L 180 160 L 140 150 L 100 120 Z" />
          {/* South America */}
          <path d="M 200 200 L 230 240 L 210 300 L 180 310 L 170 260 Z" />
          {/* Europe */}
          <path d="M 380 80 L 420 70 L 450 90 L 440 120 L 400 110 Z" />
          {/* Africa */}
          <path d="M 400 140 L 440 160 L 460 220 L 420 260 L 380 240 L 390 180 Z" />
          {/* Asia */}
          <path d="M 480 60 Q 580 50 650 80 L 680 120 L 640 160 L 550 150 L 500 120 Z" />
          {/* Australia */}
          <path d="M 620 260 L 680 250 L 700 280 L 680 300 L 640 290 Z" />
        </g>

        {/* Listener antenna markers */}
        {data?.current.map((location, idx) => {
          const { x, y } = projectCoordinates(
            location.location.lat,
            location.location.lon
          );
          const size = Math.min(Math.max(location.listeners * 3, 8), 20);

          return (
            <g key={idx} className="animate-pulse">
              {/* Pulsing ring */}
              <circle
                cx={x}
                cy={y}
                r={size + 8}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                opacity="0.3"
              >
                <animate
                  attributeName="r"
                  from={size}
                  to={size + 12}
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Antenna dot */}
              <circle
                cx={x}
                cy={y}
                r={size / 2}
                fill="hsl(var(--primary))"
                opacity="0.8"
              />

              {/* Antenna signal waves */}
              <path
                d={`M ${x - size} ${y - size} Q ${x} ${y - size * 2} ${x + size} ${y - size}`}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <path
                d={`M ${x - size * 1.5} ${y - size * 1.5} Q ${x} ${y - size * 2.5} ${x + size * 1.5} ${y - size * 1.5}`}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                opacity="0.4"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
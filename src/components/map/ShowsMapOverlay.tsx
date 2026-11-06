import { useState, useEffect } from "react";
import { MapPin, ExternalLink, Calendar, MapPinned } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Show {
  id: string;
  artist_name: string;
  venue_name: string;
  city: string;
  lat: number;
  lng: number;
  show_date: string;
  ticket_url: string | null;
  ticket_status: string | null;
}

interface ShowsMapOverlayProps {
  width: number;
  height: number;
}

export function ShowsMapOverlay({ width, height }: ShowsMapOverlayProps) {
  const [enabled, setEnabled] = useState(false);
  const [shows, setShows] = useState<Show[]>([]);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [hoveredShow, setHoveredShow] = useState<string | null>(null);

  useEffect(() => {
    checkFeatureFlag();
    if (enabled) {
      fetchShows();
    }
  }, [enabled]);

  const checkFeatureFlag = async () => {
    try {
      const response = await fetch("/api/admin/feature-flags");
      const result = await response.json();
      const flag = result.data?.find((f: any) => f.flag_name === "shows_map_enabled");
      setEnabled(flag?.enabled || false);
    } catch (error) {
      console.error("Error checking shows_map_enabled flag:", error);
    }
  };

  const fetchShows = async () => {
    try {
      const response = await fetch("/api/shows/upcoming");
      if (!response.ok) return;
      const result = await response.json();
      setShows(result.data || []);
    } catch (error) {
      console.error("Error fetching shows:", error);
    }
  };

  const latLngToPixel = (lat: number, lng: number) => {
    // Mercator projection
    const x = ((lng + 180) / 360) * width;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = (height / 2) - (width * mercN) / (2 * Math.PI);
    return { x, y };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const getTicketStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; text: string }> = {
      "available": { variant: "default", text: "Tickets Available" },
      "few left": { variant: "secondary", text: "Few Left" },
      "resale only": { variant: "destructive", text: "Resale Only" }
    };

    const config = variants[status.toLowerCase()] || { variant: "secondary", text: status };
    return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>;
  };

  if (!enabled) return null;

  return (
    <>
      {/* Show pins */}
      <g className="pointer-events-auto">
        {shows.map(show => {
          const { x, y } = latLngToPixel(show.lat, show.lng);
          const isHovered = hoveredShow === show.id;
          const isSelected = selectedShow?.id === show.id;

          return (
            <g key={show.id}>
              {/* Pin glow effect */}
              {(isHovered || isSelected) && (
                <circle
                  cx={x}
                  cy={y}
                  r={20}
                  fill="hsl(var(--primary))"
                  opacity={0.2}
                  className="animate-pulse"
                />
              )}
              
              {/* Pin marker */}
              <g
                transform={`translate(${x}, ${y})`}
                onMouseEnter={() => setHoveredShow(show.id)}
                onMouseLeave={() => setHoveredShow(null)}
                onClick={() => setSelectedShow(selectedShow?.id === show.id ? null : show)}
                className="cursor-pointer transition-transform hover:scale-110"
                style={{ transformOrigin: "center" }}
              >
                <circle
                  r={8}
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                />
                <path
                  d="M-3,-2 L0,-5 L3,-2 L0,2 Z"
                  fill="hsl(var(--background))"
                  transform="translate(0, -1)"
                />
              </g>
            </g>
          );
        })}
      </g>

      {/* Selected show popup */}
      {selectedShow && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-auto max-w-md w-full mx-4">
          <Card className="border-2 border-primary shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">{selectedShow.artist_name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedShow.show_date)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedShow(null)}
                  className="text-muted hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPinned className="w-4 h-4 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">{selectedShow.venue_name}</div>
                  <div className="text-sm text-muted">{selectedShow.city}</div>
                </div>
              </div>

              {selectedShow.ticket_status && (
                <div className="flex items-center gap-2">
                  {getTicketStatusBadge(selectedShow.ticket_status)}
                </div>
              )}

              {selectedShow.ticket_url && (
                <Button
                  asChild
                  className="w-full"
                  size="lg"
                >
                  <a 
                    href={selectedShow.ticket_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    Get Tickets
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
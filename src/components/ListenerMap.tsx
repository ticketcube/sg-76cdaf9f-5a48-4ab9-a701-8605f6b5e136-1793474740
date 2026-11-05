import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, MapPin } from "lucide-react";

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
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchListeners();
    const interval = setInterval(fetchListeners, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bg-accent/50 border-muted/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Live Listeners</h3>
        </div>
        <div className="text-muted text-sm">Loading...</div>
      </Card>
    );
  }

  if (!data || data.total === 0) {
    return (
      <Card className="bg-accent/50 border-muted/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Live Listeners</h3>
        </div>
        <div className="text-4xl font-bold font-mono text-foreground mb-2">0</div>
        <div className="text-muted text-sm">No active listeners</div>
      </Card>
    );
  }

  const maxListeners = Math.max(...data.current.map(l => l.listeners));

  return (
    <Card className="bg-accent/50 border-muted/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Live Listeners</h3>
      </div>
      
      <div className="mb-6">
        <div className="text-4xl font-bold font-mono text-foreground mb-1">{data.total}</div>
        <div className="text-muted text-sm">
          {data.unique} {data.unique === 1 ? "location" : "locations"}
        </div>
      </div>

      {data.current.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted mb-2">
            <MapPin className="h-4 w-4" />
            <span>Listening from</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.current
              .sort((a, b) => b.listeners - a.listeners)
              .slice(0, 10)
              .map((location, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/90 truncate flex-1">
                    {location.description}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 bg-primary/20 rounded-full w-16 overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(location.listeners / maxListeners) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-muted w-6 text-right">
                      {location.listeners}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </Card>
  );
}
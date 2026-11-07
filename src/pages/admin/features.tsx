import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface FeatureFlag {
  id: string;
  flag_name: string;
  enabled: boolean;
  updated_at: string;
}

const FEATURE_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  mood_tracker_enabled: {
    title: "Mood Tracker",
    description: "Allow listeners to adjust their mood in real-time with emoji reactions. Moods are aggregated at the city level and displayed on the listener map."
  },
  shows_map_enabled: {
    title: "Shows Map Layer",
    description: "Display upcoming concert venues on the listener map with clickable pins that link to ticket purchase pages."
  }
};

export default function FeaturesPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/feature-flags");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Feature flags loaded:", result.data);
      setFlags(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching feature flags:", errorMessage);
      setError(errorMessage);
      toast.error(`Failed to load: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagName: string, currentState: boolean) => {
    setUpdating(flagName);
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag_name: flagName, enabled: !currentState })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update");
      }
      
      setFlags(prev => prev.map(f => 
        f.flag_name === flagName ? { ...f, enabled: !currentState } : f
      ));
      
      toast.success(`${FEATURE_DESCRIPTIONS[flagName]?.title || flagName} ${!currentState ? "enabled" : "disabled"}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating feature flag:", errorMessage);
      toast.error(`Failed to update: ${errorMessage}`);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <div className="container max-w-4xl mx-auto py-8 px-4">
          <div className="mb-8">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Feature Flags</h1>
            <p className="text-muted-foreground">Enable or disable experimental features for all users.</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading feature flags...</div>
            </div>
          )}

          {error && !loading && (
            <Card className="border-destructive">
              <CardContent className="py-6">
                <p className="text-destructive font-semibold">Error: {error}</p>
                <p className="text-sm text-muted-foreground mt-2">Make sure you're logged in as an admin user.</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && (
            <div className="grid gap-4">
              {flags.map(flag => {
                const info = FEATURE_DESCRIPTIONS[flag.flag_name];
                return (
                  <Card key={flag.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {info?.title || flag.flag_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {info?.description || "No description available"}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Switch
                            id={flag.flag_name}
                            checked={flag.enabled}
                            disabled={updating === flag.flag_name}
                            onCheckedChange={() => toggleFlag(flag.flag_name, flag.enabled)}
                          />
                          <Label
                            htmlFor={flag.flag_name}
                            className={`text-sm font-semibold cursor-pointer min-w-[40px] ${
                              flag.enabled ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {flag.enabled ? "ON" : "OFF"}
                          </Label>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}

              {flags.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No feature flags configured in database
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
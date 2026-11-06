import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.user_metadata?.role !== "admin")) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.user_metadata?.role === "admin") {
      fetchFlags();
    }
  }, [user]);

  const fetchFlags = async () => {
    try {
      const response = await fetch("/api/admin/feature-flags");
      if (!response.ok) throw new Error("Failed to fetch flags");
      const result = await response.json();
      setFlags(result.data || []);
    } catch (error) {
      console.error("Error fetching feature flags:", error);
      toast.error("Failed to load feature flags");
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

      if (!response.ok) throw new Error("Failed to update flag");
      
      const result = await response.json();
      setFlags(prev => prev.map(f => 
        f.flag_name === flagName ? { ...f, enabled: !currentState } : f
      ));
      
      toast.success(`${FEATURE_DESCRIPTIONS[flagName]?.title || flagName} ${!currentState ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Error updating feature flag:", error);
      toast.error("Failed to update feature flag");
    } finally {
      setUpdating(null);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-muted">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Feature Flags</h1>
          <p className="text-muted">Enable or disable experimental features for all users.</p>
        </div>

        <div className="grid gap-4">
          {flags.map(flag => {
            const info = FEATURE_DESCRIPTIONS[flag.flag_name];
            return (
              <Card key={flag.id}>
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
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={flag.flag_name}
                        checked={flag.enabled}
                        disabled={updating === flag.flag_name}
                        onCheckedChange={() => toggleFlag(flag.flag_name, flag.enabled)}
                      />
                      <Label
                        htmlFor={flag.flag_name}
                        className={`text-sm font-medium cursor-pointer ${
                          flag.enabled ? "text-primary" : "text-muted"
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
        </div>

        {flags.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted">
              No feature flags configured
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
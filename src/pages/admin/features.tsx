import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Plus, Trash2, RefreshCw } from "lucide-react";

interface FeatureFlag {
  id: string;
  flag_name: string;
  enabled: boolean;
  description: string | null;
}

interface MoodCategory {
  id: string;
  category_name: string;
  emoji: string;
  label: string;
  color_hsl: string;
  display_order: number;
  enabled: boolean;
}

export default function AdminFeatures() {
  const router = useRouter();
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [moods, setMoods] = useState<MoodCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch feature flags (explicitly handle all fields)
      const { data: flagsData, error: flagsError } = await supabase
        .from("feature_flags")
        .select("id, flag_name, enabled, description")
        .order("flag_name");

      if (flagsError) throw flagsError;
      setFlags(flagsData || []);

      // Fetch mood categories
      const { data: moodsData, error: moodsError } = await supabase
        .from("mood_categories")
        .select("*")
        .order("display_order");

      if (moodsError) throw moodsError;
      setMoods(moodsData || []);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load feature settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("feature_flags")
        .update({ enabled: !currentValue, updated_at: new Date().toISOString() })
        .eq("id", flagId);

      if (error) throw error;

      setFlags(flags.map(f => f.id === flagId ? { ...f, enabled: !currentValue } : f));

      toast({
        title: "Success",
        description: "Feature flag updated",
      });
    } catch (error: any) {
      console.error("Failed to toggle flag:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update feature flag",
        variant: "destructive",
      });
    }
  };

  const updateMood = (id: string, field: keyof MoodCategory, value: any) => {
    setMoods(moods.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const saveMoods = async () => {
    try {
      setSaving(true);

      const updates = moods.map(mood => ({
        id: mood.id,
        category_name: mood.category_name,
        emoji: mood.emoji,
        label: mood.label,
        color_hsl: mood.color_hsl,
        display_order: mood.display_order,
        enabled: mood.enabled,
      }));

      const { error } = await supabase
        .from("mood_categories")
        .upsert(updates);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Mood categories saved",
      });
    } catch (error: any) {
      console.error("Failed to save moods:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save mood categories",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addMood = async () => {
    try {
      const newOrder = Math.max(...moods.map(m => m.display_order), 0) + 1;
      
      const { data, error } = await supabase
        .from("mood_categories")
        .insert({
          category_name: `custom_${Date.now()}`,
          emoji: "🎵",
          label: "New Mood",
          color_hsl: "0 0% 50%",
          display_order: newOrder,
          enabled: true,
        })
        .select()
        .single();

      if (error) throw error;

      setMoods([...moods, data]);

      toast({
        title: "Success",
        description: "New mood category added",
      });
    } catch (error: any) {
      console.error("Failed to add mood:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add mood category",
        variant: "destructive",
      });
    }
  };

  const deleteMood = async (id: string) => {
    if (!confirm("Are you sure you want to delete this mood category?")) return;

    try {
      const { error } = await supabase
        .from("mood_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setMoods(moods.filter(m => m.id !== id));

      toast({
        title: "Success",
        description: "Mood category deleted",
      });
    } catch (error: any) {
      console.error("Failed to delete mood:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete mood category",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <Layout>
          <div className="flex items-center justify-center min-h-[50vh]">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Feature Management</h1>
              <p className="text-muted-foreground mt-1">
                Control feature flags and customize mood categories
              </p>
            </div>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Feature Flags Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable experimental features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flags.map((flag) => (
                <div key={flag.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`flag-${flag.id}`} className="font-mono text-sm">
                        {flag.flag_name}
                      </Label>
                      <Badge variant={flag.enabled ? "default" : "secondary"}>
                        {flag.enabled ? "ON" : "OFF"}
                      </Badge>
                    </div>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {flag.description}
                      </p>
                    )}
                  </div>
                  <Switch
                    id={`flag-${flag.id}`}
                    checked={flag.enabled}
                    onCheckedChange={() => toggleFlag(flag.id, flag.enabled)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Mood Categories Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mood Categories</CardTitle>
                  <CardDescription>
                    Customize mood emojis, labels, and map colors
                  </CardDescription>
                </div>
                <Button onClick={addMood} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Mood
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {moods.map((mood, index) => (
                <div key={mood.id} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{mood.emoji}</div>
                      <div>
                        <p className="font-semibold text-lg">{mood.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {mood.category_name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={mood.enabled ? "default" : "secondary"}>
                        {mood.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      <Button
                        onClick={() => deleteMood(mood.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`emoji-${mood.id}`}>Emoji</Label>
                      <Input
                        id={`emoji-${mood.id}`}
                        value={mood.emoji}
                        onChange={(e) => updateMood(mood.id, "emoji", e.target.value)}
                        className="text-2xl text-center"
                        maxLength={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`label-${mood.id}`}>Label</Label>
                      <Input
                        id={`label-${mood.id}`}
                        value={mood.label}
                        onChange={(e) => updateMood(mood.id, "label", e.target.value)}
                        placeholder="Mood name"
                      />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor={`color-${mood.id}`}>
                        Map Color (HSL format)
                      </Label>
                      <div className="flex gap-2">
                        <div
                          className="w-12 h-10 rounded border"
                          style={{ backgroundColor: `hsl(${mood.color_hsl})` }}
                        />
                        <Input
                          id={`color-${mood.id}`}
                          value={mood.color_hsl}
                          onChange={(e) => updateMood(mood.id, "color_hsl", e.target.value)}
                          placeholder="180 60% 50%"
                          className="flex-1 font-mono"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Format: H S% L% (e.g., "180 60% 50%" for teal)
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 col-span-2">
                      <Switch
                        id={`enabled-${mood.id}`}
                        checked={mood.enabled}
                        onCheckedChange={(checked) => updateMood(mood.id, "enabled", checked)}
                      />
                      <Label htmlFor={`enabled-${mood.id}`}>
                        Show in mood selector
                      </Label>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button onClick={saveMoods} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save All Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
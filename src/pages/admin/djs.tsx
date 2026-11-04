"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Radio, Calendar, Clock, ExternalLink, Settings, Save, Users } from "lucide-react";
import Link from "next/link";

interface DJ {
  user_id: string;
  email: string;
  display_name: string | null;
  username: string;
  created_at: string;
  is_admin: boolean;
  azuracast_streamer_username: string | null;
  azuracast_notes: string | null;
}

interface LiveStatus {
  is_live: boolean;
  streamer_name: string | null;
  dj_profile: {
    user_id: string;
    display_name: string;
    username: string;
  } | null;
  listeners: number;
  broadcast_start?: number;
  now_playing?: {
    title: string;
    artist: string;
  };
}

export default function DJsPage() {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingDJ, setEditingDJ] = useState<DJ | null>(null);
  const [saving, setSaving] = useState(false);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [formData, setFormData] = useState({
    azuracast_streamer_username: "",
    azuracast_notes: ""
  });

  const WEB_DJ_URL = "https://radio.onestowatch.live/public/otw_radio/dj";

  useEffect(() => {
    loadDJs();
    loadLiveStatus();
    
    // Refresh live status every 30 seconds
    const interval = setInterval(loadLiveStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDJs = async () => {
    setLoading(true);
    setError("");
    
    try {
      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("role", "otwl-dj")
        .order("display_name", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setDjs([]);
      } else {
        setDjs(data || []);
      }
    } catch (err) {
      setError("Failed to load DJs");
      setDjs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveStatus = async () => {
    try {
      const response = await fetch("/api/admin/live-djs");
      if (response.ok) {
        const data = await response.json();
        setLiveStatus(data);
      }
    } catch (err) {
      console.error("Failed to load live status:", err);
    }
  };

  const openEditDialog = (dj: DJ) => {
    setEditingDJ(dj);
    setFormData({
      azuracast_streamer_username: dj.azuracast_streamer_username || "",
      azuracast_notes: dj.azuracast_notes || ""
    });
  };

  const closeEditDialog = () => {
    setEditingDJ(null);
    setFormData({ azuracast_streamer_username: "", azuracast_notes: "" });
  };

  const saveCredentials = async () => {
    if (!editingDJ) return;
    
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          azuracast_streamer_username: formData.azuracast_streamer_username || null,
          azuracast_notes: formData.azuracast_notes || null
        })
        .eq("user_id", editingDJ.user_id);

      if (updateError) {
        setError(updateError.message);
      } else {
        await loadDJs();
        closeEditDialog();
      }
    } catch (err) {
      setError("Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const isDJLive = (dj: DJ): boolean => {
    return liveStatus?.is_live && 
           liveStatus.dj_profile?.user_id === dj.user_id;
  };

  const formatBroadcastTime = (timestamp?: number): string => {
    if (!timestamp) return "";
    const start = new Date(timestamp * 1000);
    const now = new Date();
    const minutes = Math.floor((now.getTime() - start.getTime()) / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="page-container">
        <div className="max-w-7xl mx-auto section-spacing">
          <div className="mb-8">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold flex items-center gap-3">
                  <Radio className="w-10 h-10 text-primary" />
                  DJ Management
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage DJ streaming access and credentials
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{djs.length}</div>
                <div className="text-sm text-muted-foreground">Total DJs</div>
              </div>
            </div>
          </div>

          {liveStatus?.is_live && (
            <Card className="mb-6 border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="relative">
                    <Radio className="w-5 h-5 text-primary" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  </div>
                  LIVE NOW
                </CardTitle>
                <CardDescription>
                  {liveStatus.dj_profile ? (
                    <span>
                      <strong>{liveStatus.dj_profile.display_name}</strong> is streaming
                    </span>
                  ) : (
                    <span>
                      Streamer: <strong>{liveStatus.streamer_name}</strong> (not matched to DJ profile)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{liveStatus.listeners}</span>
                    <span className="text-muted-foreground">listeners</span>
                  </div>
                  {liveStatus.broadcast_start && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        On air for {formatBroadcastTime(liveStatus.broadcast_start)}
                      </span>
                    </div>
                  )}
                  {liveStatus.now_playing && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>🎵</span>
                      <span>
                        {liveStatus.now_playing.artist} - {liveStatus.now_playing.title}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {djs.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No DJs found. Create DJ users from the{" "}
                        <Link href="/admin/users" className="text-primary hover:underline">
                          User Management
                        </Link>{" "}
                        page.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {djs.map((dj) => {
                    const isLive = isDJLive(dj);
                    
                    return (
                      <Card 
                        key={dj.user_id} 
                        className={`hover:border-primary/50 transition-colors ${
                          isLive ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-xl flex items-center gap-2">
                                <div className="relative">
                                  <Radio className="w-5 h-5 text-primary" />
                                  {isLive && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                    </span>
                                  )}
                                </div>
                                {dj.display_name || dj.username}
                                {isLive && (
                                  <Badge variant="default" className="ml-2">
                                    LIVE
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="font-mono text-xs mt-1">
                                {dj.email}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="default">DJ</Badge>
                              {dj.is_admin && (
                                <Badge variant="destructive">Admin</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">Member Since</div>
                                  <div className="font-medium text-foreground">
                                    {new Date(dj.created_at).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric"
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">AzuraCast Username</div>
                                  <div className="font-medium text-foreground font-mono">
                                    {dj.azuracast_streamer_username || "Not set"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Radio className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">Streaming Status</div>
                                  <div className="font-medium text-foreground">
                                    <Badge 
                                      variant={isLive ? "default" : dj.azuracast_streamer_username ? "outline" : "secondary"} 
                                      className="text-xs"
                                    >
                                      {isLive ? "🔴 Live Now" : dj.azuracast_streamer_username ? "Ready" : "Setup Required"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {dj.azuracast_notes && (
                              <div className="p-3 bg-muted/50 rounded-md border border-border">
                                <div className="text-xs text-muted-foreground mb-1">Admin Notes:</div>
                                <div className="text-sm">{dj.azuracast_notes}</div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(dj)}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Manage Credentials
                              </Button>
                              {dj.azuracast_streamer_username && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  asChild
                                >
                                  <a href={WEB_DJ_URL} target="_blank" rel="noopener noreferrer">
                                    <Radio className="w-4 h-4 mr-2" />
                                    Open Web DJ
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              DJ Streaming Setup
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Step 1:</strong> Create streamer account in{" "}
                <a 
                  href="https://radio.onestowatch.live/admin" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  AzuraCast Admin Panel
                </a>
              </p>
              <p>
                <strong>Step 2:</strong> Set the AzuraCast username here via "Manage Credentials"
              </p>
              <p>
                <strong>Step 3:</strong> Share login credentials securely with DJ
              </p>
              <p>
                <strong>Step 4:</strong> DJ clicks "Open Web DJ" to start streaming
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!editingDJ} onOpenChange={closeEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Streaming Credentials</DialogTitle>
            <DialogDescription>
              Set AzuraCast credentials for {editingDJ?.display_name || editingDJ?.username}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="azuracast_username">AzuraCast Streamer Username</Label>
              <Input
                id="azuracast_username"
                value={formData.azuracast_streamer_username}
                onChange={(e) => setFormData({ ...formData, azuracast_streamer_username: e.target.value })}
                placeholder="Enter AzuraCast username"
              />
              <p className="text-xs text-muted-foreground">
                The username created in AzuraCast Admin → Users & Accounts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="azuracast_notes">Admin Notes</Label>
              <Textarea
                id="azuracast_notes"
                value={formData.azuracast_notes}
                onChange={(e) => setFormData({ ...formData, azuracast_notes: e.target.value })}
                placeholder="Schedule preferences, special instructions, etc."
                rows={3}
              />
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <strong>Security Note:</strong> Password is managed in AzuraCast Admin Panel only. 
                Share credentials with DJ securely (encrypted email, password manager, etc.)
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveCredentials} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Credentials
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
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
import { Loader2, ArrowLeft, Radio, Calendar, Clock, ExternalLink, Settings, Save, Users, CheckCircle, AlertCircle } from "lucide-react";
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

interface DJStatus {
  user_id: string;
  display_name: string;
  username: string;
  email: string;
  azuracast_streamer_username: string;
  azuracast_display_name?: string;
  is_active_in_azuracast: boolean;
  has_azuracast_account: boolean;
  is_live: boolean;
  listeners?: number;
  broadcast_start?: number;
  now_playing?: {
    title: string;
    artist: string;
  };
  schedule_items?: Array<{
    start_time: number;
    end_time: number;
    days?: number[];
  }>;
}

interface LiveDJsResponse {
  djs: DJStatus[];
  total_djs: number;
  djs_with_azuracast_accounts: number;
  active_in_azuracast: number;
  live_count: number;
  unmatched_live_streamer?: {
    streamer_name: string;
    listeners: number;
    broadcast_start: number;
    now_playing: {
      title: string;
      artist: string;
    };
  } | null;
}

export default function DJsPage() {
  const [djStatuses, setDjStatuses] = useState<LiveDJsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingDJ, setEditingDJ] = useState<DJStatus | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    azuracast_streamer_username: "",
    azuracast_notes: ""
  });

  const WEB_DJ_URL = "https://radio.onestowatch.live/public/otw_radio/dj";

  useEffect(() => {
    loadDJStatuses();
    
    // Refresh DJ statuses every 30 seconds
    const interval = setInterval(loadDJStatuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDJStatuses = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/live-djs");
      if (response.ok) {
        const data = await response.json();
        setDjStatuses(data);
      } else {
        setError("Failed to load DJ statuses from AzuraCast");
      }
    } catch (err) {
      setError("Failed to connect to AzuraCast API");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (dj: DJStatus) => {
    setEditingDJ(dj);
    setFormData({
      azuracast_streamer_username: dj.azuracast_streamer_username || "",
      azuracast_notes: ""
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
      // Only update if user_id exists (linked to our database)
      if (editingDJ.user_id) {
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
          await loadDJStatuses();
          closeEditDialog();
        }
      } else {
        setError("This streamer is not linked to a user profile. Add them via User Management first.");
      }
    } catch (err) {
      setError("Failed to save credentials");
    } finally {
      setSaving(false);
    }
  };

  const getDJStatus = (dj: DJ): DJStatus | undefined => {
    return djStatuses?.djs.find(status => status.user_id === dj.user_id);
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

  const liveDJ = djStatuses?.djs.find(dj => dj.is_live);

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
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <div className="text-3xl font-bold text-primary">{djStatuses?.total_djs || 0}</div>
                  <div className="text-sm text-muted-foreground">Total DJs</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-500">{djStatuses?.djs_with_azuracast_accounts || 0}</div>
                  <div className="text-sm text-muted-foreground">With Accounts</div>
                </div>
              </div>
            </div>
          </div>

          {liveDJ && (
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
                  <strong>{liveDJ.display_name}</strong> is streaming
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{liveDJ.listeners}</span>
                    <span className="text-muted-foreground">listeners</span>
                  </div>
                  {liveDJ.broadcast_start && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        On air for {formatBroadcastTime(liveDJ.broadcast_start)}
                      </span>
                    </div>
                  )}
                  {liveDJ.now_playing && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>🎵</span>
                      <span>
                        {liveDJ.now_playing.artist} - {liveDJ.now_playing.title}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {djStatuses?.unmatched_live_streamer && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Unmatched Live Streamer:</strong> {djStatuses.unmatched_live_streamer.streamer_name} is currently streaming but not linked to any DJ profile. 
                Check the AzuraCast username in "Manage Credentials" to match them.
              </AlertDescription>
            </Alert>
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
              {!djStatuses?.djs || djStatuses.djs.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No streamers found in AzuraCast. Add streamers in{" "}
                        <a 
                          href="https://radio.onestowatch.live/admin" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          AzuraCast Admin Panel
                        </a>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {djStatuses.djs.map((dj) => {
                    const isLive = dj.is_live || false;
                    
                    return (
                      <Card 
                        key={dj.azuracast_streamer_username} 
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
                                {dj.display_name}
                                {isLive && (
                                  <Badge variant="default" className="ml-2">
                                    LIVE
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="font-mono text-xs mt-1">
                                {dj.email || dj.azuracast_streamer_username}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={dj.user_id ? "default" : "secondary"}>
                                {dj.user_id ? "Linked" : "AzuraCast Only"}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Radio className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">AzuraCast Username</div>
                                  <div className="font-medium text-foreground font-mono text-xs">
                                    {dj.azuracast_streamer_username}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">AzuraCast Display Name</div>
                                  <div className="font-medium text-foreground text-xs">
                                    {dj.azuracast_display_name || "Not set"}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Radio className="w-4 h-4" />
                                <div>
                                  <div className="text-xs">Status</div>
                                  <div className="font-medium text-foreground">
                                    <Badge 
                                      variant={isLive ? "default" : dj.is_active_in_azuracast ? "outline" : "secondary"} 
                                      className="text-xs"
                                    >
                                      {isLive ? "🔴 Live Now" : 
                                       dj.is_active_in_azuracast ? "✓ Active" : "⚠️ Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {dj.has_azuracast_account && !dj.is_active_in_azuracast && (
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  This streamer account is marked as inactive in AzuraCast. Activate it in AzuraCast Admin to enable streaming.
                                </AlertDescription>
                              </Alert>
                            )}

                            {!dj.user_id && (
                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  This streamer exists in AzuraCast but is not linked to a user profile. To manage them, create a user with matching AzuraCast username.
                                </AlertDescription>
                              </Alert>
                            )}

                            <div className="flex gap-2">
                              {dj.user_id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(dj)}
                                >
                                  <Settings className="w-4 h-4 mr-2" />
                                  Manage Credentials
                                </Button>
                              )}
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
                </a>{" "}
                (Settings → Users & Accounts → Add Streamer)
              </p>
              <p>
                <strong>Step 2:</strong> Set the exact AzuraCast username here via "Manage Credentials"
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
                placeholder="Enter exact AzuraCast username"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Must match exactly the username in AzuraCast Admin → Settings → Users & Accounts
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
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Password Management:</strong> Passwords are set in AzuraCast Admin Panel only. 
                Share credentials securely (encrypted email, password manager, etc.). 
                This system tracks username mapping for live status detection.
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
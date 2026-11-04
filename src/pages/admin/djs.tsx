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
import { Loader2, ArrowLeft, Radio, ExternalLink, Settings, Save, CheckCircle, AlertCircle, Key, User } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface Streamer {
  id: number;
  streamer_username: string;
  display_name: string;
  is_active: boolean;
  user_id?: string;
  email?: string;
  profile_display_name?: string;
}

interface StreamersResponse {
  streamers: Streamer[];
  total_count: number;
  active_count: number;
  linked_count: number;
}

export default function DJsPage() {
  const [streamers, setStreamers] = useState<StreamersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    notes: ""
  });
  const { toast } = useToast();

  const WEB_DJ_URL = "https://radio.onestowatch.live/public/otw_radio/dj";
  const AZURACAST_ADMIN = "https://radio.onestowatch.live/admin";

  useEffect(() => {
    loadStreamers();
  }, []);

  const loadStreamers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/live-djs");
      if (response.ok) {
        const data = await response.json();
        setStreamers(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load streamers from AzuraCast",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to connect to AzuraCast API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (streamer: Streamer) => {
    setEditingStreamer(streamer);
    setFormData({
      display_name: streamer.profile_display_name || streamer.display_name,
      notes: ""
    });
  };

  const closeEditDialog = () => {
    setEditingStreamer(null);
    setFormData({ display_name: "", notes: "" });
  };

  const saveCredentials = async () => {
    if (!editingStreamer?.user_id) {
      toast({
        title: "Error",
        description: "This streamer is not linked to a user profile",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          display_name: formData.display_name || null,
          azuracast_notes: formData.notes || null
        })
        .eq("user_id", editingStreamer.user_id);

      if (updateError) {
        toast({
          title: "Error",
          description: updateError.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Streamer profile updated"
        });
        await loadStreamers();
        closeEditDialog();
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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
                  Streamer Accounts
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage DJ streaming credentials and access
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-right">
                <div>
                  <div className="text-3xl font-bold">{streamers?.total_count || 0}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-500">{streamers?.active_count || 0}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">{streamers?.linked_count || 0}</div>
                  <div className="text-sm text-muted-foreground">Linked</div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {!streamers?.streamers || streamers.streamers.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center space-y-4">
                      <Radio className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground mb-2">
                          No streamers found in AzuraCast
                        </p>
                        <Button variant="outline" asChild>
                          <a href={AZURACAST_ADMIN} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Add Streamers in AzuraCast
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {streamers.streamers.map((streamer) => (
                    <Card key={streamer.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                              <User className="w-5 h-5 text-primary" />
                              {streamer.profile_display_name || streamer.display_name}
                              <Badge variant={streamer.is_active ? "default" : "secondary"} className="ml-2">
                                {streamer.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </CardTitle>
                            <CardDescription className="font-mono text-xs mt-1">
                              {streamer.email || `@${streamer.streamer_username}`}
                            </CardDescription>
                          </div>
                          <Badge variant={streamer.user_id ? "outline" : "secondary"}>
                            {streamer.user_id ? "Linked to Profile" : "AzuraCast Only"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">AzuraCast Username</div>
                              <div className="font-mono font-semibold text-sm">{streamer.streamer_username}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Display Name</div>
                              <div className="font-semibold text-sm">{streamer.display_name}</div>
                            </div>
                          </div>

                          {!streamer.is_active && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                This account is inactive. Enable in{" "}
                                <a href={AZURACAST_ADMIN} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                  AzuraCast Admin
                                </a>{" "}
                                to allow streaming.
                              </AlertDescription>
                            </Alert>
                          )}

                          {!streamer.user_id && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription className="text-xs">
                                Not linked to a user profile. Create a user in{" "}
                                <Link href="/admin/users" className="text-primary hover:underline">
                                  User Management
                                </Link>{" "}
                                and set their AzuraCast username to <code className="font-mono bg-muted px-1 rounded">{streamer.streamer_username}</code>
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="flex gap-2">
                            {streamer.user_id && (
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(streamer)}>
                                <Settings className="w-4 h-4 mr-2" />
                                Edit Profile
                              </Button>
                            )}
                            <Button variant="default" size="sm" asChild>
                              <a href={WEB_DJ_URL} target="_blank" rel="noopener noreferrer">
                                <Radio className="w-4 h-4 mr-2" />
                                Web DJ Login
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </a>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <a href={`${AZURACAST_ADMIN}#/station/otw_radio/streamers`} target="_blank" rel="noopener noreferrer">
                                <Key className="w-4 h-4 mr-2" />
                                Manage in AzuraCast
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-border">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
              <Key className="w-5 h-5 text-primary" />
              Streamer Account Setup
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="font-semibold text-primary shrink-0">Step 1:</span>
                <div>
                  Create streamer account in{" "}
                  <a href={AZURACAST_ADMIN} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    AzuraCast Admin
                  </a>{" "}
                  (Settings → Streamers/DJs → Add Streamer)
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-primary shrink-0">Step 2:</span>
                <div>
                  Set username and password in AzuraCast (passwords are managed there only)
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-primary shrink-0">Step 3:</span>
                <div>
                  Create matching user profile in{" "}
                  <Link href="/admin/users" className="text-primary hover:underline">
                    User Management
                  </Link>{" "}
                  and set their AzuraCast username to match
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-semibold text-primary shrink-0">Step 4:</span>
                <div>
                  Share credentials securely with the DJ (encrypted messaging, password manager)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!editingStreamer} onOpenChange={closeEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Streamer Profile</DialogTitle>
            <DialogDescription>
              Update display name and notes for {editingStreamer?.streamer_username}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Username & Password:</strong> Managed in{" "}
                <a href={AZURACAST_ADMIN} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  AzuraCast Admin
                </a>{" "}
                only. This updates profile display info.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Friendly name for this DJ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Schedule preferences, contact info, special instructions..."
                rows={3}
              />
            </div>
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
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
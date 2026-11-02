"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Calendar, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AzuraCastPlaylist {
  id: number;
  name: string;
  short_name: string;
  type: string;
  is_enabled: boolean;
  is_jingle: boolean;
  weight: number;
  schedule_count: number;
  schedule_items: Array<{
    id: number;
    start_time: number;
    end_time: number;
    days: number[];
  }>;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")}${period}`;
}

export default function PlaylistManagementPage() {
  const [playlists, setPlaylists] = useState<AzuraCastPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<AzuraCastPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/playlists");
      if (!response.ok) {
        throw new Error("Failed to fetch playlists");
      }
      const data = await response.json();
      setPlaylists(data);
      
      if (data.length > 0 && !selectedPlaylist) {
        setSelectedPlaylist(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const azuracastUrl = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://radio.onestowatch.live";

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Playlist Management</h1>
              <p className="text-muted">View playlists configured in AzuraCast</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={fetchPlaylists}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button asChild>
                <a 
                  href={`${azuracastUrl}/admin/station/1/playlists`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage in AzuraCast
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Playlists List */}
            <Card>
              <CardHeader>
                <CardTitle>Active Playlists</CardTitle>
                <CardDescription>
                  Playlists are managed in AzuraCast admin. Changes made there will appear here.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted">Loading playlists from AzuraCast...</p>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 mx-auto mb-4 text-muted" />
                    <p className="text-sm text-muted mb-4">No playlists found in AzuraCast</p>
                    <Button asChild variant="outline">
                      <a 
                        href={`${azuracastUrl}/admin/station/1/playlists`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Create Playlist in AzuraCast
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlists.map((playlist) => (
                      <div
                        key={playlist.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPlaylist?.id === playlist.id
                            ? "bg-accent border-primary"
                            : "hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedPlaylist(playlist)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold">{playlist.name}</p>
                              {!playlist.is_enabled && (
                                <Badge variant="outline" className="text-xs">Disabled</Badge>
                              )}
                              {playlist.is_jingle && (
                                <Badge variant="secondary" className="text-xs">Jingle</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted">
                              Type: {playlist.type} • Weight: {playlist.weight}
                            </p>
                            {playlist.schedule_count > 0 && (
                              <p className="text-xs text-muted mt-1">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {playlist.schedule_count} schedule {playlist.schedule_count === 1 ? "slot" : "slots"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Details */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Schedule Slots
                </CardTitle>
                <CardDescription>
                  When this playlist airs during the week
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedPlaylist ? (
                  <p className="text-sm text-muted">Select a playlist to view schedule</p>
                ) : selectedPlaylist.schedule_items.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-muted" />
                    <p className="text-sm text-muted mb-4">
                      This playlist has no scheduled time slots
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <a 
                        href={`${azuracastUrl}/admin/station/1/playlists/edit/${selectedPlaylist.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Add Schedule in AzuraCast
                      </a>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPlaylist.schedule_items.map((slot) => (
                      <div key={slot.id} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted" />
                            <p className="font-semibold text-sm">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {slot.days.length === 7 ? (
                            <Badge variant="secondary" className="text-xs">Every day</Badge>
                          ) : slot.days.length === 0 ? (
                            <Badge variant="outline" className="text-xs">No specific days</Badge>
                          ) : (
                            slot.days.map((day) => (
                              <Badge key={day} variant="outline" className="text-xs">
                                {DAYS[day - 1]}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <a 
                        href={`${azuracastUrl}/admin/station/1/playlists/edit/${selectedPlaylist.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Edit in AzuraCast
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {selectedPlaylist && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Playlist Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted mb-1">ID</p>
                    <p className="font-mono text-sm">{selectedPlaylist.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Short Name</p>
                    <p className="font-mono text-sm">{selectedPlaylist.short_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Type</p>
                    <p className="text-sm">{selectedPlaylist.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted mb-1">Status</p>
                    <Badge variant={selectedPlaylist.is_enabled ? "default" : "secondary"}>
                      {selectedPlaylist.is_enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
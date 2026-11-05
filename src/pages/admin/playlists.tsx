"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Music, Calendar, Clock, ExternalLink, Plus, Loader2, Search, FileAudio, Info, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface ScheduleItem {
  id?: number;
  start_time: number;
  end_time: number;
  days: number[];
  start_date?: string | null;
  end_date?: string | null;
  loop_once?: boolean;
}

interface AzuraCastPlaylist {
  id: number;
  name: string;
  short_name: string;
  type: string;
  is_enabled: boolean;
  is_jingle: boolean;
  weight: number;
  schedule_count: number;
  schedule_items: ScheduleItem[];
}

interface MediaFile {
  unique_id: string;
  song_id: string;
  text: string;
  artist: string;
  title: string;
  album: string;
  length: number;
  length_text: string;
  art?: string;
  playlists?: number[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PLAYLIST_TYPES = [
  { value: "default", label: "Standard Rotation" },
  { value: "once_per_x_songs", label: "Once per X Songs" },
  { value: "once_per_x_minutes", label: "Once per X Minutes" },
  { value: "once_per_hour", label: "Once per Hour" },
  { value: "advanced", label: "Advanced (Liquidsoap)" }
];

const PLAYLIST_ORDER = [
  { value: "shuffle", label: "Shuffled" },
  { value: "random", label: "Random" },
  { value: "sequential", label: "Sequential" }
];

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
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [filteredMedia, setFilteredMedia] = useState<MediaFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assigningMedia, setAssigningMedia] = useState<string | null>(null);
  const { toast } = useToast();

  // Playlist creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    name: "",
    type: "default" as string,
    order: "shuffle" as string,
    weight: 3,
    is_enabled: true
  });

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/playlists");
      if (!response.ok) throw new Error("Failed to fetch playlists");
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

  const fetchMedia = async () => {
    setLoadingMedia(true);
    try {
      const response = await fetch("/api/media");
      if (!response.ok) throw new Error("Failed to fetch media");
      const data = await response.json();
      setMediaFiles(data);
      setFilteredMedia(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      fetchMedia();
    }
  }, [selectedPlaylist]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredMedia(mediaFiles);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMedia(
        mediaFiles.filter(
          (file) =>
            file.title.toLowerCase().includes(query) ||
            file.artist.toLowerCase().includes(query) ||
            file.album.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, mediaFiles]);

  const createPlaylist = async () => {
    if (!newPlaylist.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Playlist name is required",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/playlists/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlists: [{
            name: newPlaylist.name,
            type: newPlaylist.type,
            source: "songs",
            order: newPlaylist.order,
            weight: newPlaylist.weight,
            is_enabled: newPlaylist.is_enabled,
            is_jingle: false,
            avoid_duplicates: true,
            include_in_requests: true,
            include_in_on_demand: false,
            schedule_items: []
          }]
        })
      });

      if (!response.ok) throw new Error("Failed to create playlist");

      toast({
        title: "Success",
        description: `Playlist "${newPlaylist.name}" created successfully`
      });

      setShowCreateForm(false);
      setNewPlaylist({
        name: "",
        type: "default",
        order: "shuffle",
        weight: 3,
        is_enabled: true
      });
      await fetchPlaylists();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleMediaInPlaylist = async (mediaId: string, currentlyInPlaylist: boolean) => {
    if (!selectedPlaylist) return;
    
    setAssigningMedia(mediaId);
    try {
      const response = await fetch(`/api/media/${mediaId}/playlists`, {
        method: currentlyInPlaylist ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist_id: selectedPlaylist.id })
      });

      if (!response.ok) throw new Error("Failed to update media assignment");

      toast({
        title: "Success",
        description: currentlyInPlaylist 
          ? "Track removed from playlist" 
          : "Track added to playlist"
      });

      await fetchMedia();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAssigningMedia(null);
    }
  };

  const isMediaInPlaylist = (media: MediaFile): boolean => {
    if (!selectedPlaylist || !media.playlists) return false;
    return media.playlists.includes(selectedPlaylist.id);
  };

  const azuracastUrl = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://radio.onestowatch.live";

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Playlist Management</h1>
              <p className="text-muted-foreground">
                Create playlists and assign media. Schedule in AzuraCast admin.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <a 
                  href={`${azuracastUrl}/admin/station/2/playlists`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  AzuraCast Admin
                </a>
              </Button>
              {!showCreateForm && (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Playlist
                </Button>
              )}
            </div>
          </div>

          {showCreateForm && (
            <Card className="mb-6 border-primary">
              <CardHeader>
                <CardTitle>Create New Playlist</CardTitle>
                <CardDescription>
                  Basic playlist setup. Configure schedule in AzuraCast admin after creation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Playlist Name *</Label>
                      <Input
                        placeholder="e.g., Morning Mix"
                        value={newPlaylist.name}
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newPlaylist.type}
                        onValueChange={(value) => setNewPlaylist({ ...newPlaylist, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAYLIST_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Play Order</Label>
                      <Select
                        value={newPlaylist.order}
                        onValueChange={(value) => setNewPlaylist({ ...newPlaylist, order: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLAYLIST_ORDER.map((order) => (
                            <SelectItem key={order.value} value={order.value}>
                              {order.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Weight (1-25)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="25"
                        value={newPlaylist.weight}
                        onChange={(e) => setNewPlaylist({ ...newPlaylist, weight: parseInt(e.target.value) || 3 })}
                      />
                      <p className="text-xs text-muted-foreground">Higher weight = plays more often</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={newPlaylist.is_enabled}
                      onCheckedChange={(checked) => setNewPlaylist({ ...newPlaylist, is_enabled: checked })}
                    />
                    <Label htmlFor="enabled">Enable playlist immediately</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createPlaylist} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Playlist
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Playlists List */}
            <Card>
              <CardHeader>
                <CardTitle>Playlists</CardTitle>
                <CardDescription>
                  {playlists.length} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted" />
                  </div>
                ) : playlists.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 mx-auto mb-4 text-muted" />
                    <p className="text-sm text-muted-foreground mb-4">No playlists yet</p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Playlist
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
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
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">{playlist.name}</p>
                              {!playlist.is_enabled && (
                                <Badge variant="outline" className="text-xs shrink-0">Disabled</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {playlist.type} • Weight {playlist.weight}
                            </p>
                            {playlist.schedule_count > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {playlist.schedule_count} schedule{playlist.schedule_count === 1 ? "" : "s"}
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

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {selectedPlaylist ? (
                <Tabs defaultValue="media" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="media">
                      <FileAudio className="w-4 h-4 mr-2" />
                      Media
                    </TabsTrigger>
                    <TabsTrigger value="schedule">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </TabsTrigger>
                    <TabsTrigger value="docs">
                      <Info className="w-4 h-4 mr-2" />
                      Docs
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="media" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Assign Media to {selectedPlaylist.name}</CardTitle>
                        <CardDescription>
                          Add or remove tracks from this playlist
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-muted-foreground" />
                            <Input
                              placeholder="Search by title, artist, or album..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>

                          {loadingMedia ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin text-muted" />
                            </div>
                          ) : filteredMedia.length === 0 ? (
                            <div className="text-center py-8">
                              <FileAudio className="w-12 h-12 mx-auto mb-4 text-muted" />
                              <p className="text-sm text-muted-foreground">
                                {searchQuery ? "No tracks match your search" : "No media files found"}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                              {filteredMedia.map((file) => {
                                const inPlaylist = isMediaInPlaylist(file);
                                return (
                                  <div
                                    key={file.unique_id}
                                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {file.art ? (
                                        <img
                                          src={file.art}
                                          alt=""
                                          className="w-10 h-10 rounded object-cover shrink-0"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0">
                                          <Music className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">{file.title || "Unknown"}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {file.artist || "Unknown Artist"} • {file.length_text}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant={inPlaylist ? "default" : "outline"}
                                      onClick={() => toggleMediaInPlaylist(file.unique_id, inPlaylist)}
                                      disabled={assigningMedia === file.unique_id}
                                    >
                                      {assigningMedia === file.unique_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : inPlaylist ? (
                                        <>
                                          <Check className="w-4 h-4 mr-1" />
                                          Added
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="w-4 h-4 mr-1" />
                                          Add
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="schedule">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Schedule (Read-Only)</CardTitle>
                            <CardDescription>
                              Managed in AzuraCast admin. {selectedPlaylist.schedule_count} slot{selectedPlaylist.schedule_count === 1 ? "" : "s"} configured.
                            </CardDescription>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <a 
                              href={`${azuracastUrl}/admin/station/2/playlists/edit/${selectedPlaylist.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Edit in AzuraCast
                            </a>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {selectedPlaylist.schedule_items.length === 0 ? (
                          <div className="text-center py-8">
                            <Clock className="w-12 h-12 mx-auto mb-4 text-muted" />
                            <p className="text-sm text-muted-foreground mb-4">
                              No schedule configured
                            </p>
                            <p className="text-xs text-muted-foreground mb-4">
                              Add schedule slots in AzuraCast to control when this playlist airs
                            </p>
                            <Button asChild variant="outline" size="sm">
                              <a 
                                href={`${azuracastUrl}/admin/station/2/playlists/edit/${selectedPlaylist.id}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Configure Schedule
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedPlaylist.schedule_items.map((slot, idx) => (
                              <div key={idx} className="p-3 rounded-lg border">
                                <div className="flex items-center gap-2 mb-2">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <p className="font-semibold text-sm">
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)} PT
                                  </p>
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
                                {(slot.start_date || slot.end_date) && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {slot.start_date && `From ${slot.start_date}`}
                                    {slot.start_date && slot.end_date && " "}
                                    {slot.end_date && `Until ${slot.end_date}`}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="docs">
                    <Card>
                      <CardHeader>
                        <CardTitle>AzuraCast Scheduling Reference</CardTitle>
                        <CardDescription>
                          Understanding playlist types and scheduling options
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>Scheduling in AzuraCast</AlertTitle>
                          <AlertDescription>
                            All schedule configuration happens in the AzuraCast admin interface. This page is for creating playlists and assigning media only.
                          </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold mb-2">Playlist Types</h3>
                            <ul className="space-y-2 text-sm">
                              <li className="flex gap-2">
                                <Badge variant="outline" className="shrink-0">default</Badge>
                                <span className="text-muted-foreground">Standard rotation playlist. Plays based on weight.</span>
                              </li>
                              <li className="flex gap-2">
                                <Badge variant="outline" className="shrink-0">once_per_x_songs</Badge>
                                <span className="text-muted-foreground">Plays once every X songs (e.g., station ID every 20 tracks).</span>
                              </li>
                              <li className="flex gap-2">
                                <Badge variant="outline" className="shrink-0">once_per_x_minutes</Badge>
                                <span className="text-muted-foreground">Plays once every X minutes (e.g., news every 30 min).</span>
                              </li>
                              <li className="flex gap-2">
                                <Badge variant="outline" className="shrink-0">once_per_hour</Badge>
                                <span className="text-muted-foreground">Plays at specific minute of each hour (e.g., :00, :15, :30, :45).</span>
                              </li>
                              <li className="flex gap-2">
                                <Badge variant="outline" className="shrink-0">advanced</Badge>
                                <span className="text-muted-foreground">Custom Liquidsoap code for complex scheduling.</span>
                              </li>
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">Schedule Options</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              <li><strong>Time Range:</strong> Start and end time in Pacific Time (PT)</li>
                              <li><strong>Days:</strong> Select specific days (Mon-Sun) or leave empty for no day restriction</li>
                              <li><strong>Date Range:</strong> Optional start/end dates for seasonal or event playlists</li>
                              <li><strong>Loop Once:</strong> Play all tracks once then stop (useful for special events)</li>
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-semibold mb-2">Weight System</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Weight (1-25) determines how often a playlist plays relative to others:
                            </p>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              <li>• Higher weight = plays more frequently</li>
                              <li>• Example: Weight 10 playlist plays twice as often as weight 5</li>
                              <li>• Use for balancing new releases vs. catalog</li>
                            </ul>
                          </div>

                          <Button asChild variant="outline" className="w-full">
                            <a 
                              href={`${azuracastUrl}/admin/station/2/playlists`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open AzuraCast Playlist Manager
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Music className="w-16 h-16 mx-auto mb-4 text-muted" />
                    <p className="text-muted-foreground mb-4">
                      {playlists.length === 0 
                        ? "Create your first playlist to get started"
                        : "Select a playlist to manage media"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
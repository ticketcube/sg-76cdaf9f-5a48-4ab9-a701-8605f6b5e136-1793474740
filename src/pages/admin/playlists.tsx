"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Music, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_title: string;
  artist_name: string;
  duration_seconds: number;
  order_position: number;
  spotify_url: string | null;
  created_at: string;
}

interface ScheduleSlot {
  id: string;
  playlist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  block_name: string;
  created_at: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const BLOCKS = [
  { name: "Morning Drive", start: "06:00", end: "10:00" },
  { name: "Midday", start: "10:00", end: "14:00" },
  { name: "Afternoon Drive", start: "14:00", end: "18:00" },
  { name: "Evening", start: "18:00", end: "22:00" },
  { name: "Late Night", start: "22:00", end: "02:00" }
];

export default function PlaylistManagementPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form states
  const [playlistForm, setPlaylistForm] = useState({ name: "", description: "" });
  const [trackForm, setTrackForm] = useState({
    track_title: "",
    artist_name: "",
    duration_seconds: 180,
    spotify_url: ""
  });
  const [scheduleForm, setScheduleForm] = useState({
    day_of_week: 1,
    block_name: "Morning Drive",
    start_time: "06:00",
    end_time: "10:00"
  });

  useEffect(() => {
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      fetchTracks(selectedPlaylist.id);
      fetchScheduleSlots(selectedPlaylist.id);
    }
  }, [selectedPlaylist]);

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
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

  const fetchTracks = async (playlistId: string) => {
    try {
      const { data, error } = await supabase
        .from("playlist_tracks")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("order_position", { ascending: true });

      if (error) throw error;
      setTracks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchScheduleSlots = async (playlistId: string) => {
    try {
      const { data, error } = await supabase
        .from("schedule_slots")
        .select("*")
        .eq("playlist_id", playlistId)
        .order("day_of_week", { ascending: true });

      if (error) throw error;
      setScheduleSlots(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createPlaylist = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("playlists")
        .insert([{
          name: playlistForm.name,
          description: playlistForm.description || null,
          created_by: userData.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setPlaylists([data, ...playlists]);
      setPlaylistForm({ name: "", description: "" });
      setCreateDialogOpen(false);

      toast({
        title: "Success",
        description: "Playlist created successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deletePlaylist = async (id: string) => {
    if (!confirm("Are you sure? This will delete all tracks and schedule assignments.")) return;

    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPlaylists(playlists.filter(p => p.id !== id));
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null);
        setTracks([]);
        setScheduleSlots([]);
      }

      toast({
        title: "Success",
        description: "Playlist deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addTrack = async () => {
    if (!selectedPlaylist) return;

    try {
      const nextPosition = tracks.length > 0 ? Math.max(...tracks.map(t => t.order_position)) + 1 : 1;

      const { data, error } = await supabase
        .from("playlist_tracks")
        .insert([{
          playlist_id: selectedPlaylist.id,
          track_title: trackForm.track_title,
          artist_name: trackForm.artist_name,
          duration_seconds: trackForm.duration_seconds,
          order_position: nextPosition,
          spotify_url: trackForm.spotify_url || null
        }])
        .select()
        .single();

      if (error) throw error;

      setTracks([...tracks, data]);
      setTrackForm({
        track_title: "",
        artist_name: "",
        duration_seconds: 180,
        spotify_url: ""
      });
      setTrackDialogOpen(false);

      toast({
        title: "Success",
        description: "Track added to playlist"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteTrack = async (id: string) => {
    try {
      const { error } = await supabase
        .from("playlist_tracks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTracks(tracks.filter(t => t.id !== id));

      toast({
        title: "Success",
        description: "Track removed from playlist"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addScheduleSlot = async () => {
    if (!selectedPlaylist) return;

    try {
      const { data, error } = await supabase
        .from("schedule_slots")
        .insert([{
          playlist_id: selectedPlaylist.id,
          day_of_week: scheduleForm.day_of_week,
          block_name: scheduleForm.block_name,
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time
        }])
        .select()
        .single();

      if (error) throw error;

      setScheduleSlots([...scheduleSlots, data]);
      setScheduleDialogOpen(false);

      toast({
        title: "Success",
        description: "Schedule slot added"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteScheduleSlot = async (id: string) => {
    try {
      const { error } = await supabase
        .from("schedule_slots")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setScheduleSlots(scheduleSlots.filter(s => s.id !== id));

      toast({
        title: "Success",
        description: "Schedule slot removed"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Playlist Management</h1>
            <p className="text-muted">Create and schedule playlists for OTW Radio programming</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Playlists List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Playlists</CardTitle>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Playlist</DialogTitle>
                        <DialogDescription>Add a new playlist to your radio programming</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <Label htmlFor="name">Playlist Name</Label>
                          <Input
                            id="name"
                            value={playlistForm.name}
                            onChange={(e) => setPlaylistForm({ ...playlistForm, name: e.target.value })}
                            placeholder="e.g., Morning Mix"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={playlistForm.description}
                            onChange={(e) => setPlaylistForm({ ...playlistForm, description: e.target.value })}
                            placeholder="Optional description"
                            rows={3}
                          />
                        </div>
                        <Button onClick={createPlaylist} className="w-full">Create Playlist</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted">Loading...</p>
                ) : playlists.length === 0 ? (
                  <p className="text-sm text-muted">No playlists yet. Create one to get started.</p>
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
                            <p className="font-semibold">{playlist.name}</p>
                            {playlist.description && (
                              <p className="text-xs text-muted mt-1">{playlist.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePlaylist(playlist.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tracks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    <Music className="w-5 h-5 inline mr-2" />
                    Tracks
                  </CardTitle>
                  {selectedPlaylist && (
                    <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Track
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Track</DialogTitle>
                          <DialogDescription>Add a new track to {selectedPlaylist.name}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="track_title">Track Title</Label>
                            <Input
                              id="track_title"
                              value={trackForm.track_title}
                              onChange={(e) => setTrackForm({ ...trackForm, track_title: e.target.value })}
                              placeholder="Song name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="artist_name">Artist Name</Label>
                            <Input
                              id="artist_name"
                              value={trackForm.artist_name}
                              onChange={(e) => setTrackForm({ ...trackForm, artist_name: e.target.value })}
                              placeholder="Artist or band"
                            />
                          </div>
                          <div>
                            <Label htmlFor="duration">Duration (seconds)</Label>
                            <Input
                              id="duration"
                              type="number"
                              value={trackForm.duration_seconds}
                              onChange={(e) => setTrackForm({ ...trackForm, duration_seconds: parseInt(e.target.value) })}
                              placeholder="180"
                            />
                          </div>
                          <div>
                            <Label htmlFor="spotify_url">Spotify URL (optional)</Label>
                            <Input
                              id="spotify_url"
                              value={trackForm.spotify_url}
                              onChange={(e) => setTrackForm({ ...trackForm, spotify_url: e.target.value })}
                              placeholder="https://open.spotify.com/track/..."
                            />
                          </div>
                          <Button onClick={addTrack} className="w-full">Add Track</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedPlaylist ? (
                  <p className="text-sm text-muted">Select a playlist to view tracks</p>
                ) : tracks.length === 0 ? (
                  <p className="text-sm text-muted">No tracks yet. Add tracks to this playlist.</p>
                ) : (
                  <div className="space-y-2">
                    {tracks.map((track, index) => (
                      <div key={track.id} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                              <p className="font-semibold text-sm">{track.track_title}</p>
                            </div>
                            <p className="text-xs text-muted mt-1">{track.artist_name}</p>
                            <p className="text-xs text-muted mt-1">{formatDuration(track.duration_seconds)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTrack(track.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Slots */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    <Calendar className="w-5 h-5 inline mr-2" />
                    Schedule
                  </CardTitle>
                  {selectedPlaylist && (
                    <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Slot
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Schedule Slot</DialogTitle>
                          <DialogDescription>Assign {selectedPlaylist.name} to a time slot</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="day">Day of Week</Label>
                            <Select
                              value={scheduleForm.day_of_week.toString()}
                              onValueChange={(value) => setScheduleForm({ ...scheduleForm, day_of_week: parseInt(value) })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS.map((day, index) => (
                                  <SelectItem key={index} value={(index + 1).toString()}>
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="block">Programming Block</Label>
                            <Select
                              value={scheduleForm.block_name}
                              onValueChange={(value) => {
                                const block = BLOCKS.find(b => b.name === value);
                                if (block) {
                                  setScheduleForm({
                                    ...scheduleForm,
                                    block_name: value,
                                    start_time: block.start,
                                    end_time: block.end
                                  });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BLOCKS.map((block) => (
                                  <SelectItem key={block.name} value={block.name}>
                                    {block.name} ({block.start} - {block.end})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={addScheduleSlot} className="w-full">Add to Schedule</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedPlaylist ? (
                  <p className="text-sm text-muted">Select a playlist to view schedule</p>
                ) : scheduleSlots.length === 0 ? (
                  <p className="text-sm text-muted">Not scheduled yet. Add this playlist to the programming grid.</p>
                ) : (
                  <div className="space-y-2">
                    {scheduleSlots.map((slot) => (
                      <div key={slot.id} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{DAYS[slot.day_of_week - 1]}</p>
                            <p className="text-xs text-muted mt-1">{slot.block_name}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-muted" />
                              <p className="text-xs text-muted">
                                {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteScheduleSlot(slot.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
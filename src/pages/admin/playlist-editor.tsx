"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Download, Plus, Trash2, ExternalLink, Copy, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Schedule {
  start_time: number;
  end_time: number;
  days: number[];
  start_date: string | null;
  end_date: string | null;
  loop_once: boolean;
  prevent_requests: boolean;
  reset_queue_at_start: boolean;
  reset_queue_recursive: boolean;
}

interface Playlist {
  ref: string;
  name: string;
  config: {
    type: string;
    source: string;
    order: string;
    weight: number;
    is_enabled: boolean;
    is_jingle: boolean;
    avoid_duplicates: boolean;
    preserve_queue_on_restart: boolean;
    include_in_requests: boolean;
    include_in_on_demand: boolean;
    play_per_songs: number;
    play_per_minutes: number;
    play_per_hour_minute: number;
    backend_options: any[];
    remote_url: string | null;
    remote_type: string;
    remote_buffer: number;
    description: string | null;
  };
  folders: any[];
  media: any[];
  schedules: Schedule[];
  members: any[];
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function timeToInt(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 100 + minutes;
}

function intToTime(int: number): string {
  const hours = Math.floor(int / 100);
  const minutes = int % 100;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export default function PlaylistEditor() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showJson, setShowJson] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const addPlaylist = () => {
    const newPlaylist: Playlist = {
      ref: `playlist_${Date.now()}`,
      name: "New Playlist",
      config: {
        type: "default",
        source: "songs",
        order: "shuffle",
        weight: 3,
        is_enabled: true,
        is_jingle: false,
        avoid_duplicates: true,
        preserve_queue_on_restart: false,
        include_in_requests: true,
        include_in_on_demand: false,
        play_per_songs: 0,
        play_per_minutes: 0,
        play_per_hour_minute: 0,
        backend_options: [],
        remote_url: null,
        remote_type: "stream",
        remote_buffer: 0,
        description: null,
      },
      folders: [],
      media: [],
      schedules: [],
      members: [],
    };
    setPlaylists([...playlists, newPlaylist]);
  };

  const updatePlaylist = (index: number, updates: Partial<Playlist>) => {
    const updated = [...playlists];
    updated[index] = { ...updated[index], ...updates };
    setPlaylists(updated);
  };

  const updatePlaylistConfig = (index: number, updates: Partial<Playlist["config"]>) => {
    const updated = [...playlists];
    updated[index].config = { ...updated[index].config, ...updates };
    setPlaylists(updated);
  };

  const deletePlaylist = (index: number) => {
    setPlaylists(playlists.filter((_, i) => i !== index));
  };

  const addSchedule = (playlistIndex: number) => {
    const updated = [...playlists];
    updated[playlistIndex].schedules.push({
      start_time: 0,
      end_time: 2359,
      days: [1],
      start_date: null,
      end_date: null,
      loop_once: false,
      prevent_requests: false,
      reset_queue_at_start: false,
      reset_queue_recursive: false,
    });
    setPlaylists(updated);
  };

  const updateSchedule = (playlistIndex: number, scheduleIndex: number, updates: Partial<Schedule>) => {
    const updated = [...playlists];
    updated[playlistIndex].schedules[scheduleIndex] = {
      ...updated[playlistIndex].schedules[scheduleIndex],
      ...updates,
    };
    setPlaylists(updated);
  };

  const deleteSchedule = (playlistIndex: number, scheduleIndex: number) => {
    const updated = [...playlists];
    updated[playlistIndex].schedules.splice(scheduleIndex, 1);
    setPlaylists(updated);
  };

  const toggleDay = (playlistIndex: number, scheduleIndex: number, day: number) => {
    const updated = [...playlists];
    const schedule = updated[playlistIndex].schedules[scheduleIndex];
    const dayIndex = schedule.days.indexOf(day);
    
    if (dayIndex > -1) {
      schedule.days.splice(dayIndex, 1);
    } else {
      schedule.days.push(day);
      schedule.days.sort((a, b) => a - b);
    }
    
    setPlaylists(updated);
  };

  const generateExport = () => {
    const exportData = {
      schema_version: 1,
      type: "station",
      exported_at: new Date().toISOString(),
      station: {
        name: "OTW Radio",
        timezone: "America/Los_Angeles",
        requests_only_via_playlists: false,
        backend_config: {
          duplicate_prevention_time_range: 120,
          duplicate_prevention_artist_time_range: null,
          autodj_queue_length: 3,
          crossfade: 2,
        },
      },
      media: {},
      playlists: playlists,
    };

    return JSON.stringify(exportData, null, 2);
  };

  const downloadJson = () => {
    const json = generateExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `otw-radio-playlists-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Playlist export downloaded");
  };

  const copyJson = () => {
    navigator.clipboard.writeText(generateExport());
    toast.success("JSON copied to clipboard");
  };

  const syncToAzuraCast = async () => {
    if (playlists.length === 0) {
      toast.error("No playlists to sync");
      return;
    }

    setSyncing(true);
    try {
      // Transform to API-compatible format
      const playlistsToSync = playlists.map(p => ({
        name: p.name,
        type: p.config.type,
        source: p.config.source,
        order: p.config.order,
        weight: p.config.weight,
        is_enabled: p.config.is_enabled,
        is_jingle: p.config.is_jingle,
        avoid_duplicates: p.config.avoid_duplicates,
        include_in_requests: p.config.include_in_requests,
        include_in_on_demand: p.config.include_in_on_demand,
        schedule_items: p.schedules.map(s => ({
          start_time: s.start_time,
          end_time: s.end_time,
          days: s.days,
          start_date: s.start_date,
          end_date: s.end_date,
          loop_once: s.loop_once
        }))
      }));

      const res = await fetch("/api/playlists/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlists: playlistsToSync })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to sync");
      }

      const result = await res.json();
      toast.success(result.message || "Playlists synced successfully", {
        description: result.results.map((r: any) => 
          `${r.action === "created" ? "Created" : "Updated"}: ${r.name}`
        ).join("\n")
      });
    } catch (error: any) {
      toast.error("Sync failed", { description: error.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Playlist Schedule Editor</h1>
            <p className="text-muted-foreground">
              Create and edit playlist schedules, then sync directly to AzuraCast
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowJson(!showJson)}
            >
              {showJson ? "Hide" : "Show"} JSON
            </Button>
            <Button onClick={addPlaylist}>
              <Plus className="w-4 h-4 mr-2" />
              Add Playlist
            </Button>
          </div>
        </div>

        {/* Sync Instructions */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5" />
              Direct AzuraCast Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <ol className="list-decimal list-inside space-y-1">
              <li>Configure your playlists and schedules below</li>
              <li>Click "Save to AzuraCast" to push changes directly</li>
              <li>Playlists will be created or updated automatically</li>
              <li>Verify playlists in AzuraCast dashboard</li>
            </ol>
            <div className="mt-4 pt-4 border-t">
              <p className="font-semibold mb-1">Note:</p>
              <p className="text-muted-foreground">
                This syncs playlist configuration and schedules. You must still add media files to playlists in AzuraCast or via the Media page.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* JSON Preview */}
        {showJson && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>JSON Preview</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyJson}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button size="sm" onClick={downloadJson}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={generateExport()}
                readOnly
                className="font-mono text-xs h-96"
              />
            </CardContent>
          </Card>
        )}

        {/* Playlists */}
        <div className="space-y-6">
          {playlists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No playlists yet</p>
                <Button onClick={addPlaylist}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Playlist
                </Button>
              </CardContent>
            </Card>
          ) : (
            playlists.map((playlist, pIdx) => (
              <Card key={playlist.ref}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Playlist Name</Label>
                          <Input
                            value={playlist.name}
                            onChange={(e) => updatePlaylist(pIdx, { name: e.target.value })}
                            placeholder="e.g. Monday Eyes Wide Open"
                          />
                        </div>
                        <div>
                          <Label>Reference ID</Label>
                          <Input
                            value={playlist.ref}
                            onChange={(e) => updatePlaylist(pIdx, { ref: e.target.value })}
                            placeholder="e.g. monday_eyes_wide_open"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Weight</Label>
                          <Input
                            type="number"
                            value={playlist.config.weight}
                            onChange={(e) => updatePlaylistConfig(pIdx, { weight: parseInt(e.target.value) || 3 })}
                          />
                        </div>
                        <div>
                          <Label>Order</Label>
                          <Select
                            value={playlist.config.order}
                            onValueChange={(value) => updatePlaylistConfig(pIdx, { order: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="shuffle">Shuffle</SelectItem>
                              <SelectItem value="sequential">Sequential</SelectItem>
                              <SelectItem value="random">Random</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select
                            value={playlist.config.type}
                            onValueChange={(value) => updatePlaylistConfig(pIdx, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Default</SelectItem>
                              <SelectItem value="once_per_x_songs">Once per X Songs</SelectItem>
                              <SelectItem value="once_per_x_minutes">Once per X Minutes</SelectItem>
                              <SelectItem value="once_per_hour">Once per Hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`enabled-${pIdx}`}
                            checked={playlist.config.is_enabled}
                            onCheckedChange={(checked) => updatePlaylistConfig(pIdx, { is_enabled: checked as boolean })}
                          />
                          <Label htmlFor={`enabled-${pIdx}`}>Enabled</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`jingle-${pIdx}`}
                            checked={playlist.config.is_jingle}
                            onCheckedChange={(checked) => updatePlaylistConfig(pIdx, { is_jingle: checked as boolean })}
                          />
                          <Label htmlFor={`jingle-${pIdx}`}>Jingle Mode</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`duplicates-${pIdx}`}
                            checked={playlist.config.avoid_duplicates}
                            onCheckedChange={(checked) => updatePlaylistConfig(pIdx, { avoid_duplicates: checked as boolean })}
                          />
                          <Label htmlFor={`duplicates-${pIdx}`}>Avoid Duplicates</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`requests-${pIdx}`}
                            checked={playlist.config.include_in_requests}
                            onCheckedChange={(checked) => updatePlaylistConfig(pIdx, { include_in_requests: checked as boolean })}
                          />
                          <Label htmlFor={`requests-${pIdx}`}>Include in Requests</Label>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePlaylist(pIdx)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Schedules</h3>
                    <Button size="sm" onClick={() => addSchedule(pIdx)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Schedule
                    </Button>
                  </div>

                  {playlist.schedules.map((schedule, sIdx) => (
                    <Card key={sIdx} className="bg-muted/30">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Start Time</Label>
                                <Input
                                  type="time"
                                  value={intToTime(schedule.start_time)}
                                  onChange={(e) => updateSchedule(pIdx, sIdx, { start_time: timeToInt(e.target.value) })}
                                />
                              </div>
                              <div>
                                <Label>End Time</Label>
                                <Input
                                  type="time"
                                  value={intToTime(schedule.end_time)}
                                  onChange={(e) => updateSchedule(pIdx, sIdx, { end_time: timeToInt(e.target.value) })}
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="mb-2 block">Active Days</Label>
                              <div className="flex flex-wrap gap-2">
                                {DAYS.map((day) => (
                                  <Button
                                    key={day.value}
                                    variant={schedule.days.includes(day.value) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleDay(pIdx, sIdx, day.value)}
                                  >
                                    {day.label.slice(0, 3)}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`loop-${pIdx}-${sIdx}`}
                                  checked={schedule.loop_once}
                                  onCheckedChange={(checked) => updateSchedule(pIdx, sIdx, { loop_once: checked as boolean })}
                                />
                                <Label htmlFor={`loop-${pIdx}-${sIdx}`}>Loop Once</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`reset-${pIdx}-${sIdx}`}
                                  checked={schedule.reset_queue_at_start}
                                  onCheckedChange={(checked) => updateSchedule(pIdx, sIdx, { reset_queue_at_start: checked as boolean })}
                                />
                                <Label htmlFor={`reset-${pIdx}-${sIdx}`}>Reset Queue at Start</Label>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSchedule(pIdx, sIdx)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {playlist.schedules.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No schedules configured
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Bottom Actions */}
        {playlists.length > 0 && (
          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {playlists.length} playlist{playlists.length !== 1 ? "s" : ""} configured
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={copyJson}>
                <Copy className="w-4 h-4 mr-2" />
                Copy JSON
              </Button>
              <Button variant="outline" onClick={downloadJson}>
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </Button>
              <Button onClick={syncToAzuraCast} disabled={syncing}>
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Save to AzuraCast
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Calendar, Clock, ExternalLink, Edit, Loader2, Plus, Trash2, Save, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")}${period}`;
}

function timeToInt(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function intToTime(int: number): string {
  const hours = Math.floor(int / 60);
  const minutes = int % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export default function PlaylistManagementPage() {
  const [playlists, setPlaylists] = useState<AzuraCastPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<AzuraCastPlaylist | null>(null);
  const [editingSchedules, setEditingSchedules] = useState<ScheduleItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const startEditing = () => {
    if (!selectedPlaylist) return;
    setEditingSchedules([...selectedPlaylist.schedule_items]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingSchedules([]);
  };

  const addSchedule = () => {
    setEditingSchedules([
      ...editingSchedules,
      {
        start_time: 0,
        end_time: 1439,
        days: [1],
        start_date: null,
        end_date: null,
        loop_once: false
      }
    ]);
  };

  const updateSchedule = (index: number, updates: Partial<ScheduleItem>) => {
    const updated = [...editingSchedules];
    updated[index] = { ...updated[index], ...updates };
    setEditingSchedules(updated);
  };

  const deleteSchedule = (index: number) => {
    setEditingSchedules(editingSchedules.filter((_, i) => i !== index));
  };

  const toggleDay = (scheduleIndex: number, dayIndex: number) => {
    const updated = [...editingSchedules];
    const schedule = updated[scheduleIndex];
    const dayNum = dayIndex + 1; // AzuraCast uses 1-7 for Mon-Sun
    
    if (schedule.days.includes(dayNum)) {
      schedule.days = schedule.days.filter(d => d !== dayNum);
    } else {
      schedule.days = [...schedule.days, dayNum].sort();
    }
    
    setEditingSchedules(updated);
  };

  const saveSchedules = async () => {
    if (!selectedPlaylist) return;
    
    setSaving(true);
    try {
      // Use the sync API to update the playlist
      const response = await fetch("/api/playlists/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlists: [{
            name: selectedPlaylist.name,
            type: selectedPlaylist.type,
            source: "songs",
            order: "shuffle",
            weight: selectedPlaylist.weight,
            is_enabled: selectedPlaylist.is_enabled,
            is_jingle: selectedPlaylist.is_jingle,
            avoid_duplicates: true,
            include_in_requests: true,
            include_in_on_demand: false,
            schedule_items: editingSchedules.map(s => ({
              start_time: s.start_time,
              end_time: s.end_time,
              days: s.days,
              start_date: s.start_date,
              end_date: s.end_date,
              loop_once: s.loop_once || false
            }))
          }]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update playlist");
      }

      toast({
        title: "Success",
        description: "Playlist schedules updated successfully"
      });

      setIsEditing(false);
      await fetchPlaylists();
      
      // Update selected playlist
      const updated = playlists.find(p => p.id === selectedPlaylist.id);
      if (updated) setSelectedPlaylist(updated);
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

  const azuracastUrl = process.env.NEXT_PUBLIC_AZURACAST_URL || "https://radio.onestowatch.live";

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Playlists</h1>
              <p className="text-muted-foreground">
                View playlists configured in AzuraCast. Manage them in AzuraCast admin.
              </p>
            </div>
            <div className="flex gap-2">
             
             
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      <Calendar className="w-5 h-5 inline mr-2" />
                      Schedule Slots
                    </CardTitle>
                    <CardDescription>
                      When this playlist airs during the week
                    </CardDescription>
                  </div>
                  {selectedPlaylist && (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button variant="outline" size="sm" onClick={cancelEditing}>
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button size="sm" onClick={saveSchedules} disabled={saving}>
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
                        </>
                      ) : (
                        <Button size="sm" onClick={startEditing}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Schedules
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedPlaylist ? (
                  <p className="text-sm text-muted">Select a playlist to view schedule</p>
                ) : isEditing ? (
                  <div className="space-y-3">
                    {editingSchedules.map((slot, idx) => (
                      <Card key={idx} className="bg-muted/30">
                        <CardContent className="pt-4 space-y-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs">Start Time</Label>
                                  <Input
                                    type="time"
                                    value={intToTime(slot.start_time)}
                                    onChange={(e) => updateSchedule(idx, { start_time: timeToInt(e.target.value) })}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">End Time</Label>
                                  <Input
                                    type="time"
                                    value={intToTime(slot.end_time)}
                                    onChange={(e) => updateSchedule(idx, { end_time: timeToInt(e.target.value) })}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs mb-2 block">Active Days</Label>
                                <div className="flex flex-wrap gap-2">
                                  {DAYS.map((day, dayIdx) => (
                                    <Button
                                      key={dayIdx}
                                      variant={slot.days.includes(dayIdx + 1) ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => toggleDay(idx, dayIdx)}
                                    >
                                      {day}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteSchedule(idx)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button variant="outline" onClick={addSchedule} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Schedule Slot
                    </Button>
                  </div>
                ) : selectedPlaylist.schedule_items.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-muted" />
                    <p className="text-sm text-muted mb-4">
                      This playlist has no scheduled time slots
                    </p>
                    <Button variant="outline" size="sm" onClick={startEditing}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPlaylist.schedule_items.map((slot, idx) => (
                      <div key={idx} className="p-3 rounded-lg border">
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
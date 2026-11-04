"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Radio, Edit, Save, Plus, Trash2, X, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface ScheduleItem {
  start_time: number;
  end_time: number;
  days: number[];
  start_date?: string | null;
  end_date?: string | null;
}

interface Streamer {
  id: number;
  streamer_username: string;
  display_name: string;
  is_active: boolean;
  enforce_schedule?: boolean;
  schedule_items?: ScheduleItem[];
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

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")}${period}`;
}

function intToTime(int: number): string {
  const hours = Math.floor(int / 60);
  const minutes = int % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function timeToInt(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function DJsPage() {
  const [streamers, setStreamers] = useState<StreamersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null);
  const [editingSchedules, setEditingSchedules] = useState<ScheduleItem[]>([]);
  const [enforceSchedule, setEnforceSchedule] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

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
          description: "Failed to load streamers",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to connect to API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openScheduleEditor = (streamer: Streamer) => {
    setEditingStreamer(streamer);
    setEditingSchedules(streamer.schedule_items || []);
    setEnforceSchedule(streamer.enforce_schedule || false);
  };

  const closeScheduleEditor = () => {
    setEditingStreamer(null);
    setEditingSchedules([]);
    setEnforceSchedule(false);
  };

  const addSchedule = () => {
    setEditingSchedules([
      ...editingSchedules,
      {
        start_time: 0,
        end_time: 1439,
        days: [1],
        start_date: null,
        end_date: null
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
    const dayNum = dayIndex + 1;
    
    if (schedule.days.includes(dayNum)) {
      schedule.days = schedule.days.filter(d => d !== dayNum);
    } else {
      schedule.days = [...schedule.days, dayNum].sort();
    }
    
    setEditingSchedules(updated);
  };

  const saveSchedule = async () => {
    if (!editingStreamer) return;
    
    setSaving(true);
    try {
      const response = await fetch("/api/admin/update-streamer-schedule", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          streamer_id: editingStreamer.id,
          enforce_schedule: enforceSchedule,
          schedule_items: editingSchedules.map(s => ({
            start_time: s.start_time,
            end_time: s.end_time,
            days: s.days,
            start_date: s.start_date,
            end_date: s.end_date
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update schedule");
      }

      toast({
        title: "Success",
        description: "Schedule updated successfully"
      });

      closeScheduleEditor();
      await loadStreamers();
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

  const renderSchedule = (schedules?: ScheduleItem[]) => {
    if (!schedules || schedules.length === 0) {
      return <span className="text-xs text-muted-foreground">No schedule set</span>;
    }

    return (
      <div className="space-y-1">
        {schedules.map((slot, idx) => (
          <div key={idx} className="text-xs">
            <span className="font-mono">{formatTime(slot.start_time)}-{formatTime(slot.end_time)}</span>
            {" • "}
            {slot.days.length === 7 ? (
              <span className="text-muted-foreground">Every day</span>
            ) : (
              <span className="text-muted-foreground">
                {slot.days.map(d => DAYS[d - 1]).join(", ")}
              </span>
            )}
          </div>
        ))}
      </div>
    );
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
                  DJ Streamers
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage DJ credentials and schedules
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
            <Card>
              <CardHeader>
                <CardTitle>Streamer Accounts & Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Enforce Times</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {streamers?.streamers.map((streamer) => (
                      <TableRow key={streamer.id}>
                        <TableCell className="font-mono text-sm">{streamer.streamer_username}</TableCell>
                        <TableCell>{streamer.profile_display_name || streamer.display_name}</TableCell>
                        <TableCell>
                          <Badge variant={streamer.is_active ? "default" : "secondary"}>
                            {streamer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {renderSchedule(streamer.schedule_items)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={streamer.enforce_schedule ? "default" : "outline"} className="text-xs">
                            {streamer.enforce_schedule ? "Enforced" : "Anytime"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openScheduleEditor(streamer)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Schedule
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={!!editingStreamer} onOpenChange={closeScheduleEditor}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Schedule - {editingStreamer?.display_name}</DialogTitle>
            <DialogDescription>
              Configure when this streamer can broadcast
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base">Enforce Schedule Times</Label>
                <p className="text-sm text-muted-foreground">
                  Restrict streaming to scheduled time slots only
                </p>
              </div>
              <Switch
                checked={enforceSchedule}
                onCheckedChange={setEnforceSchedule}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Time Slots</Label>
                <Button variant="outline" size="sm" onClick={addSchedule}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Slot
                </Button>
              </div>

              {editingSchedules.length === 0 ? (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No schedule slots. Streamer can broadcast anytime.
                  </p>
                </div>
              ) : (
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
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeScheduleEditor} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={saveSchedule} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Schedule
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
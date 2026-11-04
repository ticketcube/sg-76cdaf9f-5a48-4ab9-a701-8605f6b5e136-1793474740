"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Music, AlertCircle, CheckCircle2, Clock, Download, Upload, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Asset {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  durationSec?: number;
  audioCodec?: string;
  thumbnail?: string;
  suggestedArtist: string;
  suggestedTitle: string;
}

interface Job {
  id: string;
  asset_id: string;
  asset_name: string;
  artist: string | null;
  title: string;
  save_to_aimc: boolean;
  save_to_radio: boolean;
  status: string;
  error: string | null;
  aimc_key: string | null;
  radio_path: string | null;
  duration_sec: number | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

function extractUUID(input: string): string | null {
  // Try to find UUID in various formats
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = input.match(uuidPattern);
  return match ? match[0] : null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "queued": return <Clock className="w-4 h-4" />;
    case "downloading": return <Download className="w-4 h-4 animate-pulse" />;
    case "converting": return <Wand2 className="w-4 h-4 animate-pulse" />;
    case "uploading": return <Upload className="w-4 h-4 animate-pulse" />;
    case "done": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "failed": return <AlertCircle className="w-4 h-4 text-destructive" />;
    default: return <Clock className="w-4 h-4" />;
  }
}

export default function ExtractAudioPage() {
  const { user, session } = useAuth();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [saveToAimc, setSaveToAimc] = useState(true);
  const [saveToRadio, setSaveToRadio] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const loadJobs = async () => {
    if (!user || !session) return;
    
    try {
      const res = await fetch("/api/extraction/jobs", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, [user, session]);

  const lookupAsset = async () => {
    const uuid = extractUUID(input);
    if (!uuid) {
      toast.error("Couldn't find an AIMC asset ID in that link");
      return;
    }

    setLoading(true);
    try {
      const assetId = `asset:uuid:${uuid}`;
      const res = await fetch("/api/aimc/asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId })
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to fetch asset");
        return;
      }

      const data: Asset = await res.json();

      if (data.type === "Image") {
        toast.error("This asset has no audio");
        return;
      }

      setAsset(data);
      setArtist(data.suggestedArtist);
      setTitle(data.suggestedTitle);

      if (data.sizeBytes > 5 * 1024 * 1024 * 1024) {
        toast.warning("Large file warning", {
          description: "This file is over 5 GB and will take a long time to process."
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch asset");
    } finally {
      setLoading(false);
    }
  };

  const startExtraction = async () => {
    if (!asset || !title) {
      toast.error("Please complete all fields");
      return;
    }

    if (!saveToAimc && !saveToRadio) {
      toast.error("Please select at least one destination");
      return;
    }

    if (!session) {
      toast.error("Not authenticated");
      return;
    }

    try {
      const res = await fetch("/api/extraction/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          assetId: asset.id,
          assetName: asset.name,
          artist,
          title,
          saveToAimc,
          saveToRadio
        })
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to create job");
        return;
      }

      toast.success("Extraction job queued");
      setAsset(null);
      setInput("");
      setArtist("");
      setTitle("");
      await loadJobs();
    } catch (error: any) {
      toast.error(error.message || "Failed to create job");
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Extract Audio from Video</h1>
          <p className="text-muted-foreground">
            Convert AIMC videos to loudness-normalized MP3s and save to AIMC and/or AzuraCast radio station
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>AIMC Asset</CardTitle>
            <CardDescription>
              Paste an AIMC URL, asset ID (asset:uuid:...), or just the UUID
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://otw.aimc-ln.com/... or asset:uuid:... or just the UUID"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookupAsset()}
              />
              <Button onClick={lookupAsset} disabled={loading || !input}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
              </Button>
            </div>

            {asset && (
              <div className="p-4 border rounded-lg space-y-4 bg-muted/30">
                <div className="flex gap-4">
                  {asset.thumbnail && (
                    <img src={asset.thumbnail} alt={asset.name} className="w-32 h-32 object-cover rounded" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold">{asset.name}</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="secondary">{asset.type}</Badge>
                      <Badge variant="outline">{formatBytes(asset.sizeBytes)}</Badge>
                      {asset.durationSec && <Badge variant="outline">{formatDuration(asset.durationSec)}</Badge>}
                      {asset.audioCodec && <Badge variant="outline">{asset.audioCodec}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Artist</Label>
                    <Input value={artist} onChange={(e) => setArtist(e.target.value)} />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Save to:</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="aimc"
                        checked={saveToAimc}
                        onCheckedChange={(checked) => setSaveToAimc(checked as boolean)}
                      />
                      <Label htmlFor="aimc" className="font-normal">
                        AIMC (OTW/OTWL_Audio folder)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="radio"
                        checked={saveToRadio}
                        onCheckedChange={(checked) => setSaveToRadio(checked as boolean)}
                      />
                      <Label htmlFor="radio" className="font-normal">
                        Radio (AzuraCast aimc folder)
                      </Label>
                    </div>
                  </div>
                </div>

                <Button onClick={startExtraction} className="w-full">
                  <Music className="w-4 h-4 mr-2" />
                  Extract Audio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Extractions</CardTitle>
            <CardDescription>
              Your extraction jobs and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingJobs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No extraction jobs yet
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {job.artist && `${job.artist} • `}
                          {job.asset_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <Badge variant={job.status === "done" ? "default" : job.status === "failed" ? "destructive" : "secondary"}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>

                    {job.error && (
                      <p className="text-sm text-destructive">{job.error}</p>
                    )}

                    {job.status === "done" && (
                      <div className="text-sm space-y-1 pt-2 border-t">
                        {job.aimc_key && (
                          <p className="text-green-600">✓ AIMC: {job.aimc_key.split("/").pop()}</p>
                        )}
                        {job.radio_path && (
                          <p className="text-green-600">✓ Radio: {job.radio_path}</p>
                        )}
                        {job.duration_sec && job.size_bytes && (
                          <p className="text-muted-foreground">
                            {formatDuration(job.duration_sec)} • {formatBytes(job.size_bytes)}
                          </p>
                        )}
                        {job.radio_path && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Note: AzuraCast can take a few minutes to list the new file
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
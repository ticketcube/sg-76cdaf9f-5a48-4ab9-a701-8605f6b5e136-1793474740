"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Music, Search, Loader2, Upload, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

interface MediaFile {
  id: string; // The unique ID of the file in AzuraCast
  path: string;
  media: {
    title: string;
    artist: string;
    album: string;
    length: number;
    length_text: string;
  };
  playlists: Array<{
    id: number;
    name: string;
  }>;
}

interface Playlist {
  id: number;
  name: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [selectedPlaylists, setSelectedPlaylists] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [mediaRes, playlistsRes] = await Promise.all([
        fetch("/api/media"),
        fetch("/api/playlists")
      ]);

      if (!mediaRes.ok) throw new Error("Failed to load media");
      if (!playlistsRes.ok) throw new Error("Failed to load playlists");

      const mediaData = await mediaRes.json();
      const playlistsData = await playlistsRes.json();

      setMedia(mediaData);
      setPlaylists(playlistsData);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openFileDetails = (file: MediaFile) => {
    setSelectedFile(file);
    setSelectedPlaylists(file.playlists.map(p => p.id));
  };

  const togglePlaylist = (playlistId: number) => {
    setSelectedPlaylists(prev => 
      prev.includes(playlistId) 
        ? prev.filter(id => id !== playlistId)
        : [...prev, playlistId]
    );
  };

  const savePlaylists = async () => {
    if (!selectedFile) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/media/${selectedFile.id}/playlists`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlists: selectedPlaylists })
      });

      if (!res.ok) throw new Error("Failed to update playlists");

      toast({ title: "Success", description: "Playlists updated successfully" });
      await loadData();
      setSelectedFile(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Generate AIMC upload URL (20% progress)
      setUploadProgress(20);
      const uploadUrlRes = await fetch("/api/aimc/generate-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "audio/mpeg"
        })
      });

      if (!uploadUrlRes.ok) throw new Error("Failed to generate upload URL");
      const { uploadUrl, assetId } = await uploadUrlRes.json();

      // Step 2: Upload to AIMC (40% progress)
      setUploadProgress(40);
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "audio/mpeg" },
        body: file
      });

      if (!uploadRes.ok) throw new Error("Failed to upload to AIMC");

      // Step 3: Notify AIMC upload complete (60% progress)
      setUploadProgress(60);
      await fetch("/api/aimc/asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          filename: file.name,
          status: "uploaded"
        })
      });

      // Step 4: Upload to AzuraCast (80% progress)
      setUploadProgress(80);
      const formData = new FormData();
      formData.append("file", file);

      const azuracastRes = await fetch("/api/media", {
        method: "POST",
        body: formData
      });

      if (!azuracastRes.ok) throw new Error("Failed to upload to AzuraCast");

      // Complete (100% progress)
      setUploadProgress(100);
      toast({
        title: "Upload Complete",
        description: `${file.name} uploaded to both AIMC and AzuraCast successfully`
      });

      // Refresh media list
      await loadData();
      
      // Reset upload progress after a short delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploading(false);
      }, 1000);

    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive"
      });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const filteredMedia = media.filter(file => {
    const term = search.toLowerCase();
    return (
      file.media?.title?.toLowerCase().includes(term) ||
      file.media?.artist?.toLowerCase().includes(term) ||
      file.path.toLowerCase().includes(term)
    );
  });

  return (
    <ProtectedRoute requireAdmin>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Media Library</h1>
          <p className="text-muted-foreground">
            Browse station media and manage playlist assignments.
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Media</CardTitle>
            <CardDescription>
              Upload audio files to both AIMC storage and AzuraCast station library
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="cursor-pointer"
                  id="media-upload"
                />
                <Button
                  onClick={() => document.getElementById("media-upload")?.click()}
                  disabled={uploading}
                  variant="outline"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Select File
                    </>
                  )}
                </Button>
              </div>
              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground text-center">
                    {uploadProgress < 20 && "Initializing upload..."}
                    {uploadProgress >= 20 && uploadProgress < 40 && "Uploading to AIMC..."}
                    {uploadProgress >= 40 && uploadProgress < 60 && "Processing AIMC upload..."}
                    {uploadProgress >= 60 && uploadProgress < 80 && "Uploading to AzuraCast..."}
                    {uploadProgress >= 80 && uploadProgress < 100 && "Finalizing..."}
                    {uploadProgress === 100 && "Complete!"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Library List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Files</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search artist, title..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMedia.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => openFileDetails(file)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors flex justify-between items-center ${
                        selectedFile?.id === file.id ? "border-primary bg-primary/5" : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <Music className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {file.media?.title || file.path.split('/').pop()}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {file.media?.artist || "Unknown Artist"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs font-mono text-muted-foreground">
                          {file.media?.length_text || "0:00"}
                        </span>
                        <div className="flex gap-1">
                          {file.playlists.slice(0, 2).map(p => (
                            <Badge key={p.id} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                              {p.name}
                            </Badge>
                          ))}
                          {file.playlists.length > 2 && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                              +{file.playlists.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredMedia.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No media files found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Panel */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Playlist Assignment</CardTitle>
                <CardDescription>
                  {selectedFile 
                    ? "Select playlists for this track" 
                    : "Select a track to manage its playlists"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFile ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-bold truncate">{selectedFile.media?.title || selectedFile.path.split('/').pop()}</p>
                      <p className="text-sm text-muted-foreground truncate">{selectedFile.media?.artist}</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Playlists</Label>
                      <div className="grid gap-2 border p-4 rounded-lg bg-background max-h-[400px] overflow-y-auto">
                        {playlists.map(playlist => (
                          <div key={playlist.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`pl-${playlist.id}`} 
                              checked={selectedPlaylists.includes(playlist.id)}
                              onCheckedChange={() => togglePlaylist(playlist.id)}
                            />
                            <Label 
                              htmlFor={`pl-${playlist.id}`}
                              className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {playlist.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full" onClick={savePlaylists} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Assignments
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No track selected</p>
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
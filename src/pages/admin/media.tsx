"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Music, Search, Loader2, Play, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
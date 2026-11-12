import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Radio, BarChart3, Flag, Music, List, FileAudio, Upload } from "lucide-react";

export default function AdminDashboard() {
  return (
    <ProtectedRoute requireStaff>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle>Users</CardTitle>
                </div>
                <CardDescription>Manage staff and DJ accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/users">Manage Users</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Media Library */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  <CardTitle>Media Library</CardTitle>
                </div>
                <CardDescription>Browse and manage audio files</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/media">Media Library</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Media Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  <CardTitle>Media Upload</CardTitle>
                </div>
                <CardDescription>Upload files to AIMC Media Lake</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/media-upload">Upload Media</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Playlists */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-primary" />
                  <CardTitle>Playlists</CardTitle>
                </div>
                <CardDescription>Manage station playlists</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/playlists">Manage Playlists</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Audio Extraction */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileAudio className="w-5 h-5 text-primary" />
                  <CardTitle>Audio Extraction</CardTitle>
                </div>
                <CardDescription>Extract audio from video files</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/extract-audio">Extract Audio</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Live DJs */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-primary" />
                  <CardTitle>Live DJs</CardTitle>
                </div>
                <CardDescription>Monitor and manage live streams</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/djs">Manage DJs</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <CardTitle>Analytics</CardTitle>
                </div>
                <CardDescription>View listener stats and reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/analytics">View Analytics</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-primary" />
                  <CardTitle>Feature Flags</CardTitle>
                </div>
                <CardDescription>Toggle experimental features</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/features">Manage Features</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
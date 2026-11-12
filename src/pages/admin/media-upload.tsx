import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Upload, Info } from "lucide-react";

export default function MediaUploadPage() {
  const { profile } = useAuth();

  return (
    <ProtectedRoute requireStaff>
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">AIMC Media Upload</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Upload media assets to the OTW Media Lake
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Upload audio, video, images, and other media files to AIMC (Linode Media Cloud). 
              All uploads are stored in the OTW collection and accessible across the platform.
            </AlertDescription>
          </Alert>

          {/* Main Upload Interface */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>AIMC Staff Upload Portal</CardTitle>
              <CardDescription>
                Drag and drop files or browse to upload media assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[16/10] w-full rounded-lg overflow-hidden border border-border bg-accent/5">
                <iframe
                  src="https://otw.aimc-ln.com/p/staff"
                  className="w-full h-full"
                  title="AIMC Staff Upload Portal"
                  allow="clipboard-write"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Supported File Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Audio</p>
                  <p className="text-xs text-muted-foreground">MP3, WAV, FLAC, AAC, OGG</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Video</p>
                  <p className="text-xs text-muted-foreground">MP4, MOV, AVI, MKV, WebM</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Images</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP, SVG</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Other</p>
                  <p className="text-xs text-muted-foreground">PDF, TXT, JSON, and more</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Use descriptive filenames (include date, artist, title)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Audio files will sync to AzuraCast automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>High-quality formats preferred (320kbps for audio)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Assets are searchable and accessible via admin tools</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Direct AIMC Link */}
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Open in New Tab</h3>
                  <p className="text-sm text-muted-foreground">
                    Access the full AIMC portal interface with advanced search, collections, and metadata editing
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a 
                    href="https://otw.aimc-ln.com/p/staff" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Open AIMC Portal
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
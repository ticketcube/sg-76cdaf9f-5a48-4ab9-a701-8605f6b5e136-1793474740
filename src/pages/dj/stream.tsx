import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Radio, Info } from "lucide-react";

export default function DJStreamPage() {
  const { profile } = useAuth();

  return (
    <ProtectedRoute requireRole="otwl-dj">
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Radio className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">DJ Streaming Console</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Welcome back, {profile?.display_name || profile?.username}
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is your OTW Radio streaming console. Connect your broadcasting software (OBS, Mixxx, etc.) 
              using the mount point details shown below. Need advanced features? Use the full AzuraCast interface linked at the bottom.
            </AlertDescription>
          </Alert>

          {/* Main Streaming Interface */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Live Streaming Controls</CardTitle>
              <CardDescription>
                Manage your live broadcast to OTW Radio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-[16/10] w-full rounded-lg overflow-hidden border border-border bg-accent/5">
                <iframe
                  src="https://radio.onestowatch.live/public/otw_radio/dj"
                  className="w-full h-full"
                  title="AzuraCast DJ Console"
                  allow="microphone; camera"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Server</p>
                  <code className="text-sm bg-accent px-2 py-1 rounded">radio.onestowatch.live</code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Port</p>
                  <code className="text-sm bg-accent px-2 py-1 rounded">8000</code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Mount Point</p>
                  <code className="text-sm bg-accent px-2 py-1 rounded">/radio.mp3</code>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Use your personal DJ credentials provided by staff
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Test your connection before going live</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Use high-quality audio settings (320kbps recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Monitor the "Connected Listeners" counter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Keep your streaming software updated</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Controls Link */}
          <Card className="border-muted">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Need Advanced Features?</h3>
                  <p className="text-sm text-muted-foreground">
                    Access the full AzuraCast DJ interface for detailed statistics, audio processing controls, and troubleshooting tools
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a 
                    href="https://radio.onestowatch.live/public/otw_radio/dj" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Advanced Console
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
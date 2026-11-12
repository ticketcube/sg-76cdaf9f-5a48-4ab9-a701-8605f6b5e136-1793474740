import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Radio, Calendar, BarChart3, Headphones } from "lucide-react";
import Link from "next/link";

export default function DJHomePage() {
  const { profile } = useAuth();

  return (
    <ProtectedRoute requireRole="otwl-dj">
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">DJ Portal</h1>
            <p className="text-muted-foreground text-lg">
              Welcome back, {profile?.display_name || profile?.username}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Radio className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Go Live</CardTitle>
                    <CardDescription>Start streaming to OTW Radio</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" size="lg">
                  <Link href="/dj/stream">
                    Open Streaming Console
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-muted hover:border-muted/60 transition-colors opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Calendar className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>My Schedule</CardTitle>
                    <CardDescription>View your upcoming shows</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" size="lg" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="border-muted hover:border-muted/60 transition-colors opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>Track your show performance</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" size="lg" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            <Card className="border-muted hover:border-muted/60 transition-colors opacity-60">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Headphones className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>Listener Map</CardTitle>
                    <CardDescription>See who's tuned in live</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" size="lg" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle>DJ Resources</CardTitle>
              <CardDescription>Everything you need to know</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <a 
                href="#" 
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors"
              >
                <span className="font-medium">Streaming Setup Guide</span>
                <span className="text-sm text-muted-foreground">Coming Soon</span>
              </a>
              <a 
                href="#" 
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors"
              >
                <span className="font-medium">Broadcasting Best Practices</span>
                <span className="text-sm text-muted-foreground">Coming Soon</span>
              </a>
              <a 
                href="#" 
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/5 transition-colors"
              >
                <span className="font-medium">Technical Support</span>
                <span className="text-sm text-muted-foreground">Coming Soon</span>
              </a>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
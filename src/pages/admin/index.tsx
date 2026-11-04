import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Radio, Mic, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <ProtectedRoute requireAdmin>
      <div className="page-container">
        <div className="max-w-7xl mx-auto section-spacing">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {profile?.role === "otwl-dj" ? "DJ" : 
                   profile?.role === "otwl-podcast" ? "Podcast" : 
                   profile?.role === "otwl-staff" ? "Staff" : "User"}
                </Badge>
                {profile?.is_admin && (
                  <Badge variant="destructive">Admin</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Radio className="w-8 h-8 mb-2 text-primary" />
                <CardTitle>Now Playing</CardTitle>
                <CardDescription>
                  View current broadcast and listener stats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/now-playing">
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardContent>
            </Card>

            {(profile?.role === "otwl-dj" || profile?.is_admin) && (
              <Card>
                <CardHeader>
                  <Mic className="w-8 h-8 mb-2 text-primary" />
                  <CardTitle>Host Dashboard</CardTitle>
                  <CardDescription>
                    Manage your shows and schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/host">
                    <Button className="w-full">Go to Dashboard</Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {profile?.is_admin && (
              <>
                <Card>
                  <CardHeader>
                    <Users className="w-8 h-8 mb-2 text-primary" />
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage staff, DJs, and roles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/users">
                      <Button className="w-full">Manage Users</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Settings className="w-8 h-8 mb-2 text-primary" />
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>
                      Configure station and system settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/admin/settings">
                      <Button className="w-full">Configure</Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">24/7</p>
                  <p className="text-sm text-muted-foreground">Broadcast</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">Live</p>
                  <p className="text-sm text-muted-foreground">Status</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">-</p>
                  <p className="text-sm text-muted-foreground">Listeners</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">5</p>
                  <p className="text-sm text-muted-foreground">Daily Blocks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
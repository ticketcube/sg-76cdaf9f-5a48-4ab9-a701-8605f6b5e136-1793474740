"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, Radio, Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface DJ {
  user_id: string;
  email: string;
  display_name: string | null;
  username: string;
  created_at: string;
  is_admin: boolean;
}

export default function DJsPage() {
  const [djs, setDjs] = useState<DJ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDJs();
  }, []);

  const loadDJs = async () => {
    setLoading(true);
    setError("");
    
    try {
      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("role", "otwl-dj")
        .order("display_name", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setDjs([]);
      } else {
        setDjs(data || []);
      }
    } catch (err) {
      setError("Failed to load DJs");
      setDjs([]);
    } finally {
      setLoading(false);
    }
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
                  DJ Management
                </h1>
                <p className="text-muted-foreground mt-2">
                  All active DJs on OTW Radio
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{djs.length}</div>
                <div className="text-sm text-muted-foreground">Total DJs</div>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {djs.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Radio className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No DJs found. Create DJ users from the{" "}
                        <Link href="/admin/users" className="text-primary hover:underline">
                          User Management
                        </Link>{" "}
                        page.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {djs.map((dj) => (
                    <Card key={dj.user_id} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                              <Radio className="w-5 h-5 text-primary" />
                              {dj.display_name || dj.username}
                            </CardTitle>
                            <CardDescription className="font-mono text-xs mt-1">
                              {dj.email}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="default">DJ</Badge>
                            {dj.is_admin && (
                              <Badge variant="destructive">Admin</Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <div>
                              <div className="text-xs">Member Since</div>
                              <div className="font-medium text-foreground">
                                {new Date(dj.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <div>
                              <div className="text-xs">Next Slot</div>
                              <div className="font-medium text-foreground">
                                Not scheduled
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Radio className="w-4 h-4" />
                            <div>
                              <div className="text-xs">Status</div>
                              <div className="font-medium text-foreground">
                                <Badge variant="outline" className="text-xs">
                                  Ready
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="mt-8 p-4 bg-muted/50 rounded-lg border border-border">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              Phase 1 Roadmap
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              This page will integrate with AzuraCast to show real-time DJ scheduling, slot management, and live status.
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• DJ slot booking and schedule management</div>
              <div>• AzuraCast streamer account integration</div>
              <div>• Live broadcast monitoring and alerts</div>
              <div>• Credential rotation and access control</div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
  requireRole?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireStaff = false,
  requireRole,
  fallback
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [loading, user, router]);

  // Show loading only while checking auth, not while loading profile
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If we have a user but no profile yet, show access denied for protected routes
  // This prevents waiting for profile load when we know the user doesn't have access
  const hasProfile = profile !== null;

  // Check admin requirement
  if (requireAdmin && hasProfile && !profile?.is_admin) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check staff requirement
  if (requireStaff && hasProfile && !profile?.role && !profile?.is_admin) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You need staff privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Check specific role requirement
  if (requireRole && hasProfile && profile?.role !== requireRole) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You need the {requireRole} role to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
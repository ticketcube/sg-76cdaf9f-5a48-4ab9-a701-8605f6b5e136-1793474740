"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { authService, type AuthUser, type UserProfile } from "@/services/authService";
import type { Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  hasRole: (role: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session and user with error handling
    const initializeAuth = async () => {
      try {
        // Parallelize session and user fetch
        const [session, user] = await Promise.all([
          authService.getCurrentSession(),
          authService.getCurrentUser()
        ]);
        
        setSession(session);
        setUser(user);
        
        // Mark as not loading immediately - profile can load in background
        setLoading(false);
        
        // Load profile in background without blocking
        if (user) {
          authService.getUserProfile(user.id)
            .then(setProfile)
            .catch((error) => {
              console.error("Failed to load user profile:", error);
              setProfile(null);
            });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
        setProfile(null);
        setSession(null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        const user = session?.user || null;
        setUser(user ? {
          id: user.id,
          email: user.email || "",
          user_metadata: user.user_metadata,
          created_at: user.created_at
        } : null);

        if (user) {
          authService.getUserProfile(user.id)
            .then(setProfile)
            .catch((error) => {
              console.error("Failed to load profile on auth change:", error);
              setProfile(null);
            });
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAdmin: profile?.is_admin === true,
    isStaff: profile?.role !== null,
    hasRole: (role: string) => profile?.role === role,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
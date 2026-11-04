import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: any;
  created_at?: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: "otwl-dj" | "otwl-podcast" | "otwl-staff" | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Dynamic URL Helper
const getURL = () => {
  let url = process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
           process?.env?.NEXT_PUBLIC_SITE_URL ?? 
           'http://localhost:3000'
  
  // Handle undefined or null url
  if (!url) {
    url = 'http://localhost:3000';
  }
  
  // Ensure url has protocol
  url = url.startsWith('http') ? url : `https://${url}`
  
  // Ensure url ends with slash
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

export const authService = {
  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user ? {
      id: user.id,
      email: user.email || "",
      user_metadata: user.user_metadata,
      created_at: user.created_at
    } : null;
  },

  // Get user profile with role
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    // Cast role to our expected type
    return {
      ...data,
      role: data.role as "otwl-dj" | "otwl-podcast" | "otwl-staff" | null
    };
  },

  // Get current user with profile
  async getCurrentUserWithProfile(): Promise<{ user: AuthUser; profile: UserProfile } | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const profile = await this.getUserProfile(user.id);
    if (!profile) return null;

    return { user, profile };
  },

  // Check if user has specific role
  async hasRole(userId: string, role: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return profile?.role === role;
  },

  // Check if user is admin
  async isAdmin(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return profile?.is_admin === true;
  },

  // Check if user is staff (any OTW role)
  async isStaff(userId: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId);
    return profile?.role !== null;
  },

  // Get current session
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Sign up with email and password
  async signUp(email: string, password: string, metadata?: { display_name?: string; role?: string }): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/confirm-email`,
          data: metadata
        }
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      // Create profile if user was created
      if (authUser && data.user) {
        await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          email: email,
          username: email.split("@")[0],
          display_name: metadata?.display_name || null,
          role: metadata?.role || null,
          is_admin: false
        });
      }

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign up" } 
      };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign in" } 
      };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during sign out" } 
      };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/reset-password`,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during password reset" } 
      };
    }
  },

  // Confirm email (REQUIRED)
  async confirmEmail(token: string, type: 'signup' | 'recovery' | 'email_change' = 'signup'): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during email confirmation" } 
      };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Admin: Create user with role (requires service role key in API route)
  async adminCreateUser(email: string, password: string, displayName: string, role: "otwl-dj" | "otwl-podcast" | "otwl-staff", isAdmin: boolean = false): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      // This will be called from an API route with service role key
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, role, isAdmin })
      });

      const data = await response.json();

      if (!response.ok) {
        return { user: null, error: { message: data.error || "Failed to create user" } };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred while creating user" } 
      };
    }
  },

  // Admin: Get all users with profiles
  async adminGetAllUsers(): Promise<{ users: Array<{ user: AuthUser; profile: UserProfile }>; error: AuthError | null }> {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .or("is_admin.eq.true,role.in.(otwl-dj,otwl-podcast,otwl-staff)")
        .order("created_at", { ascending: false });

      if (error) {
        return { users: [], error: { message: error.message } };
      }

      const users = data.map(profile => ({
        user: {
          id: profile.user_id,
          email: profile.email,
          created_at: profile.created_at
        } as AuthUser,
        profile: {
          ...profile,
          role: profile.role as "otwl-dj" | "otwl-podcast" | "otwl-staff" | null
        } as UserProfile
      }));

      return { users, error: null };
    } catch (error) {
      return { 
        users: [], 
        error: { message: "An unexpected error occurred while fetching users" } 
      };
    }
  },

  // Admin: Update user profile
  async adminUpdateUserProfile(userId: string, updates: { display_name?: string; role?: string; is_admin?: boolean }): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", userId);

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred while updating user profile" } 
      };
    }
  }
};

-- Fix user_profiles RLS to allow trigger inserts during signup
-- This allows the auth trigger to create profiles for both regular and anonymous users

-- First, check if RLS is enabled (it should be)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policies that might be blocking
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "auth_insert" ON public.user_profiles;

-- Create a policy that allows users to create their own profile during signup
-- This works because the trigger runs in the context of the new user's auth.uid()
CREATE POLICY "allow_profile_creation_on_signup" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Ensure users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "select_own_profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "update_own_profile" 
ON public.user_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);
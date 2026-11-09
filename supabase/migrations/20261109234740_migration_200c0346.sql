-- Fix: Make email column nullable to support anonymous users
ALTER TABLE public.user_profiles ALTER COLUMN email DROP NOT NULL;
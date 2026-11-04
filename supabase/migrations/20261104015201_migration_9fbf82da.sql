-- Add AzuraCast streamer credentials to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS azuracast_streamer_username text,
ADD COLUMN IF NOT EXISTS azuracast_notes text;

-- Add index for efficient DJ credential lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_azuracast_username 
ON user_profiles(azuracast_streamer_username) 
WHERE azuracast_streamer_username IS NOT NULL;

COMMENT ON COLUMN user_profiles.azuracast_streamer_username IS 'AzuraCast Web DJ login username for streaming';
COMMENT ON COLUMN user_profiles.azuracast_notes IS 'Admin notes about DJ streaming setup, credentials, schedule preferences';
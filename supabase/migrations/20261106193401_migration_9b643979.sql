-- Feature flags table for admin toggles
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Only admins can update flags
CREATE POLICY "admin_update_flags" ON feature_flags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Everyone can read flags
CREATE POLICY "public_read_flags" ON feature_flags
  FOR SELECT
  USING (true);

-- Insert initial flags
INSERT INTO feature_flags (flag_name, enabled) VALUES
  ('mood_tracker_enabled', false),
  ('shows_map_enabled', true)
ON CONFLICT (flag_name) DO NOTHING;

-- Mood changes table
CREATE TABLE IF NOT EXISTS mood_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  city TEXT NOT NULL,
  mood_value INTEGER NOT NULL CHECK (mood_value >= 0 AND mood_value <= 100),
  song_title TEXT,
  song_artist TEXT,
  song_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mood_changes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own moods
CREATE POLICY "auth_insert_mood" ON mood_changes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public can read mood aggregates
CREATE POLICY "public_read_mood" ON mood_changes
  FOR SELECT
  USING (true);

-- Upcoming shows table
CREATE TABLE IF NOT EXISTS upcoming_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  show_date TIMESTAMPTZ NOT NULL,
  ticket_url TEXT NOT NULL,
  ticket_status TEXT, -- 'available', 'few left', 'resale only'
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE upcoming_shows ENABLE ROW LEVEL SECURITY;

-- Admins can manage shows
CREATE POLICY "admin_manage_shows" ON upcoming_shows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Public can read shows
CREATE POLICY "public_read_shows" ON upcoming_shows
  FOR SELECT
  USING (true);

-- Insert provided shows data
INSERT INTO upcoming_shows (artist_name, venue_name, city, lat, lng, show_date, ticket_url, ticket_status) VALUES
  ('Tinashe', 'Hollywood Palladium', 'Hollywood', 34.0985, -118.3242, '2026-11-07 19:00:00-08', 'https://www.axs.com/tinashe', 'resale only'),
  ('SYML', 'The Bellwether', 'Los Angeles', 34.0573, -118.2584, '2026-11-07 20:00:00-08', 'https://www.axs.com/syml-1', 'resale only'),
  ('SYML', 'The Bellwether', 'Los Angeles', 34.0573, -118.2584, '2026-11-08 20:00:00-08', 'https://www.axs.com/syml-2', 'available'),
  ('Jessie Reyez', 'Cal Coast Credit Union Open Air Theatre', 'San Diego', 32.7748, -117.0712, '2026-11-08 20:00:00-08', 'https://www.axs.com/jessie-reyez', 'few left');

-- City mood aggregation function (time-weighted, last 5 minutes)
CREATE OR REPLACE FUNCTION get_city_mood_aggregates()
RETURNS TABLE (
  city TEXT,
  avg_mood NUMERIC,
  listener_count BIGINT,
  last_update TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mc.city,
    AVG(mc.mood_value)::NUMERIC,
    COUNT(*)::BIGINT,
    MAX(mc.created_at)
  FROM mood_changes mc
  WHERE mc.created_at > NOW() - INTERVAL '5 minutes'
  GROUP BY mc.city;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
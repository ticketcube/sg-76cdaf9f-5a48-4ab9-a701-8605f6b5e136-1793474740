-- Create mood_categories table for customizable mood system
CREATE TABLE IF NOT EXISTS mood_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL,
  label TEXT NOT NULL,
  color_hsl TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for ordering
CREATE INDEX idx_mood_categories_order ON mood_categories(display_order);

-- Enable RLS
ALTER TABLE mood_categories ENABLE ROW LEVEL SECURITY;

-- Public read access (so MoodTap can fetch enabled moods)
CREATE POLICY "mood_categories_public_read" ON mood_categories
  FOR SELECT USING (true);

-- Admin-only write access
CREATE POLICY "mood_categories_admin_insert" ON mood_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "mood_categories_admin_update" ON mood_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "mood_categories_admin_delete" ON mood_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default mood categories (matching current hardcoded moods)
INSERT INTO mood_categories (category_name, emoji, label, color_hsl, display_order) VALUES
  ('cozy', '🛋️', 'Cozy', '180 60% 50%', 1),
  ('party', '🔥', 'Party', '10 80% 55%', 2),
  ('reflection', '💭', 'Reflection', '200 70% 65%', 3),
  ('focus', '🎧', 'Focus', '45 80% 55%', 4)
ON CONFLICT (category_name) DO NOTHING;
-- Add quadrant_position field to mood_categories for map placement control
ALTER TABLE mood_categories 
ADD COLUMN IF NOT EXISTS quadrant_position text DEFAULT 'lower_left';

-- Update existing moods with default positions
UPDATE mood_categories SET quadrant_position = 'lower_left' WHERE quadrant_position IS NULL;
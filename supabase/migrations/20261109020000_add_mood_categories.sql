-- Add mood_category enum type
CREATE TYPE mood_category AS ENUM ('cozy', 'party', 'reflection', 'focus');

-- Add mood_category column to mood_changes table
ALTER TABLE mood_changes 
ADD COLUMN mood_category mood_category;

-- Migrate existing mood_value data to categories
-- 0-25: reflection, 26-50: cozy, 51-75: focus, 76-100: party
UPDATE mood_changes 
SET mood_category = CASE 
  WHEN mood_value BETWEEN 0 AND 25 THEN 'reflection'::mood_category
  WHEN mood_value BETWEEN 26 AND 50 THEN 'cozy'::mood_category
  WHEN mood_value BETWEEN 51 AND 75 THEN 'focus'::mood_category
  ELSE 'party'::mood_category
END
WHERE mood_category IS NULL;

-- Make mood_category required for new rows
ALTER TABLE mood_changes 
ALTER COLUMN mood_category SET NOT NULL;

-- Create index for faster aggregation queries
CREATE INDEX idx_mood_changes_city_category ON mood_changes(city, mood_category, created_at DESC);

-- Create view for city mood aggregates (last 30 minutes)
CREATE OR REPLACE VIEW city_mood_aggregates AS
SELECT 
  city,
  mood_category,
  COUNT(*) as submission_count,
  MAX(created_at) as last_submission,
  EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) as seconds_since_last
FROM mood_changes
WHERE created_at > NOW() - INTERVAL '30 minutes'
  AND city IS NOT NULL
  AND city != 'Unknown'
  AND city != 'Local'
GROUP BY city, mood_category;

-- Create function to get dominant mood per city
CREATE OR REPLACE FUNCTION get_city_dominant_moods()
RETURNS TABLE (
  city TEXT,
  dominant_mood mood_category,
  total_submissions BIGINT,
  engagement_score NUMERIC,
  last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  WITH city_totals AS (
    SELECT 
      a.city,
      SUM(a.submission_count) as total,
      MAX(a.last_submission) as latest
    FROM city_mood_aggregates a
    GROUP BY a.city
  ),
  ranked_moods AS (
    SELECT 
      a.city,
      a.mood_category,
      a.submission_count,
      ROW_NUMBER() OVER (PARTITION BY a.city ORDER BY a.submission_count DESC) as rank
    FROM city_mood_aggregates a
  )
  SELECT 
    ct.city,
    rm.mood_category,
    ct.total,
    -- Engagement score: submissions per minute (higher = faster pulse)
    ROUND((ct.total::NUMERIC / 30.0), 2) as engagement_score,
    ct.latest
  FROM city_totals ct
  JOIN ranked_moods rm ON ct.city = rm.city
  WHERE rm.rank = 1
  ORDER BY ct.total DESC;
END;
$$ LANGUAGE plpgsql STABLE;
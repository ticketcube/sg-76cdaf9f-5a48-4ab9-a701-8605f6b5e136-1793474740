-- Create extraction_jobs table
CREATE TABLE IF NOT EXISTS extraction_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  artist TEXT,
  title TEXT NOT NULL,
  save_to_aimc BOOLEAN NOT NULL DEFAULT true,
  save_to_radio BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT,
  aimc_key TEXT,
  radio_path TEXT,
  duration_sec NUMERIC,
  size_bytes BIGINT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own jobs
CREATE POLICY "users_read_own_jobs" ON extraction_jobs
  FOR SELECT
  USING (auth.uid() = created_by);

-- Users can create jobs
CREATE POLICY "users_create_jobs" ON extraction_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Add index for efficient worker queries
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_status_created 
  ON extraction_jobs(status, created_at);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_extraction_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER extraction_jobs_updated_at
  BEFORE UPDATE ON extraction_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_extraction_jobs_updated_at();

COMMENT ON TABLE extraction_jobs IS 'Jobs for extracting audio from AIMC videos and saving to AIMC/AzuraCast';
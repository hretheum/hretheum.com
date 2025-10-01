-- Campaign Processing Status Table
-- Stores real-time processing status for campaign creation jobs

BEGIN;

-- Create table for campaign processing status
CREATE TABLE IF NOT EXISTS public.campaign_processing_status (
  job_id TEXT PRIMARY KEY,
  status JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_processing_status_created_at 
ON public.campaign_processing_status(created_at);

-- Enable Row Level Security
ALTER TABLE public.campaign_processing_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read campaign processing status" ON public.campaign_processing_status;
DROP POLICY IF EXISTS "Authenticated write campaign processing status" ON public.campaign_processing_status;

-- Policy 1: Public can read processing status (for polling)
CREATE POLICY "Public read campaign processing status" 
ON public.campaign_processing_status 
FOR SELECT 
USING (true);

-- Policy 2: Authenticated users can write processing status
CREATE POLICY "Authenticated write campaign processing status" 
ON public.campaign_processing_status 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.campaign_processing_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaign_processing_status_updated_at_trigger ON public.campaign_processing_status;

CREATE TRIGGER campaign_processing_status_updated_at_trigger
BEFORE UPDATE ON public.campaign_processing_status
FOR EACH ROW
EXECUTE FUNCTION public.campaign_processing_status_updated_at();

-- Auto-cleanup old processing status (older than 24 hours)
-- This prevents the table from growing indefinitely
CREATE OR REPLACE FUNCTION public.cleanup_old_campaign_processing_status()
RETURNS void AS $$
BEGIN
  DELETE FROM public.campaign_processing_status
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.campaign_processing_status IS 'Stores real-time processing status for campaign creation jobs. Auto-cleaned after 24 hours.';
COMMENT ON COLUMN public.campaign_processing_status.job_id IS 'Unique job identifier (e.g., camp_1234567890_abc)';
COMMENT ON COLUMN public.campaign_processing_status.status IS 'Processing status as JSON with steps, progress, etc.';

COMMIT;

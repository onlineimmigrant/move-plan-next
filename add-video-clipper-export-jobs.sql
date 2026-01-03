-- Video Clipper Export Jobs Table
-- Tracks background export/render jobs with progress and status

CREATE TABLE IF NOT EXISTS video_clipper_export_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES video_clipper_projects(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Output
  output_url TEXT,
  output_format TEXT DEFAULT 'mp4' CHECK (output_format IN ('mp4', 'webm')),
  output_name TEXT,
  
  -- Error tracking
  error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT video_clipper_export_jobs_org_user_fkey 
    FOREIGN KEY (organization_id, user_id) 
    REFERENCES profiles(organization_id, id) 
    ON DELETE CASCADE
);

-- RLS Policies
ALTER TABLE video_clipper_export_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own export jobs
CREATE POLICY video_clipper_export_jobs_select_policy ON video_clipper_export_jobs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can create export jobs
CREATE POLICY video_clipper_export_jobs_insert_policy ON video_clipper_export_jobs
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only system can update export jobs (status/progress)
-- We'll handle updates via service role in API routes

-- Indexes for performance
CREATE INDEX video_clipper_export_jobs_org_user_idx 
  ON video_clipper_export_jobs(organization_id, user_id);
CREATE INDEX video_clipper_export_jobs_status_idx 
  ON video_clipper_export_jobs(status);
CREATE INDEX video_clipper_export_jobs_created_idx 
  ON video_clipper_export_jobs(created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_video_clipper_export_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_clipper_export_jobs_updated_at_trigger
  BEFORE UPDATE ON video_clipper_export_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_video_clipper_export_jobs_updated_at();

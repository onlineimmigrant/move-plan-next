-- Video Clipper Projects Table
-- Stores editing projects with timeline segments, metadata, and autosave support

CREATE TABLE IF NOT EXISTS video_clipper_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  
  -- Source video reference
  source_video_url TEXT NOT NULL,
  source_video_name TEXT,
  source_folder TEXT DEFAULT 'Videos',
  
  -- Timeline data (array of segments)
  -- Each segment: { id, start, end, volume?, fadeIn?, fadeOut? }
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Export settings
  export_format TEXT DEFAULT 'mp4' CHECK (export_format IN ('mp4', 'webm')),
  
  -- Metadata for studio features (future)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT video_clipper_projects_org_user_fkey 
    FOREIGN KEY (organization_id, user_id) 
    REFERENCES profiles(organization_id, id) 
    ON DELETE CASCADE
);

-- RLS Policies
ALTER TABLE video_clipper_projects ENABLE ROW LEVEL SECURITY;

-- Users can view projects in their organization
CREATE POLICY video_clipper_projects_select_policy ON video_clipper_projects
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can insert their own projects
CREATE POLICY video_clipper_projects_insert_policy ON video_clipper_projects
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own projects
CREATE POLICY video_clipper_projects_update_policy ON video_clipper_projects
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own projects
CREATE POLICY video_clipper_projects_delete_policy ON video_clipper_projects
  FOR DELETE
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX video_clipper_projects_org_user_idx 
  ON video_clipper_projects(organization_id, user_id);
CREATE INDEX video_clipper_projects_created_idx 
  ON video_clipper_projects(created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_video_clipper_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER video_clipper_projects_updated_at_trigger
  BEFORE UPDATE ON video_clipper_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_video_clipper_projects_updated_at();

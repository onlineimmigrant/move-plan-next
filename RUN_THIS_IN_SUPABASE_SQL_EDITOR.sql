-- ========================================
-- Video Clipper: Database Migration
-- Run this in Supabase SQL Editor
-- ========================================

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS public.video_clipper_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL DEFAULT 'Untitled Project',
  source_url TEXT,
  source_name TEXT,
  source_folder TEXT,

  -- Timeline/editor state
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Phase 2+3: Metadata (title, description, tags, thumbnail)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Phase 2+3: Captions/subtitles
  captions JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create export jobs table
CREATE TABLE IF NOT EXISTS public.video_clipper_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID REFERENCES public.video_clipper_projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'processing',
  progress INTEGER NOT NULL DEFAULT 0,
  format TEXT,
  start_seconds DOUBLE PRECISION,
  end_seconds DOUBLE PRECISION,

  output_url TEXT,
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_video_clipper_projects_org 
  ON public.video_clipper_projects(organization_id);
  
CREATE INDEX IF NOT EXISTS idx_video_clipper_projects_created_by 
  ON public.video_clipper_projects(created_by);
  
CREATE INDEX IF NOT EXISTS idx_video_clipper_projects_updated_at 
  ON public.video_clipper_projects(organization_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_clipper_export_jobs_org 
  ON public.video_clipper_export_jobs(organization_id);
  
CREATE INDEX IF NOT EXISTS idx_video_clipper_export_jobs_project 
  ON public.video_clipper_export_jobs(project_id);
  
CREATE INDEX IF NOT EXISTS idx_video_clipper_export_jobs_created_at 
  ON public.video_clipper_export_jobs(organization_id, created_at DESC);

-- 4. Enable RLS
ALTER TABLE public.video_clipper_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_clipper_export_jobs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (org isolation via profiles table)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS video_clipper_projects_org_isolation ON public.video_clipper_projects;
DROP POLICY IF EXISTS video_clipper_export_jobs_org_isolation ON public.video_clipper_export_jobs;

CREATE POLICY video_clipper_projects_org_isolation ON public.video_clipper_projects
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY video_clipper_export_jobs_org_isolation ON public.video_clipper_export_jobs
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Done! Tables created with metadata and captions support.

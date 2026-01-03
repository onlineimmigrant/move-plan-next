-- Rename Video Clipper to Video Studio
-- Run this migration in Supabase SQL Editor

-- Rename tables
ALTER TABLE IF EXISTS public.video_clipper_projects RENAME TO video_studio_projects;
ALTER TABLE IF EXISTS public.video_clipper_export_jobs RENAME TO video_studio_export_jobs;

-- Rename foreign key constraint
ALTER TABLE IF EXISTS public.video_studio_export_jobs 
  DROP CONSTRAINT IF EXISTS video_clipper_export_jobs_project_id_fkey;

ALTER TABLE IF EXISTS public.video_studio_export_jobs
  ADD CONSTRAINT video_studio_export_jobs_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES public.video_studio_projects(id) ON DELETE SET NULL;

-- Rename indexes
ALTER INDEX IF EXISTS idx_video_clipper_projects_org RENAME TO idx_video_studio_projects_org;
ALTER INDEX IF EXISTS idx_video_clipper_projects_created_by RENAME TO idx_video_studio_projects_created_by;
ALTER INDEX IF EXISTS idx_video_clipper_projects_updated_at RENAME TO idx_video_studio_projects_updated_at;
ALTER INDEX IF EXISTS idx_video_clipper_export_jobs_org RENAME TO idx_video_studio_export_jobs_org;
ALTER INDEX IF EXISTS idx_video_clipper_export_jobs_project RENAME TO idx_video_studio_export_jobs_project;
ALTER INDEX IF EXISTS idx_video_clipper_export_jobs_created_at RENAME TO idx_video_studio_export_jobs_created_at;

-- Rename RLS policies
DROP POLICY IF EXISTS video_clipper_projects_org_isolation ON public.video_studio_projects;
DROP POLICY IF EXISTS video_clipper_export_jobs_org_isolation ON public.video_studio_export_jobs;

CREATE POLICY video_studio_projects_org_isolation ON public.video_studio_projects
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY video_studio_export_jobs_org_isolation ON public.video_studio_export_jobs
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

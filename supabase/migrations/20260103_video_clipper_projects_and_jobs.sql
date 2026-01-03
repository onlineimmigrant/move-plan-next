-- Video Clipper: Projects + Export Jobs (Phase 1 foundation)

-- Projects store editor state (source, segments, settings)
CREATE TABLE IF NOT EXISTS public.video_clipper_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL DEFAULT 'Untitled Project',
  source_url TEXT,
  source_name TEXT,
  source_folder TEXT,

  -- Timeline/editor state
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Metadata (title, description, tags, thumbnail)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Captions/subtitles
  captions JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_clipper_projects_org ON public.video_clipper_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_video_clipper_projects_created_by ON public.video_clipper_projects(created_by);
CREATE INDEX IF NOT EXISTS idx_video_clipper_projects_updated_at ON public.video_clipper_projects(organization_id, updated_at DESC);

-- Export job history (even if processing is currently synchronous)
CREATE TABLE IF NOT EXISTS public.video_clipper_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.video_clipper_projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'processing', -- queued | processing | done | error
  progress INTEGER NOT NULL DEFAULT 0,
  format TEXT,
  start_seconds DOUBLE PRECISION,
  end_seconds DOUBLE PRECISION,

  output_url TEXT,
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_clipper_export_jobs_org ON public.video_clipper_export_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_video_clipper_export_jobs_project ON public.video_clipper_export_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_video_clipper_export_jobs_created_at ON public.video_clipper_export_jobs(organization_id, created_at DESC);

-- RLS
ALTER TABLE public.video_clipper_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_clipper_export_jobs ENABLE ROW LEVEL SECURITY;

-- Org isolation via profiles.organization_id
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

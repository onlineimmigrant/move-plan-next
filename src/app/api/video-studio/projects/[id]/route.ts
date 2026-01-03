import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return { ok: false as const, status: 401, error: 'Unauthorized' };

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) return { ok: false as const, status: 401, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const organizationId = profile?.organization_id as string | undefined;

  if (!organizationId) return { ok: false as const, status: 403, error: 'Organization not found' };

  if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin' && profile.role !== 'owner')) {
    return { ok: false as const, status: 403, error: 'Admin access required' };
  }

  return { ok: true as const, userId: user.id, organizationId };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { data, error } = await supabase
      .from('video_studio_projects')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });

    return NextResponse.json({ project: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

async function updateProject(request: NextRequest, params: Promise<{ id: string }>) {
  try {
    const { id } = await params;
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json().catch(() => ({}));

    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body?.name === 'string') patch.name = body.name;
    if (typeof body?.sourceUrl === 'string' || body?.sourceUrl === null) patch.source_url = body.sourceUrl;
    if (typeof body?.sourceName === 'string' || body?.sourceName === null) patch.source_name = body.sourceName;
    if (typeof body?.sourceFolder === 'string' || body?.sourceFolder === null) patch.source_folder = body.sourceFolder;

    if (Array.isArray(body?.timeline)) patch.timeline = body.timeline;
    if (body?.settings && typeof body.settings === 'object') patch.settings = body.settings;

    const { data, error } = await supabase
      .from('video_studio_projects')
      .update(patch)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .select('id, updated_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, projectId: data.id, updatedAt: data.updated_at });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return updateProject(request, params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return updateProject(request, params);
}

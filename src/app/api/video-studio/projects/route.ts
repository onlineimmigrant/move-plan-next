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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { data, error } = await supabase
      .from('video_studio_projects')
      .select('id, name, source_name, source_folder, created_at, updated_at')
      .eq('organization_id', auth.organizationId)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ projects: data ?? [] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json().catch(() => ({}));

    const name: string = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : 'Untitled Project';
    const sourceUrl: string | null = typeof body?.sourceUrl === 'string' ? body.sourceUrl : null;
    const sourceName: string | null = typeof body?.sourceName === 'string' ? body.sourceName : null;
    const sourceFolder: string | null = typeof body?.sourceFolder === 'string' ? body.sourceFolder : null;

    const timeline = Array.isArray(body?.timeline) ? body.timeline : [];
    const settings = body?.settings && typeof body.settings === 'object' ? body.settings : {};

    const { data, error } = await supabase
      .from('video_studio_projects')
      .insert({
        organization_id: auth.organizationId,
        created_by: auth.userId,
        name,
        source_url: sourceUrl,
        source_name: sourceName,
        source_folder: sourceFolder,
        timeline,
        settings,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ projectId: data.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}

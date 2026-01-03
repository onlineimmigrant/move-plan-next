/**
 * Video Studio Export Jobs API
 * Create and poll background export jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!['admin', 'superadmin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { projectId, format, name } = body;

    // Create export job
    const { data: job, error: insertError } = await supabase
      .from('video_studio_export_jobs')
      .insert({
        project_id: projectId || null,
        organization_id: profile.organization_id,
        user_id: user.id,
        output_format: format || 'mp4',
        output_name: name,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Export Jobs API] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // TODO: Trigger actual export processing (queue job, webhook, etc.)
    // For now, return the job ID so client can poll

    return NextResponse.json({ job }, { status: 201 });
  } catch (error: any) {
    console.error('[Export Jobs API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

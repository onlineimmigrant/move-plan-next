// app/api/is-student/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServerClient';

export async function GET() {
  try {
    const { data: { session }, error: sessionError } = await supabaseServer.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ is_student: false }, { status: 200 });
    }

    const { data, error } = await supabaseServer
      .from('profiles')
      .select('is_student')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('API is-student: Profile error:', error.message);
      return NextResponse.json({ is_student: false }, { status: 200 });
    }

    return NextResponse.json({ is_student: data.is_student || false }, { status: 200 });
  } catch (err) {
    console.error('API is-student: Unexpected error:', err);
    return NextResponse.json({ is_student: false }, { status: 200 });
  }
}
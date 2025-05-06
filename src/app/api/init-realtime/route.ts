import { NextResponse } from 'next/server';
import { initializeRealtime } from '@/lib/supabase-realtime';

export async function GET() {
  try {
    console.log('Initializing real-time subscriptions via API route');
    initializeRealtime();
    return NextResponse.json({ message: 'Real-time subscriptions initialized' });
  } catch (error: any) {
    console.error('Failed to initialize real-time subscriptions:', error.message);
    return NextResponse.json({ error: 'Failed to initialize subscriptions' }, { status: 500 });
  }
}
// Test Flask connectivity from Next.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[test-flask] Testing connection to Flask...');
    
    const response = await fetch('http://localhost:8000/health');
    const data = await response.json();
    
    console.log('[test-flask] Success:', data);
    
    return NextResponse.json({ 
      success: true, 
      flask: data 
    });
  } catch (error) {
    console.error('[test-flask] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    }, { status: 500 });
  }
}

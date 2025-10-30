import { NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';

/**
 * API endpoint to generate a temporary token for AssemblyAI Universal Streaming (v3)
 * The API key should never be exposed to the client
 */
export async function GET() {
  try {
    // Try ASSEMBLYAI_API_KEY first (server-only), then fall back to NEXT_PUBLIC_ version
    const apiKey = process.env.ASSEMBLYAI_API_KEY || process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY;
    
    if (!apiKey) {
      console.error('AssemblyAI API key not configured');
      return NextResponse.json(
        { error: 'AssemblyAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔑 Using API key:', apiKey.substring(0, 8) + '...');

    // Initialize AssemblyAI client
    const client = new AssemblyAI({
      apiKey: apiKey,
    });

    // Generate temporary token using the NEW streaming API (v3)
    const token = await client.streaming.createTemporaryToken({
      expires_in_seconds: 600, // Token valid for 10 minutes (max allowed)
    });

    console.log('✅ Token generated successfully');
    
    return NextResponse.json({ token });
  } catch (error: any) {
    console.error('Error generating AssemblyAI token:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

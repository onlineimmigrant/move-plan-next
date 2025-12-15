// src/app/api/generate-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadToR2Generic } from '@/lib/r2';
import { nanoid } from 'nanoid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getHallo3Url(): string {
  const url = process.env.HALLO3_URL;
  if (!url) {
    throw new Error('HALLO3_URL not configured in environment');
  }
  return url;
}

export async function POST(req: NextRequest) {
  console.log('[generate-video] Request received');
  
  let HALLO3_URL;
  try {
    HALLO3_URL = getHallo3Url();
    console.log('[generate-video] HALLO3_URL:', HALLO3_URL);
  } catch (error: any) {
    console.error('[generate-video] HALLO3_URL not configured:', error.message);
    return NextResponse.json({ 
      error: 'AI video generation feature not available',
      details: 'Hallo3 service not configured'
    }, { status: 503 });
  }
  
  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error('[generate-video] Profile error:', profileError);
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 });
    }

    // Check admin permission
    if (profile.role !== 'admin' && profile.role !== 'superadmin' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const image = formData.get('image') as File;
    const script = (formData.get('script') as string) || 'Check out this amazing product!';
    const productId = formData.get('productId') as string;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    console.log('[generate-video] Processing:', { productId, scriptLength: script.length, imageSize: image.size });

    // Step 1: Generate TTS audio using free TTS service
    console.log('[generate-video] Generating TTS audio...');
    let audioBlob: Blob;
    
    try {
      // Use StreamElements TTS (free, reliable, no auth needed)
      const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=Brian&text=${encodeURIComponent(script)}`;
      console.log('[generate-video] Calling TTS API:', ttsUrl);
      
      const ttsResponse = await fetch(ttsUrl, {
        method: 'GET',
      });

      console.log('[generate-video] TTS response status:', ttsResponse.status);

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error('[generate-video] TTS API error response:', errorText);
        throw new Error(`TTS API returned ${ttsResponse.status}: ${errorText}`);
      }
      
      audioBlob = await ttsResponse.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('TTS returned empty audio');
      }
      
      console.log('[generate-video] TTS complete, size:', audioBlob.size);
    } catch (ttsError) {
      console.error('[generate-video] TTS error:', ttsError);
      console.error('[generate-video] TTS error type:', ttsError instanceof Error ? ttsError.constructor.name : typeof ttsError);
      if (ttsError instanceof Error) {
        console.error('[generate-video] TTS error stack:', ttsError.stack);
      }
      return NextResponse.json({ 
        error: 'Text-to-speech generation failed',
        details: ttsError instanceof Error ? ttsError.message : 'Unknown TTS error',
        stage: 'tts'
      }, { status: 500 });
    }

    // Step 2: Send image + audio to Hallo3 GPU server
    console.log('[generate-video] Sending to Hallo3:', HALLO3_URL);
    const halloForm = new FormData();
    halloForm.append('image', image);
    halloForm.append('audio', audioBlob, 'speech.mp3');

    const halloRes = await fetch(`${HALLO3_URL}/generate`, {
      method: 'POST',
      body: halloForm,
    });

    console.log('[generate-video] Hallo3 response status:', halloRes.status);

    if (!halloRes.ok) {
      const errorText = await halloRes.text();
      console.error('[generate-video] Hallo3 failed:', halloRes.status, errorText);
      return NextResponse.json({ 
        error: 'AI video generation failed', 
        details: errorText,
        stage: 'hallo3'
      }, { status: 500 });
    }

    const videoBlob = await halloRes.blob();
    console.log('[generate-video] Hallo3 complete, video size:', videoBlob.size);

    // Step 3: Upload to Cloudflare R2 with organization isolation
    const fileName = `${productId || 'product'}-${nanoid()}.mp4`;
    const videoBuffer = Buffer.from(await videoBlob.arrayBuffer());
    
    const videoUrl = await uploadToR2Generic(
      videoBuffer,
      fileName,
      'video/mp4',
      profile.organization_id,
      'ai-generated' // Subfolder for AI videos
    );

    console.log('[generate-video] Success:', videoUrl);

    return NextResponse.json({ 
      success: true,
      videoUrl,
      fileName,
      size: videoBlob.size,
      organizationId: profile.organization_id,
    });

  } catch (error) {
    console.error('[generate-video] Error:', error);
    console.error('[generate-video] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[generate-video] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error ? error.cause : undefined
    });
    
    // Handle timeout errors
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ 
        error: 'Video generation timeout. GPU may be busy or slow.',
        details: 'The request took too long to complete. Please try again.'
      }, { status: 504 });
    }

    return NextResponse.json({ 
      error: 'Failed to generate video',
      details: error instanceof Error ? error.message : String(error),
      stage: 'unknown'
    }, { status: 500 });
  }
}
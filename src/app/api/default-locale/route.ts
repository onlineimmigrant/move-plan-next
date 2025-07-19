import { NextRequest, NextResponse } from 'next/server';
import { getSettings } from '@/lib/getSettings';

export async function GET(request: NextRequest) {
  try {
    const settings = await getSettings();
    const defaultLocale = settings.language || 'en';
    
    return NextResponse.json({ 
      defaultLocale,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching default locale:', error);
    return NextResponse.json({ 
      defaultLocale: 'en',
      success: false,
      error: 'Failed to fetch settings'
    });
  }
}

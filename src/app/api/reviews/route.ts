import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { searchParams } = new URL(request.url);

    // Get current user and org
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('feedback_feedbackproducts')
      .select('*')
      .eq('organization_id', profile.organization_id);

    // Filters
    const productId = searchParams.get('product_id');
    const userId = searchParams.get('user_id');
    const isApproved = searchParams.get('is_approved');
    const ratingMin = searchParams.get('rating_min');
    const sortBy = searchParams.get('sort_by') || 'submitted_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (productId) query = query.eq('product_id', productId);
    if (userId) query = query.eq('user_id', userId);
    if (isApproved !== null && isApproved !== undefined) {
      query = query.eq('is_approved_by_admin', isApproved === 'true');
    }
    if (ratingMin) query = query.gte('rating', parseInt(ratingMin));

    // Sort and paginate
    query = query
      .order(sortBy as any, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: reviews, error } = await query;

    if (error) throw error;

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { product_id, product_name, rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, full_name')
      .eq('id', user.id)
      .single();

    const { data: review, error } = await supabase
      .from('feedback_feedbackproducts')
      .insert({
        user_id: user.id,
        organization_id: profile?.organization_id,
        product_id,
        product_name,
        rating,
        comment,
        submitted_at: new Date().toISOString(),
        is_approved_by_admin: false,
        is_visible_to_user: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ review }, { status: 201 });
  } catch (error: any) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create review' },
      { status: 500 }
    );
  }
}

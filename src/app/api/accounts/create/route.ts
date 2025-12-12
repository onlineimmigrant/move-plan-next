// app/api/accounts/create/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with user's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Verify the requesting user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Get the user's organization to verify they have permission
    const { data: requesterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !requesterProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user has admin or superadmin role
    if (!['admin', 'superadmin'].includes(requesterProfile.role || '')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const {
      email,
      full_name,
      username,
      city,
      postal_code,
      country,
      role,
      user_status,
      organization_id,
      is_student,
      is_site_creator,
      is_service_provider,
      service_title,
      hourly_rate,
      is_available_for_booking,
      // Team member fields
      is_team_member,
      team_job_title,
      team_department,
      team_image,
      team_pseudonym,
      team_description,
      team_skills,
      team_bio,
      team_experience_years,
      team_linkedin_url,
      team_twitter_url,
      team_github_url,
      team_portfolio_url,
      // Customer fields
      is_customer,
      customer_company,
      customer_job_title,
      customer_image,
      customer_rating,
      customer_testimonial,
      customer_company_logo,
      customer_linkedin_url,
      customer_project_type,
      customer_testimonial_date,
    } = body;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json({ error: 'Email and full name are required' }, { status: 400 });
    }

    // Verify organization_id matches requester's organization
    if (organization_id !== requesterProfile.organization_id) {
      return NextResponse.json({ error: 'Cannot create user in different organization' }, { status: 403 });
    }

    // Create Supabase admin client using service role key
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceRole) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate a temporary password (user should reset via email)
    const temporaryPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

    // Create the auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        organization_id,
      },
    });

    if (createError || !newUser.user) {
      console.error('Error creating auth user:', createError);
      return NextResponse.json({ 
        error: createError?.message || 'Failed to create user account' 
      }, { status: 500 });
    }

    // Update the profile with additional fields
    const updateData: any = {
      full_name,
      username: username || null,
      city: city || null,
      postal_code: postal_code || null,
      country: country || null,
      role: role || 'user',
      user_status: user_status || 'free_trial',
      organization_id,
      is_student: is_student || false,
      is_site_creator: is_site_creator || false,
      is_service_provider: is_service_provider || false,
      service_title: service_title || null,
      hourly_rate: hourly_rate ? parseFloat(hourly_rate) : null,
      is_available_for_booking: is_available_for_booking || false,
    };

    // Add team data if user is a team member
    if (is_team_member) {
      updateData.team = {
        is_team_member: true,
        job_title: team_job_title || '',
        department: team_department || '',
        image: team_image || null,
        skills: team_skills ? team_skills.split(',').map((s: string) => s.trim()) : [],
        pseudonym: team_pseudonym || null,
        description: team_description || '',
        bio: team_bio || '',
        is_featured: false,
        github_url: team_github_url || null,
        twitter_url: team_twitter_url || null,
        linkedin_url: team_linkedin_url || null,
        display_order: 0,
        portfolio_url: team_portfolio_url || null,
        experience_years: team_experience_years ? parseInt(team_experience_years) : null,
        assigned_sections: [],
      };
    }

    // Add customer data if user is a customer
    if (is_customer) {
      updateData.customer = {
        is_customer: true,
        is_lead: false, // Customer and lead are mutually exclusive
        company: customer_company || '',
        job_title: customer_job_title || '',
        image: customer_image || null,
        rating: customer_rating ? parseFloat(customer_rating) : 5,
        pseudonym: null,
        description: '',
        is_featured: false,
        company_logo: customer_company_logo || null,
        linkedin_url: customer_linkedin_url || null,
        project_type: customer_project_type || '',
        display_order: 0,
        testimonial_date: customer_testimonial_date || null,
        testimonial_text: customer_testimonial || '',
        assigned_sections: [],
      };
    } else {
      // New users default to leads
      updateData.customer = {
        is_customer: false,
        is_lead: true,
        lead_status: 'new',
        lead_source: 'manual_creation',
        lead_score: 0,
        lead_notes: '',
      };
    }

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', newUser.user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // User was created but profile update failed
      return NextResponse.json({ 
        error: 'User created but profile update failed',
        userId: newUser.user.id 
      }, { status: 500 });
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (resetError) {
      console.error('Error sending password reset:', resetError);
      // User was created successfully, just couldn't send reset email
    }

    return NextResponse.json({
      success: true,
      message: 'User account created successfully',
      userId: newUser.user.id,
      email: email,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in create account API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

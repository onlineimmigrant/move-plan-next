import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { email, stripeCustomerId } = await request.json();
    console.log('Received request to register user:', { email, stripeCustomerId });

    // Validate inputs
    if (!email || typeof email !== 'string') {
      console.error('Validation failed: Email is required');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!stripeCustomerId || typeof stripeCustomerId !== 'string') {
      console.error('Validation failed: Invalid Stripe customer ID');
      return NextResponse.json({ error: 'Invalid Stripe customer ID' }, { status: 400 });
    }

    // Check if user already exists in auth.users
    console.log('Checking for existing user in auth.users with email:', email);
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const existingUser = existingUsers.users.find((user) => user.email === email);
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log('Found existing user in auth.users:', userId);
    } else {
      // Create a new user
      console.log('Creating new user in auth.users with email:', email);
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: { role: 'user' },
      });

      if (userError) {
        console.error('Error creating user in auth.users:', userError);
        throw new Error(`Failed to create user: ${userError.message}`);
      }

      if (!userData.user) {
        console.error('No user data returned after creation');
        throw new Error('No user data returned after creation');
      }

      userId = userData.user.id;
      console.log('Created new user in auth.users:', userId);
    }

    // Check if a profile exists in the profiles table
    console.log('Checking for existing profile in profiles table with id:', userId);
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching profile:', fetchError);
      throw new Error(`Failed to fetch profile: ${fetchError.message}`);
    }

    if (!existingProfile) {
      // Create a new profile
      console.log('Creating new profile for user:', userId);
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([
          {
            id: userId,
            username: email,
            full_name: email,
            email: email,
            city: '',
            postal_code: '',
            country: '',
            created_at: new Date().toISOString(),
          },
        ]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }
    }

    // Link the stripeCustomerId to the customers table
    console.log('Linking Stripe customer ID to customers table:', stripeCustomerId);
    const { error: customerError } = await supabaseAdmin
      .from('customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
      });

    if (customerError) {
      console.error('Error updating customer in database:', customerError);
      throw new Error(`Failed to update customer in database: ${customerError.message}`);
    }

    console.log('Linked Stripe customer ID:', { user_id: userId, stripe_customer_id: stripeCustomerId });

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'User registration failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
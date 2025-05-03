import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { name, email, city, postal_code, country, stripeCustomerId } = await request.json();
    console.log('Received request to create user:', { email, stripeCustomerId, name, city, postal_code, country });

    // Validate email
    if (!email) {
      console.error('Validation failed: Email is required');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate stripeCustomerId if provided
    if (stripeCustomerId && typeof stripeCustomerId !== 'string') {
      console.error('Validation failed: Invalid Stripe customer ID');
      return NextResponse.json(
        { error: 'Invalid Stripe customer ID' },
        { status: 400 }
      );
    }

    // Check if user already exists in auth.users by listing users and filtering by email
    let userId: string | null = null;
    let page = 1;
    const perPage = 100; // Number of users to fetch per page
    let existingAuthUser = null;

    console.log('Checking for existing user in auth.users with email:', email);
    while (true) {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError) {
        console.error('Error listing users:', listError);
        throw new Error(`Failed to list users: ${listError.message}`);
      }

      console.log('Fetched users page:', page, 'count:', users.users.length);

      // Find the user by email
      existingAuthUser = users.users.find((user) => user.email === email);

      if (existingAuthUser || users.users.length < perPage) {
        // Either we found the user or we've reached the end of the user list
        break;
      }

      page += 1; // Fetch the next page
    }

    if (existingAuthUser) {
      // User already exists in auth.users
      userId = existingAuthUser.id;
      console.log('Found existing user in auth.users:', userId);
    } else {
      // Create a new user in auth.users using the admin API
      console.log('Creating new user in auth.users with email:', email);
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true, // Auto-confirm the email
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

    // Check if a profile already exists in profiles by id (not email)
    console.log('Checking for existing profile in profiles table with id:', userId);
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId) // Check by id, not email
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching profile:', fetchError);
      throw new Error(`Failed to fetch profile: ${fetchError.message}`);
    }

    if (existingProfile) {
      // Profile exists, update it instead of inserting
      console.log('Updating existing profile for user:', userId);
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          username: name || email,
          full_name: name || email,
          email: email,
          city: city || existingProfile.city,
          postal_code: postal_code || existingProfile.postal_code,
          country: country || existingProfile.country,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      // If stripeCustomerId is provided, update or insert into the customers table
      if (stripeCustomerId) {
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

        console.log('Linked Stripe customer ID for existing user:', {
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
        });
      }

      return NextResponse.json({ exists: true, updated: true, profile: updatedProfile });
    }

    // Create a new profile in Supabase
    console.log('Creating new profile for user:', userId);
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          username: name || email,
          full_name: name || email,
          email: email,
          city: city || '',
          postal_code: postal_code || '',
          country: country || '',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // If stripeCustomerId is provided, insert into the customers table
    if (stripeCustomerId) {
      console.log('Inserting Stripe customer ID into customers table:', stripeCustomerId);
      const { error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
        });

      if (customerError) {
        console.error('Error inserting customer into database:', customerError);
        throw new Error(`Failed to insert customer into database: ${customerError.message}`);
      }

      console.log('Inserted customer into database:', {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
      });
    }

    return NextResponse.json({ created: true, profile: profileData });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'User creation failed: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
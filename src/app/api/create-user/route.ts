// /src/app/api/create-user/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { name, email, city, postal_code, country } = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user already exists in auth.users by listing users and filtering by email
    let userId: string | null = null;
    let page = 1;
    const perPage = 100; // Number of users to fetch per page
    let existingAuthUser = null;

    while (true) {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (listError) {
        throw new Error(listError.message);
      }

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
    } else {
      // Create a new user in auth.users using the admin API
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true, // Auto-confirm the email
      });

      if (userError) {
        throw new Error(userError.message);
      }

      userId = userData.user.id;
    }

    // Check if a profile already exists in profiles by id (not email)
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId) // Check by id, not email
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw new Error(fetchError.message);
    }

    if (existingProfile) {
      // Profile exists, update it instead of inserting
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
        throw new Error(updateError.message);
      }

      return NextResponse.json({ exists: true, updated: true, profile: updatedProfile });
    }

    // Create a new profile in Supabase
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
      throw new Error(profileError.message);
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
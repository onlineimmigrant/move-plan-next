// /app/api/register-user-free-trial/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { calculateEndDate } from '../../../utils/CalculateEndDate';

export async function POST(request: Request) {
  try {
    const { email, stripeCustomerId } = await request.json();
    console.log('Received request to register user:', { email, stripeCustomerId });

    // Validate inputs
    if (!email || typeof email !== 'string') {
      console.error('Validation failed: Email is required');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error: Missing Supabase keys' }, { status: 500 });
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

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      throw new Error(`Failed to fetch profile: ${fetchError.message}`);
    }

    if (!existingProfile) {
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

    // Link the stripeCustomerId to the customers table if provided
    if (stripeCustomerId && typeof stripeCustomerId === 'string') {
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
    } else {
      console.log('No Stripe customer ID provided, skipping customers table upsert');
    }

    // Check for existing active purchase to prevent duplicates
    const purchasedItemId = '2389918c-edfe-4e05-9595-0f990b408468';
    console.log('Checking for existing purchase for user:', userId);
    const { data: existingPurchase, error: fetchPurchaseError } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('purchased_item_id', purchasedItemId)
      .eq('profiles_id', userId)
      .eq('is_active', true)
      .single();

    if (fetchPurchaseError && fetchPurchaseError.code !== 'PGRST116') {
      console.error('Error checking existing purchase:', fetchPurchaseError);
      throw new Error(`Failed to check existing purchase: ${fetchPurchaseError.message}`);
    }

    if (existingPurchase) {
      console.log('Active purchase already exists for user:', userId, 'skipping purchase creation');
    } else {
      console.log('Creating purchase record for free trial for user:', userId);
      const startDate = new Date();
      const endDate = calculateEndDate(startDate, '7-day');

      const { error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .insert({
          purchased_item_id: purchasedItemId,
          profiles_id: userId,
          transaction_id: null,
          start_date: startDate.toISOString(),
          end_date: endDate ? endDate.toISOString() : null,
          is_active: true,
        });

      if (purchaseError) {
        console.error('Error creating purchase record:', purchaseError);
        throw new Error(`Failed to create purchase record: ${purchaseError.message}`);
      }

      console.log('Created purchase record for free trial:', { userId, purchasedItemId });
    }

    console.log('User registration completed:', { user_id: userId });
    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Error registering user:', error.message, error.stack);
    return NextResponse.json(
      { error: `User registration failed: ${error.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}
// lib/stripe-supabase.ts
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Access the Supabase Auth admin API
export const supabaseAdmin = supabase.auth.admin;
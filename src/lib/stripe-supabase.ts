// lib/stripe-supabase.ts
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
//import { initializeRealtime } from './supabase-realtime';

let stripeInstance: Stripe | null = null;
let supabaseInstance: SupabaseClient | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable not set');
    }
    stripeInstance = new Stripe(stripeKey);
  }
  return stripeInstance;
}

function createSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Lazy getters using Proxy
export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    const instance = getStripe();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!supabaseInstance) {
      supabaseInstance = createSupabase();
    }
    return supabaseInstance[prop as keyof SupabaseClient];
  }
});



// Access the Supabase Auth admin API
export const supabaseAdmin = supabase.auth.admin;
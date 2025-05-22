import { createClient } from '@supabase/supabase-js';
//import fetch from 'node-fetch';

// Define product table structure
interface Product {
  id: string;
  product_name: string;
  is_displayed: boolean;
  product_description?: string | null;
  links_to_image?: string | null;
  created_at?: string;
  updated_at?: string;
  stripe_product_id?: string | null;
  attrs?: Record<string, any>;
}

// Define pricingplan table structure
interface PricingPlan {
  id: string;
  product_id: string;
  price: number;
  currency: string;
  is_active: boolean;
  type: string;
  recurring_interval?: string | null;
  recurring_interval_count?: number | null;
  created_at?: string;
  stripe_price_id?: string | null;
  attrs?: Record<string, any>;
}

// Define pricingplan_features table structure
interface PricingPlanFeature {
  id: string;
  pricingplan_id: string;
  feature_id: string;
  created_at?: string;
}

// Define Supabase payload structure
interface SupabasePayload<T> {
  table: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
}

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const syncApiUrl = process.env.NEXT_PUBLIC_SYNC_API_URL || 'http://localhost:3000/api/sync-app-to-stripe';
const syncApiSecret = process.env.SYNC_API_SECRET || '';

// Validate environment variables
if (!supabaseUrl || !supabaseServiceRoleKey || !syncApiSecret) {
  console.error('Missing environment variables:', {
    supabaseUrl: supabaseUrl ? '[SET]' : 'MISSING',
    supabaseServiceRoleKey: supabaseServiceRoleKey ? '[REDACTED]' : 'MISSING',
    syncApiSecret: syncApiSecret ? '[REDACTED]' : 'MISSING',
  });
  throw new Error('Missing required environment variables');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Singleton flag
let isInitialized = false;

// Validate payload before sending
function validatePayload(payload: SupabasePayload<any>): boolean {
  if (!payload?.table || !payload?.eventType) {
    console.error('Invalid payload structure:', payload);
    return false;
  }
  if (payload.table === 'product' && (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE')) {
    if (!payload.new?.id || !payload.new?.product_name) {
      console.error('Invalid product payload:', payload.new);
      return false;
    }
    // Log links_to_image to inspect its format
    console.log('links_to_image value:', payload.new?.links_to_image, 'Type:', typeof payload.new?.links_to_image);
  }
  return true;
}

// Send event to sync API
async function sendToSyncApi(payload: SupabasePayload<any>) {
  try {
    if (!validatePayload(payload)) {
      throw new Error('Invalid payload, skipping sync');
    }

    console.log('Sending to sync API:', JSON.stringify(payload, null, 2));
    const response = await fetch(syncApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${syncApiSecret}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Sync API error: ${JSON.stringify(result)}`);
    }
    console.log('Sync API response:', result);
    return result;
  } catch (error: any) {
    console.error('Failed to send to sync API:', error.message, 'Payload:', JSON.stringify(payload, null, 2));
    return null; // Prevent subscription crash
  }
}

// Set up real-time subscriptions
function setupRealtimeSubscriptions() {
  console.log('Setting up Supabase subscriptions for product, pricingplan, and pricingplan_features');

  // Test Supabase connection
  supabase
    .from('product')
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
      console.log('Supabase connection test:', { data, error: error?.message });
    });

  // Subscribe to product changes
  supabase
    .channel('product-changes')
    // Use type assertion to bypass TypeScript error
    .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'product' }, async (payload: SupabasePayload<Product>) => {
      console.log('Product event:', payload.eventType, payload.new?.id || payload.old?.id);
      await sendToSyncApi(payload);
    })
    .subscribe((status, error) => {
      console.log('Product subscription status:', status);
      if (error) console.error('Product subscription error:', error.message);
      if (status === 'SUBSCRIBED') console.log('Product subscription active');
    });

  // Subscribe to pricingplan changes
  supabase
    .channel('pricingplan-changes')
    .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'pricingplan' }, async (payload: SupabasePayload<PricingPlan>) => {
      console.log('Pricingplan event:', payload.eventType, payload.new?.id || payload.old?.id);
      await sendToSyncApi(payload);
    })
    .subscribe((status, error) => {
      console.log('Pricingplan subscription status:', status);
      if (error) console.error('Pricingplan subscription error:', error.message);
      if (status === 'SUBSCRIBED') console.log('Pricingplan subscription active');
    });

  // Subscribe to pricingplan_features changes
  supabase
    .channel('pricingplan_features-changes')
    .on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table: 'pricingplan_features' },
      async (payload: SupabasePayload<PricingPlanFeature>) => {
        console.log('Pricingplan_features event:', payload.eventType, payload.new?.id || payload.old?.id);
        await sendToSyncApi(payload);
      }
    )
    .subscribe((status, error) => {
      console.log('Pricingplan_features subscription status:', status);
      if (error) console.error('Pricingplan_features subscription error:', error.message);
      if (status === 'SUBSCRIBED') console.log('Pricingplan_features subscription active');
    });
}

// Initialize subscriptions
export function initializeRealtime() {
  if (isInitialized) {
    console.log('Subscriptions already initialized');
    return;
  }

  console.log('Initializing Supabase real-time subscriptions');
  try {
    setupRealtimeSubscriptions();
    isInitialized = true;
  } catch (error: any) {
    console.error('Failed to initialize subscriptions:', error.message);
    throw error;
  }
}
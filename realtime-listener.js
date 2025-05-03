const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client with anon key (for Realtime)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to forward events to the sync-to-stripe endpoint
const forwardEvent = async (payload) => {
  try {
    const response = await fetch('http://localhost:3000/api/sync-to-stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication header if needed
        // 'Authorization': `Bearer ${YOUR_SECRET_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('Forwarded event to /api/sync-to-stripe:', result);
  } catch (error) {
    console.error('Error forwarding event to /api/sync-to-stripe:', error);
  }
};

// Subscribe to updates in stripe_products
supabase
  .channel('stripe_products')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stripe_products' }, (payload) => {
    console.log('Change detected in stripe_products:', payload);
    forwardEvent({
      table: 'stripe_products',
      eventType: payload.eventType,
      new: payload.new,
      old: payload.old,
    });
  })
  // Subscribe to deletions in stripe_products
  .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stripe_products' }, (payload) => {
    console.log('Deletion detected in stripe_products:', payload);
    forwardEvent({
      table: 'stripe_products',
      eventType: payload.eventType,
      old: payload.old,
    });
  })
  .subscribe((status) => {
    console.log('stripe_products subscription status:', status);
  });

// Subscribe to updates in stripe_prices
supabase
  .channel('stripe_prices')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'stripe_prices' }, (payload) => {
    console.log('Change detected in stripe_prices:', payload);
    forwardEvent({
      table: 'stripe_prices',
      eventType: payload.eventType,
      new: payload.new,
      old: payload.old,
    });
  })
  // Subscribe to deletions in stripe_prices
  .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stripe_prices' }, (payload) => {
    console.log('Deletion detected in stripe_prices:', payload);
    forwardEvent({
      table: 'stripe_prices',
      eventType: payload.eventType,
      old: payload.old,
    });
  })
  .subscribe((status) => {
    console.log('stripe_prices subscription status:', status);
  });

// Keep the script running
process.on('SIGINT', () => {
  console.log('Shutting down Realtime listener...');
  supabase.removeAllChannels();
  process.exit(0);
});
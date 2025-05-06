import { supabase } from '@/lib/stripe-supabase';

// Use the base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Function to create a pricing plan in Supabase and sync to Stripe
export async function createPricingPlan(pricingPlanData: any) {
  try {
    console.log('Attempting to create pricing plan with data:', pricingPlanData);

    // Validate required fields
    if (!pricingPlanData.product_id) {
      throw new Error('Missing required field: product_id');
    }
    if (!pricingPlanData.price || !pricingPlanData.currency) {
      throw new Error('Missing required fields: price or currency');
    }

    // Verify that the product_id references a valid product with a stripe_product_id
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('id, stripe_product_id')
      .eq('id', String(pricingPlanData.product_id))
      .single();

    if (productError || !product) {
      console.error('Failed to fetch associated product:', productError);
      throw new Error(`Invalid product_id: ${productError?.message || 'Product not found'}`);
    }

    if (!product.stripe_product_id) {
      console.error('Associated product does not have a stripe_product_id:', product);
      throw new Error('Associated product does not have a stripe_product_id. Sync the product to Stripe first.');
    }

    console.log(`Associated product found with ID: ${product.id}, stripe_product_id: ${product.stripe_product_id}`);

    // Insert the pricing plan into Supabase
    const { data, error } = await supabase
      .from('pricingplan')
      .insert({
        ...pricingPlanData,
        created_at: pricingPlanData.created_at || new Date().toISOString(),
        updated_at: pricingPlanData.updated_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to create pricing plan in Supabase: ${error.message}`);
    }

    if (!data) {
      console.error('No data returned from Supabase insert');
      throw new Error('Failed to create pricing plan: No data returned');
    }

    console.log(`Created pricing plan in Supabase with ID: ${data.id}`);

    // Sync to Stripe by calling the API endpoint with full URL
    console.log('Calling /api/sync/pricingplan to sync to Stripe...');
    const syncResponse = await fetch(`${API_BASE_URL}/api/sync/pricingplan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', pricingPlanId: data.id }),
    });

    // Log the raw response text before parsing
    const responseText = await syncResponse.text();
    console.log('Raw response from /api/sync/pricingplan:', responseText);

    // Attempt to parse the response as JSON, with a fallback
    let syncResult = { error: 'Unknown error from /api/sync/pricingplan' };
    try {
      syncResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      // Fallback to raw response text as the error message
      syncResult = { error: responseText || 'Failed to parse response from /api/sync/pricingplan' };
    }

    if (!syncResponse.ok) {
      console.error('Sync to Stripe failed:', syncResult);
      throw new Error(`Failed to sync pricing plan to Stripe: ${syncResult.error || 'Unknown error'}`);
    }

    console.log(`Successfully synced pricing plan ${data.id} to Stripe`);
    return data;
  } catch (error: any) {
    console.error('Error in createPricingPlan:', error.message, 'Stack:', error.stack);
    throw error;
  }
}

// Function to update a pricing plan in Supabase and sync to Stripe
export async function updatePricingPlan(pricingPlanId: string, updates: any) {
  try {
    console.log(`Attempting to update pricing plan with ID: ${pricingPlanId}`, updates);

    // If updates include product_id, validate it
    if (updates.product_id) {
      const { data: product, error: productError } = await supabase
        .from('product')
        .select('id, stripe_product_id')
        .eq('id', String(updates.product_id))
        .single();

      if (productError || !product) {
        console.error('Failed to fetch associated product:', productError);
        throw new Error(`Invalid product_id: ${productError?.message || 'Product not found'}`);
      }

      if (!product.stripe_product_id) {
        console.error('Associated product does not have a stripe_product_id:', product);
        throw new Error('Associated product does not have a stripe_product_id. Sync the product to Stripe first.');
      }

      console.log(`Associated product found with ID: ${product.id}, stripe_product_id: ${product.stripe_product_id}`);
    }

    const { data, error } = await supabase
      .from('pricingplan')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pricingPlanId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Failed to update pricing plan in Supabase: ${error.message}`);
    }

    console.log(`Updated pricing plan in Supabase with ID: ${data.id}`);

    const syncResponse = await fetch(`${API_BASE_URL}/api/sync/pricingplan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', pricingPlanId: data.id }),
    });

    const responseText = await syncResponse.text();
    console.log('Raw response from /api/sync/pricingplan:', responseText);

    let syncResult = { error: 'Unknown error from /api/sync/pricingplan' };
    try {
      syncResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      syncResult = { error: responseText || 'Failed to parse response from /api/sync/pricingplan' };
    }

    if (!syncResponse.ok) {
      console.error('Sync to Stripe failed:', syncResult);
      throw new Error(`Failed to sync pricing plan to Stripe: ${syncResult.error || 'Unknown error'}`);
    }

    console.log(`Successfully synced updated pricing plan ${data.id} to Stripe`);
    return data;
  } catch (error: any) {
    console.error('Error in updatePricingPlan:', error.message, 'Stack:', error.stack);
    throw error;
  }
}

// Function to delete a pricing plan in Supabase and sync to Stripe
export async function deletePricingPlan(pricingPlanId: string) {
  try {
    console.log(`Attempting to delete pricing plan with ID: ${pricingPlanId}`);

    const { error } = await supabase
      .from('pricingplan')
      .delete()
      .eq('id', pricingPlanId);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Failed to delete pricing plan from Supabase: ${error.message}`);
    }

    console.log(`Deleted pricing plan from Supabase with ID: ${pricingPlanId}`);

    console.log('Calling /api/sync/pricingplan to sync deletion to Stripe...');
    const syncResponse = await fetch(`${API_BASE_URL}/api/sync/pricingplan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', pricingPlanId }),
    });

    const responseText = await syncResponse.text();
    console.log('Raw response from /api/sync/pricingplan:', responseText);

    let syncResult = { error: 'Unknown error from /api/sync/pricingplan' };
    try {
      syncResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      syncResult = { error: responseText || 'Failed to parse response from /api/sync/pricingplan' };
    }

    if (!syncResponse.ok) {
      console.error('Sync deletion to Stripe failed:', syncResult);
      throw new Error(`Failed to sync pricing plan deletion to Stripe: ${syncResult.error || 'Unknown error'}`);
    }

    console.log(`Successfully synced pricing plan deletion ${pricingPlanId} to Stripe`);
  } catch (error: any) {
    console.error('Error in deletePricingPlan:', error.message, 'Stack:', error.stack);
    throw error;
  }
}
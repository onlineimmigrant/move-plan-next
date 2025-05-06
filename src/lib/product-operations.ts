import { supabase } from '@/lib/stripe-supabase';

// Function to create a product in Supabase and sync to Stripe
export async function createProduct(productData: any) {
  try {
    console.log('Attempting to create product with data:', productData);

    // Ensure required fields are present
    if (!productData.product_name) {
      throw new Error('Missing required field: product_name');
    }

    // Insert the product into Supabase
    const { data, error } = await supabase
      .from('product')
      .insert({
        ...productData,
        created_at: productData.created_at || new Date().toISOString(),
        updated_at: productData.updated_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to create product in Supabase: ${error.message}`);
    }

    if (!data) {
      console.error('No data returned from Supabase insert');
      throw new Error('Failed to create product: No data returned');
    }

    console.log(`Created product in Supabase with ID: ${data.id}`);

    // Sync to Stripe by calling the API endpoint
    console.log('Calling /api/sync/product to sync to Stripe...');
    const syncResponse = await fetch('/api/sync/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', productId: data.id }),
    });

    const syncResult = await syncResponse.json();
    if (!syncResponse.ok) {
      console.error('Sync to Stripe failed:', syncResult);
      throw new Error(`Failed to sync product to Stripe: ${syncResult.error}`);
    }

    console.log(`Successfully synced product ${data.id} to Stripe`);
    return data;
  } catch (error: any) {
    console.error('Error in createProduct:', error.message, 'Stack:', error.stack);
    throw error;
  }
}

// Function to update a product in Supabase and sync to Stripe
export async function updateProduct(productId: string, updates: any) {
  try {
    console.log(`Attempting to update product with ID: ${productId}`, updates);

    const { data, error } = await supabase
      .from('product')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Failed to update product in Supabase: ${error.message}`);
    }

    console.log(`Updated product in Supabase with ID: ${data.id}`);

    const syncResponse = await fetch('/api/sync/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', productId: data.id }),
    });

    const syncResult = await syncResponse.json();
    if (!syncResponse.ok) {
      console.error('Sync to Stripe failed:', syncResult);
      throw new Error(`Failed to sync product to Stripe: ${syncResult.error}`);
    }

    console.log(`Successfully synced updated product ${data.id} to Stripe`);
    return data;
  } catch (error: any) {
    console.error('Error in updateProduct:', error.message, 'Stack:', error.stack);
    throw error;
  }
}

// Function to delete a product in Supabase and sync to Stripe
export async function deleteProduct(productId: string) {
  try {
    console.log(`Attempting to delete product with ID: ${productId}`);

    // Delete the product from Supabase
    const { error } = await supabase
      .from('product')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Failed to delete product from Supabase: ${error.message}`);
    }

    console.log(`Deleted product from Supabase with ID: ${productId}`);

    // Sync to Stripe by calling the API endpoint
    console.log('Calling /api/sync/product to sync deletion to Stripe...');
    const syncResponse = await fetch('/api/sync/product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', productId }),
    });

    const syncResult = await syncResponse.json();
    if (!syncResponse.ok) {
      console.error('Sync deletion to Stripe failed:', syncResult);
      throw new Error(`Failed to sync product deletion to Stripe: ${syncResult.error}`);
    }

    console.log(`Successfully synced product deletion ${productId} to Stripe`);
  } catch (error: any) {
    console.error('Error in deleteProduct:', error.message, 'Stack:', error.stack);
    throw error;
  }
}
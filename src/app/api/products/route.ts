// /app/api/products/route.ts
import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { stripe } from '@/lib/stripe-supabase';
import { getBaseUrl } from '@/lib/utils';

function validateImageUrl(url: string): string | undefined {
  if (!url || typeof url !== 'string') {
    return undefined;
  }
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://') ? url : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  try {
    let baseUrl = getBaseUrl(true);
    console.log('POST /api/products baseUrl:', baseUrl);

    let organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.log('Falling back to NEXT_PUBLIC_BASE_URL for POST /api/products');
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' || 'https://metexam.co.uk';
      console.log('Retry with baseUrl:', baseUrl);
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        console.error('Organization not found after fallback');
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
    }

    const body = await request.json();
    console.log('POST /api/products body:', body);
    const { product_name, is_displayed = true, product_description, product_tax_code, links_to_image, attrs } = body;

    if (!product_name) {
      return NextResponse.json({ error: 'Missing required field: product_name' }, { status: 400 });
    }

    const { data: product, error: insertError } = await supabase
      .from('product')
      .insert({
        product_name,
        is_displayed,
        product_description,
        product_tax_code,
        links_to_image,
        attrs,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !product) {
      console.error('Error inserting product:', insertError?.message, 'product:', product);
      return NextResponse.json({ error: `Failed to create product: ${insertError?.message}` }, { status: 500 });
    }

    const validatedImageUrl = validateImageUrl(links_to_image);
    if (links_to_image && !validatedImageUrl) {
      console.warn(`Invalid or unsupported image URL provided: ${links_to_image}. Proceeding without image.`);
    }

    const createParams: any = {
      name: product_name,
      active: is_displayed,
      tax_code: product_tax_code,
      description: product_description || undefined,
      metadata: attrs || undefined,
    };

    if (validatedImageUrl) {
      createParams.images = [validatedImageUrl];
    }

    const stripeProduct = await stripe.products.create(createParams);
    console.log('Created Stripe product:', stripeProduct.id);

    const { error: updateError } = await supabase
      .from('product')
      .update({ stripe_product_id: stripeProduct.id, updated_at: new Date().toISOString() })
      .eq('id', product.id)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Error updating product with stripe_product_id:', updateError.message);
      return NextResponse.json({ error: `Failed to update product with stripe_product_id: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: `Created product ${product.id} and Stripe product ${stripeProduct.id}` });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/products:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to create product: ${error.message}` }, { status: 500 });
  }
}

// /app/api/products/route.ts (partial update to PUT handler)
export async function PUT(request: Request) {
  try {
    let baseUrl = getBaseUrl(true);
    console.log('PUT /api/products baseUrl:', baseUrl);

    let organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.log('Falling back to NEXT_PUBLIC_BASE_URL for PUT /api/products');
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' || 'https://metexam.co.uk';
      console.log('Retry with baseUrl:', baseUrl);
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        console.error('Organization not found after fallback');
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
    }
    console.log('PUT /api/products organizationId:', organizationId);

    const body = await request.json();
    console.log('PUT /api/products body:', body);
    const { productId, updates } = body;

    if (!productId || !updates) {
      return NextResponse.json({ error: 'Missing productId or updates' }, { status: 400 });
    }

    // Ensure productId is a string
    const productIdStr = String(productId);
    console.log('Converted productId to string:', productIdStr);

    const { data: product, error: fetchError } = await supabase
      .from('product')
      .select('id, product_name, is_displayed, product_description, product_tax_code, links_to_image, attrs, stripe_product_id, organization_id')
      .eq('id', productIdStr)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !product) {
      console.error('Error fetching product:', fetchError?.message, 'productId:', productIdStr, 'organizationId:', organizationId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('Fetched product:', product);
    console.log('Type of fetched product.id:', typeof product.id, 'Value:', product.id);

    // Explicitly assign variables instead of destructuring to avoid scoping issues
    console.log('Updates object:', updates);
    const product_name = updates.product_name;
    const is_displayed = updates.is_displayed;
    const product_description = updates.product_description;
    const product_tax_code = updates.product_tax_code;
    const links_to_image = updates.links_to_image;
    const attrs = updates.attrs;

    console.log('Extracted updates - product_name:', product_name);
    console.log('Extracted updates - is_displayed:', is_displayed);
    console.log('Extracted updates - product_description:', product_description);
    console.log('Extracted updates - product_tax_code:', product_tax_code);
    console.log('Extracted updates - links_to_image:', links_to_image);
    console.log('Extracted updates - attrs:', attrs);

    const validatedImageUrl = validateImageUrl(links_to_image !== undefined ? links_to_image : product.links_to_image);
    if (links_to_image !== undefined && links_to_image && !validatedImageUrl) {
      console.warn(`Invalid or unsupported image URL provided: ${links_to_image}. Keeping existing image.`);
    }

    const updateData = {
      product_name: product_name || product.product_name,
      is_displayed: is_displayed !== undefined ? is_displayed : product.is_displayed,
      product_description: product_description !== undefined ? product_description : product.product_description,
      product_tax_code: product_tax_code !== undefined ? product_tax_code : product.product_tax_code,
      links_to_image: links_to_image !== undefined ? (validatedImageUrl || undefined) : product.links_to_image,
      attrs: attrs !== undefined ? attrs : product.attrs,
      updated_at: new Date().toISOString(),
    };

    console.log('Updating product with data:', updateData);

    const idForUpdate = product.id;
    console.log('Using id for update:', idForUpdate, 'Type:', typeof idForUpdate);

    const { data: updatedProduct, error: updateError } = await supabase
      .from('product')
      .update(updateData)
      .eq('id', idForUpdate)
      .eq('organization_id', organizationId)
      .select();

    if (updateError) {
      console.error('Error updating product in Supabase:', updateError.message, 'productId:', idForUpdate, 'organizationId:', organizationId, 'updateData:', updateData);
      return NextResponse.json({ error: `Failed to update product: ${updateError.message}` }, { status: 500 });
    }

    if (!updatedProduct || updatedProduct.length === 0) {
      console.error('No rows updated in Supabase', 'productId:', idForUpdate, 'organizationId:', organizationId, 'updateData:', updateData);
      return NextResponse.json({ error: 'Failed to update product: No rows affected' }, { status: 500 });
    }

    console.log('Updated product in Supabase:', updatedProduct[0]);

    const finalImageUrl = validateImageUrl(updatedProduct[0].links_to_image);

    if (!product.stripe_product_id) {
      const createParams: any = {
        name: updatedProduct[0].product_name,
        active: updatedProduct[0].is_displayed,
        description: updatedProduct[0].product_description || undefined,
        tax_code: updatedProduct[0].product_tax_code,
        metadata: updatedProduct[0].attrs || undefined,
      };

      if (finalImageUrl) {
        createParams.images = [finalImageUrl];
      }

      const stripeProduct = await stripe.products.create(createParams);
      console.log('Created Stripe product:', stripeProduct.id);

      const { error: stripeUpdateError } = await supabase
        .from('product')
        .update({ stripe_product_id: stripeProduct.id, updated_at: new Date().toISOString() })
        .eq('id', idForUpdate)
        .eq('organization_id', organizationId);

      if (stripeUpdateError) {
        console.error('Error updating product with stripe_product_id:', stripeUpdateError.message);
        return NextResponse.json({ error: `Failed to update stripe_product_id: ${stripeUpdateError.message}` }, { status: 500 });
      }

      return NextResponse.json({ message: `Created Stripe product ${stripeProduct.id} for product ${idForUpdate}` });
    }

    const updateParams: any = {
      name: updatedProduct[0].product_name,
      active: updatedProduct[0].is_displayed,
      description: updatedProduct[0].product_description || undefined,
      tax_code: updatedProduct[0].product_tax_code,
      metadata: updatedProduct[0].attrs || undefined,
    };

    if (finalImageUrl) {
      updateParams.images = [finalImageUrl];
    } else {
      updateParams.images = [];
    }

    console.log('Updating Stripe product with params:', updateParams);

    try {
      const updatedStripeProduct = await stripe.products.update(product.stripe_product_id, updateParams);
      console.log('Updated Stripe product:', updatedStripeProduct.id);
    } catch (stripeError: any) {
      console.error('Error updating Stripe product:', stripeError.message, 'stripe_product_id:', product.stripe_product_id);
      return NextResponse.json({ error: `Failed to update Stripe product: ${stripeError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: `Updated product ${idForUpdate} and Stripe product ${product.stripe_product_id}` });
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/products:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to update product: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    let baseUrl = getBaseUrl(true);
    console.log('DELETE /api/products baseUrl:', baseUrl);

    let organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.log('Falling back to NEXT_PUBLIC_BASE_URL for DELETE /api/products');
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'  || 'https://metexam.co.uk';
      console.log('Retry with baseUrl:', baseUrl);
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        console.error('Organization not found after fallback');
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
    }

    const body = await request.json();
    console.log('DELETE /api/products body:', body);
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    const { data: product, error: fetchError } = await supabase
      .from('product')
      .select('stripe_product_id')
      .eq('id', productId)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !product) {
      console.error('Error fetching product for deletion:', fetchError?.message, 'productId:', productId, 'organizationId:', organizationId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.stripe_product_id) {
      try {
        await stripe.products.del(product.stripe_product_id);
        console.log('Deleted Stripe product:', product.stripe_product_id);
      } catch (error: any) {
        if (error.statusCode !== 404) {
          console.error('Error deleting Stripe product:', error.message);
          throw error;
        }
        console.warn('Stripe product not found, proceeding with deletion:', product.stripe_product_id);
      }
    }

    const { error: deleteError } = await supabase
      .from('product')
      .delete()
      .eq('id', productId)
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('Error deleting product:', deleteError.message, 'productId:', productId, 'organizationId:', organizationId);
      return NextResponse.json({ error: `Failed to delete product: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: `Deleted product ${productId}` });
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/products:', error.message, error.stack);
    return NextResponse.json({ error: `Failed to delete product: ${error.message}` }, { status: 500 });
  }
}
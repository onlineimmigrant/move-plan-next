// /app/api/products/route.ts
import { NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';
import { supabase } from '@/lib/supabaseClient';
import { stripe } from '@/lib/stripe-supabase';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

/**
 * Flatten metadata for Stripe
 * Stripe requires all metadata values to be strings
 * Nested objects (like unsplash_attribution) must be stringified
 */
function flattenMetadata(attrs: any): Record<string, string> | undefined {
  if (!attrs || typeof attrs !== 'object') {
    return undefined;
  }

  const flattened: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined) {
      continue;
    }
    
    // If value is an object or array, stringify it
    if (typeof value === 'object') {
      flattened[key] = JSON.stringify(value);
    } else {
      // Convert to string
      flattened[key] = String(value);
    }
  }

  return Object.keys(flattened).length > 0 ? flattened : undefined;
}

export async function POST(request: Request) {
  try {
    // Use environment variable with a single fallback for local dev
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('POST /api/products baseUrl:', baseUrl);

    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('POST /api/products body:', body);
    const { 
      product_name, 
      is_displayed = true, 
      product_description, 
      product_tax_code, 
      links_to_image, 
      attrs,
      // Media
      links_to_video,
      // Book/Author
      author,
      author_2,
      isbn,
      // SEO & Identifiers
      slug,
      sku,
      metadescription_for_page,
      // Display
      background_color,
      order,
      // External Links
      amazon_books_url,
      compare_link_url,
      // Additional
      details,
    } = body;

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
        // Media
        links_to_video,
        // Book/Author
        author,
        author_2,
        isbn,
        // SEO & Identifiers
        slug,
        sku,
        metadescription_for_page,
        // Display
        background_color,
        order,
        // External Links
        amazon_books_url,
        compare_link_url,
        // Additional
        details,
        // System
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
      metadata: flattenMetadata(attrs),
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

export async function PUT(request: Request) {
  try {
    // Use environment variable with a single fallback for local dev
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('PUT /api/products baseUrl:', baseUrl);

    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
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
      .select('id, product_name, is_displayed, product_description, product_tax_code, links_to_image, attrs, stripe_product_id, organization_id, links_to_video, author, author_2, isbn, slug, sku, metadescription_for_page, background_color, order, amazon_books_url, compare_link_url, details')
      .eq('id', productIdStr)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !product) {
      console.error('Error fetching product:', fetchError?.message, 'productId:', productIdStr, 'organizationId:', organizationId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('Fetched product:', product);
    console.log('Type of fetched product.id:', typeof product.id, 'Value:', product.id);

    console.log('Updates object:', updates);
    const product_name = updates.product_name;
    const is_displayed = updates.is_displayed;
    const product_description = updates.product_description;
    const product_tax_code = updates.product_tax_code;
    const links_to_image = updates.links_to_image;
    const attrs = updates.attrs;
    // Media
    const links_to_video = updates.links_to_video;
    // Book/Author
    const author = updates.author;
    const author_2 = updates.author_2;
    const isbn = updates.isbn;
    // SEO & Identifiers
    const slug = updates.slug;
    const sku = updates.sku;
    const metadescription_for_page = updates.metadescription_for_page;
    // Display
    const background_color = updates.background_color;
    const order = updates.order;
    // External Links
    const amazon_books_url = updates.amazon_books_url;
    const compare_link_url = updates.compare_link_url;
    // Additional
    const details = updates.details;

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
      // Media
      links_to_video: links_to_video !== undefined ? links_to_video : product.links_to_video,
      // Book/Author
      author: author !== undefined ? author : product.author,
      author_2: author_2 !== undefined ? author_2 : product.author_2,
      isbn: isbn !== undefined ? isbn : product.isbn,
      // SEO & Identifiers
      slug: slug !== undefined ? slug : product.slug,
      sku: sku !== undefined ? sku : product.sku,
      metadescription_for_page: metadescription_for_page !== undefined ? metadescription_for_page : product.metadescription_for_page,
      // Display
      background_color: background_color !== undefined ? background_color : product.background_color,
      order: order !== undefined ? order : product.order,
      // External Links
      amazon_books_url: amazon_books_url !== undefined ? amazon_books_url : product.amazon_books_url,
      compare_link_url: compare_link_url !== undefined ? compare_link_url : product.compare_link_url,
      // Additional
      details: details !== undefined ? details : product.details,
      // System
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
        metadata: flattenMetadata(updatedProduct[0].attrs),
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
      metadata: flattenMetadata(updatedProduct[0].attrs),
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
    // Use environment variable with a single fallback for local dev
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('DELETE /api/products baseUrl:', baseUrl);

    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('DELETE /api/products body:', body);
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    // Fetch product with its pricing plans to get all Stripe price IDs
    const { data: product, error: fetchError } = await supabase
      .from('product')
      .select('stripe_product_id, pricing_plan(stripe_price_id)')
      .eq('id', productId)
      .eq('organization_id', organizationId)
      .single();

    if (fetchError || !product) {
      console.error('Error fetching product for deletion:', fetchError?.message, 'productId:', productId, 'organizationId:', organizationId);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete all Stripe prices first (Stripe requires this before deleting the product)
    if (product.pricing_plan && Array.isArray(product.pricing_plan)) {
      for (const plan of product.pricing_plan) {
        if (plan.stripe_price_id) {
          try {
            // Archive the price instead of deleting (Stripe best practice)
            await stripe.prices.update(plan.stripe_price_id, { active: false });
            console.log('Archived Stripe price:', plan.stripe_price_id);
          } catch (error: any) {
            if (error.statusCode !== 404) {
              console.error('Error archiving Stripe price:', plan.stripe_price_id, error.message);
              // Continue with other prices even if one fails
            }
          }
        }
      }
    }

    // Now delete or archive the Stripe product
    if (product.stripe_product_id) {
      try {
        // Archive the product instead of deleting to maintain Stripe history
        await stripe.products.update(product.stripe_product_id, { active: false });
        console.log('Archived Stripe product:', product.stripe_product_id);
      } catch (error: any) {
        if (error.statusCode !== 404) {
          console.error('Error archiving Stripe product:', error.message);
          // If archiving fails, try deleting
          try {
            await stripe.products.del(product.stripe_product_id);
            console.log('Deleted Stripe product:', product.stripe_product_id);
          } catch (delError: any) {
            if (delError.statusCode !== 404) {
              console.error('Error deleting Stripe product:', delError.message);
              return NextResponse.json({ 
                error: `Failed to remove product from Stripe: ${delError.message}. Please archive it manually in Stripe dashboard.` 
              }, { status: 500 });
            }
          }
        }
        console.warn('Stripe product not found, proceeding with deletion:', product.stripe_product_id);
      }
    }

    // Delete pricing plans first (they will be cascaded, but explicit deletion ensures clean RLS)
    const { error: plansDeleteError } = await supabase
      .from('pricing_plan')
      .delete()
      .eq('product_id', productId);

    if (plansDeleteError) {
      console.error('Error deleting pricing plans:', plansDeleteError.message, 'productId:', productId);
      // Continue anyway as CASCADE should handle this
    }

    // Finally delete the product from database
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
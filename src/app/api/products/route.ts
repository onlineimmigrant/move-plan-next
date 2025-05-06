import { NextResponse } from 'next/server';
import { supabase, stripe } from '@/lib/stripe-supabase';

// Validate image URL (ensure it's a valid URL starting with http:// or https://)
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
    const body = await request.json();
    const { product_name, is_displayed = true, product_description, product_tax_code, links_to_image, attrs } = body;

    if (!product_name) {
      return NextResponse.json({ error: 'Missing required field: product_name' }, { status: 400 });
    }

    // Insert the product into Supabase
    const { data: product, error: insertError } = await supabase
      .from('product')
      .insert({
        product_name,
        is_displayed,
        product_description,
        product_tax_code,
        links_to_image, // Store as a single string in Supabase
        attrs,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !product) {
      return NextResponse.json({ error: `Failed to create product: ${insertError?.message}` }, { status: 500 });
    }

    // Validate the image URL
    const validatedImageUrl = validateImageUrl(links_to_image);
    if (links_to_image && !validatedImageUrl) {
      console.warn(`Invalid or unsupported image URL provided: ${links_to_image}. Proceeding without image.`);
    }

    // Create the product in Stripe, excluding images if invalid or absent
    const createParams: any = {
      name: product_name,
      active: is_displayed,
      tax_code: product_tax_code, // Map product_tax_code to Stripe's tax_code
      description: product_description || undefined,
      metadata: attrs || undefined,
    };

    // Only include images if the URL is valid
    if (validatedImageUrl) {
      createParams.images = [validatedImageUrl];
    }

    const stripeProduct = await stripe.products.create(createParams);

    // Update the product with the stripe_product_id
    const { error: updateError } = await supabase
      .from('product')
      .update({ stripe_product_id: stripeProduct.id, updated_at: new Date().toISOString() })
      .eq('id', product.id);

    if (updateError) {
      return NextResponse.json({ error: `Failed to update product with stripe_product_id: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: `Created product ${product.id} and Stripe product ${stripeProduct.id}` });
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to create product: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { productId, updates } = body;

    if (!productId || !updates) {
      return NextResponse.json({ error: 'Missing productId or updates' }, { status: 400 });
    }

    const { product_name, is_displayed, product_description, product_tax_code, links_to_image, attrs } = updates;

    // Fetch the existing product
    const { data: product, error: fetchError } = await supabase
      .from('product')
      .select('id, product_name, is_displayed, product_description, product_tax_code, links_to_image, attrs, stripe_product_id')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Update the product in Supabase
    const updateData = {
      product_name: product_name || product.product_name,
      is_displayed: is_displayed !== undefined ? is_displayed : product.is_displayed,
      product_description: product_description !== undefined ? product_description : product.product_description,
      product_tax_code: product_tax_code !== undefined ? product_tax_code : product.product_tax_code,
      links_to_image: links_to_image !== undefined ? links_to_image : product.links_to_image, // Store as a single string
      attrs: attrs !== undefined ? attrs : product.attrs,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedProduct, error: updateError } = await supabase
      .from('product')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (updateError || !updatedProduct) {
      return NextResponse.json({ error: `Failed to update product: ${updateError?.message}` }, { status: 500 });
    }

    // Validate the image URL
    const validatedImageUrl = validateImageUrl(updatedProduct.links_to_image);
    if (updatedProduct.links_to_image && !validatedImageUrl) {
      console.warn(`Invalid or unsupported image URL provided: ${updatedProduct.links_to_image}. Proceeding without image.`);
    }

    // Sync to Stripe
    if (!product.stripe_product_id) {
      const createParams: any = {
        name: updatedProduct.product_name,
        active: updatedProduct.is_displayed,
        description: updatedProduct.product_description || undefined,
        tax_code: updatedProduct.product_tax_code, // Map product_tax_code to Stripe's tax_code
        metadata: updatedProduct.attrs || undefined,
      };

      if (validatedImageUrl) {
        createParams.images = [validatedImageUrl];
      }

      const stripeProduct = await stripe.products.create(createParams);

      const { error: stripeUpdateError } = await supabase
        .from('product')
        .update({ stripe_product_id: stripeProduct.id, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (stripeUpdateError) {
        return NextResponse.json({ error: `Failed to update stripe_product_id: ${stripeUpdateError.message}` }, { status: 500 });
      }

      return NextResponse.json({ message: `Created Stripe product ${stripeProduct.id} for product ${productId}` });
    }

    const updateParams: any = {
      name: updatedProduct.product_name,
      active: updatedProduct.is_displayed,
      description: updatedProduct.product_description || undefined,
      tax_code: updatedProduct.product_tax_code, // Map product_tax_code to Stripe's tax_code
      metadata: updatedProduct.attrs || undefined,
    };

    if (validatedImageUrl) {
      updateParams.images = [validatedImageUrl];
    }

    await stripe.products.update(product.stripe_product_id, updateParams);

    return NextResponse.json({ message: `Updated product ${productId} and Stripe product ${product.stripe_product_id}` });
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to update product: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    const { data: product, error: fetchError } = await supabase
      .from('product')
      .select('stripe_product_id')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.stripe_product_id) {
      try {
        await stripe.products.del(product.stripe_product_id);
      } catch (error: any) {
        if (error.statusCode !== 404) throw error;
      }
    }

    const { error: deleteError } = await supabase
      .from('product')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      return NextResponse.json({ error: `Failed to delete product: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: `Deleted product ${productId}` });
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to delete product: ${error.message}` }, { status: 500 });
  }
}
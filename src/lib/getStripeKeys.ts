/**
 * Stripe Keys Management
 * 
 * Fetches organization-specific Stripe keys from database
 * Falls back to environment variables if not found in database
 * 
 * Usage:
 *   const { secretKey, publishableKey, webhookSecret } = await getOrganizationStripeKeys(organizationId);
 *   const stripe = new Stripe(secretKey);
 */

import { supabase } from './supabaseClient';

export interface StripeKeys {
  secretKey: string | null;
  publishableKey: string | null;
  webhookSecret: string | null;
}

/**
 * Get Stripe keys for a specific organization
 * @param organizationId - The organization ID
 * @returns Stripe keys (secret, publishable, webhook)
 */
export async function getOrganizationStripeKeys(organizationId: string): Promise<StripeKeys> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('stripe_secret_key, stripe_publishable_key, stripe_webhook_secret')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching organization Stripe keys:', error);
      // Fall back to environment variables
      return {
        secretKey: process.env.STRIPE_SECRET_KEY || null,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
      };
    }

    // Use organization keys if available, otherwise fall back to env vars
    return {
      secretKey: data?.stripe_secret_key || process.env.STRIPE_SECRET_KEY || null,
      publishableKey: data?.stripe_publishable_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
      webhookSecret: data?.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET || null,
    };
  } catch (err) {
    console.error('Failed to fetch Stripe keys:', err);
    // Fall back to environment variables on error
    return {
      secretKey: process.env.STRIPE_SECRET_KEY || null,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
    };
  }
}

/**
 * Get Stripe secret key for an organization
 * @param organizationId - The organization ID
 * @returns Secret key
 */
export async function getStripeSecretKey(organizationId: string): Promise<string> {
  const keys = await getOrganizationStripeKeys(organizationId);
  if (!keys.secretKey) {
    throw new Error('Stripe secret key not configured for this organization');
  }
  return keys.secretKey;
}

/**
 * Get Stripe publishable key for an organization
 * @param organizationId - The organization ID
 * @returns Publishable key
 */
export async function getStripePublishableKey(organizationId: string): Promise<string> {
  const keys = await getOrganizationStripeKeys(organizationId);
  if (!keys.publishableKey) {
    throw new Error('Stripe publishable key not configured for this organization');
  }
  return keys.publishableKey;
}

/**
 * Get Stripe webhook secret for an organization
 * @param organizationId - The organization ID
 * @returns Webhook secret
 */
export async function getStripeWebhookSecret(organizationId: string): Promise<string> {
  const keys = await getOrganizationStripeKeys(organizationId);
  if (!keys.webhookSecret) {
    throw new Error('Stripe webhook secret not configured for this organization');
  }
  return keys.webhookSecret;
}

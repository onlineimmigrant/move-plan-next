/**
 * Stripe Instance Factory
 * 
 * Creates Stripe instances with organization-specific keys
 * Falls back to environment variables if organization keys not found
 */

import Stripe from 'stripe';
import { getStripeSecretKey } from './getStripeKeys';

/**
 * Create a Stripe instance for a specific organization
 * @param organizationId - The organization ID
 * @returns Configured Stripe instance
 */
export async function createStripeInstance(organizationId: string): Promise<Stripe> {
  const secretKey = await getStripeSecretKey(organizationId);
  
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
}

/**
 * Get Stripe instance (legacy - uses env var)
 * @deprecated Use createStripeInstance(organizationId) instead
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

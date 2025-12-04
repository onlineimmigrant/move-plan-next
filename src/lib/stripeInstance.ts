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
let legacyStripeInstance: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    if (!legacyStripeInstance) {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY not configured. Use createStripeInstance(organizationId) instead.');
      }
      legacyStripeInstance = new Stripe(secretKey, {
        apiVersion: '2025-08-27.basil',
      });
    }
    const value = (legacyStripeInstance as any)[prop];
    return typeof value === 'function' ? value.bind(legacyStripeInstance) : value;
  }
});

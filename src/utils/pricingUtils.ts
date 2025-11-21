/**
 * Pricing utility functions for product pricing calculations and conversions
 */

import { PricingComparisonProduct } from '@/types/product';

/**
 * Convert product name to URL-safe identifier
 * Examples: "Premium Plan" -> "premium_plan", "Basic 123" -> "basic_123"
 */
export function productNameToIdentifier(productName: string): string {
  return productName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Generate product-specific pricing URL
 */
export function generateProductPricingUrl(
  product: PricingComparisonProduct,
  baseUrl?: string
): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  const productIdentifier = product.product_name
    ? productNameToIdentifier(product.product_name)
    : product.id.toString();
  return `${base}#pricing#${productIdentifier}`;
}

/**
 * Generate basic pricing URL
 */
export function generateBasicPricingUrl(baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  return `${base}#pricing`;
}

/**
 * Currency symbol mappings
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  PLN: 'zł',
  RUB: '₽',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
};

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] || '$';
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currencyCode: string, decimals: number = 2): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${price.toFixed(decimals)}`;
}

/**
 * Calculate promotional price from base price and discount
 */
export function calculatePromotionPrice(
  basePrice: number,
  promotionPercent?: number,
  promotionPrice?: number
): number | undefined {
  if (promotionPercent !== undefined) {
    return parseFloat((basePrice * (1 - promotionPercent / 100)).toFixed(2));
  }
  if (promotionPrice !== undefined) {
    return promotionPrice;
  }
  return undefined;
}

/**
 * Calculate annual price with discount
 */
export function calculateAnnualPrice(
  monthlyPrice: number,
  annualSizeDiscount: number
): number {
  const discountMultiplier = (100 - annualSizeDiscount) / 100;
  return parseFloat((monthlyPrice * discountMultiplier).toFixed(2));
}

/**
 * Calculate total annual cost
 */
export function calculateAnnualTotal(
  monthlyPrice: number,
  recurringCount: number = 12
): number {
  return parseFloat((monthlyPrice * recurringCount).toFixed(2));
}

/**
 * Parse product identifier from URL hash
 * Supports formats: #pricing#product_name, #pricing#product_id, or just #pricing
 */
export function parseProductFromHash(): string | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash;
  const hashParts = hash.split('#').filter(Boolean);

  if (hashParts.length >= 2 && hashParts[0] === 'pricing') {
    return hashParts[1];
  }

  return null;
}

/**
 * Update URL hash for pricing modal
 */
export function updatePricingHash(product?: PricingComparisonProduct | null): void {
  if (typeof window === 'undefined') return;

  const baseHash = '#pricing';
  let newHash = baseHash;

  if (product) {
    const productIdentifier = product.product_name
      ? productNameToIdentifier(product.product_name)
      : product.id.toString();
    newHash = `${baseHash}#${productIdentifier}`;
  }

  if (window.location.hash !== newHash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
  }
}

/**
 * Remove pricing hash from URL
 */
export function removePricingHash(): void {
  if (typeof window === 'undefined') return;

  const hash = window.location.hash;
  const hashParts = hash.split('#').filter(Boolean);

  if (hashParts.length > 0 && hashParts[0] === 'pricing') {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

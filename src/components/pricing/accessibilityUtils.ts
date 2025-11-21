/**
 * Accessibility utilities for PricingModal
 */

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', politeness);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Get accessible label for pricing plan
 */
export function getPricingPlanLabel(
  name: string,
  price: number,
  currencySymbol: string,
  isAnnual: boolean,
  isPromotion?: boolean
): string {
  const period = isAnnual ? 'per year' : 'per month';
  const promotionText = isPromotion ? ', promotional price' : '';
  
  return `${name} plan, ${currencySymbol}${price} ${period}${promotionText}`;
}

/**
 * Get accessible description for discount badge
 */
export function getDiscountBadgeLabel(discountPercent: number): string {
  return `Save ${discountPercent} percent with annual billing`;
}

/**
 * ARIA attributes for modal dialog
 */
export const MODAL_ARIA_ATTRS = {
  role: 'dialog',
  'aria-modal': 'true',
  'aria-labelledby': 'pricing-modal-title',
  'aria-describedby': 'pricing-modal-description',
} as const;

/**
 * Get ARIA label for toggle button
 */
export function getToggleLabel(isAnnual: boolean): string {
  return isAnnual 
    ? 'Switch to monthly billing' 
    : 'Switch to annual billing and save';
}

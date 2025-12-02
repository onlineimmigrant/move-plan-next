/**
 * Simple conversion analytics tracker
 * Tracks key funnel events: view basket, start checkout, complete payment
 */

type FunnelEvent = 
  | 'basket_viewed'
  | 'basket_item_added'
  | 'basket_item_removed'
  | 'checkout_started'
  | 'payment_info_entered'
  | 'payment_completed'
  | 'payment_failed';

interface EventMetadata {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private isDevelopment = process.env.NODE_ENV === 'development';

  track(event: FunnelEvent, metadata?: EventMetadata) {
    if (this.isDevelopment) {
      console.log(`[Analytics] ${event}`, metadata || '');
    }

    // Future: Send to analytics service
    // gtag('event', event, metadata);
    // plausible(event, { props: metadata });
    
    // For now, use dataLayer if available (Google Tag Manager)
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event,
        ...metadata,
      });
    }
  }
}

export const analytics = new Analytics();

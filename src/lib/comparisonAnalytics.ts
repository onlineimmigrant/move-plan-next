/**
 * Comparison analytics tracking utility
 */

export interface ComparisonAnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

class ComparisonAnalytics {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production' || 
                     process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
  }

  trackComparisonView(data: {
    sectionId: string;
    organizationId: string;
    competitorCount: number;
    featureCount: number;
    mode: string;
  }) {
    this.track('comparison_viewed', data);
  }

  trackFeatureSearch(data: {
    sectionId: string;
    query: string;
    resultsCount: number;
  }) {
    this.track('feature_searched', data);
  }

  trackDifferencesToggle(data: {
    sectionId: string;
    enabled: boolean;
    remainingFeatures: number;
  }) {
    this.track('differences_toggled', data);
  }

  trackPDFExport(data: {
    sectionId: string;
    competitorCount: number;
    featureCount: number;
  }) {
    this.track('pdf_exported', data);
  }

  trackPricingToggle(data: {
    sectionId: string;
    interval: 'monthly' | 'yearly';
  }) {
    this.track('pricing_toggled', data);
  }

  trackCompetitorClick(data: {
    sectionId: string;
    competitorId: string;
    competitorName: string;
  }) {
    this.track('competitor_clicked', data);
  }

  private track(event: string, properties: Record<string, any> = {}) {
    if (!this.isEnabled) {
      console.log('[Analytics]', event, properties);
      return;
    }

    const eventData = {
      ...properties,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event, eventData);
    } else if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event, eventData);
    } else {
      this.sendToEndpoint(event, eventData);
    }
  }

  private async sendToEndpoint(event: string, properties: Record<string, any>) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, properties }),
      });
    } catch (error) {
      console.error('Analytics failed:', error);
    }
  }
}

export const comparisonAnalytics = new ComparisonAnalytics();

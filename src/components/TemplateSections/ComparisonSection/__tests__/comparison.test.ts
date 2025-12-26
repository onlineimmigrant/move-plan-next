import { describe, it, expect, beforeEach } from '@jest/globals';
import { formatMoney, getCurrencySymbol } from '../utils/formatting';
import { makeCompetitorFeatureKey } from '@/lib/comparison/indexes';
import { calculateCompetitorScore } from '@/lib/comparison/scoring';

/**
 * Unit tests for ComparisonSection utility functions
 */

describe('ComparisonSection Utils', () => {
  describe('formatMoney', () => {
    it('should format positive numbers correctly', () => {
      expect(formatMoney(1000)).toBe('1,000');
      expect(formatMoney(1234.56)).toBe('1,234.56');
      expect(formatMoney(99.99)).toBe('99.99');
    });

    it('should handle zero', () => {
      expect(formatMoney(0)).toBe('0');
    });

    it('should handle negative numbers', () => {
      expect(formatMoney(-1000)).toBe('-1,000');
    });

    it('should handle very large numbers', () => {
      expect(formatMoney(1000000)).toBe('1,000,000');
    });

    it('should handle decimal precision', () => {
      expect(formatMoney(1234.5)).toBe('1,234.50');
      expect(formatMoney(1234.123)).toBe('1,234.12');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbols for common currencies', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
      expect(getCurrencySymbol('JPY')).toBe('¥');
    });

    it('should return currency code for unknown currencies', () => {
      expect(getCurrencySymbol('XYZ')).toBe('XYZ');
    });

    it('should handle lowercase input', () => {
      expect(getCurrencySymbol('usd')).toBe('$');
    });

    it('should handle null/undefined', () => {
      expect(getCurrencySymbol(null as any)).toBe('');
      expect(getCurrencySymbol(undefined as any)).toBe('');
    });
  });

  describe('makeCompetitorFeatureKey', () => {
    it('should create consistent keys', () => {
      const key1 = makeCompetitorFeatureKey('plan-123', 'feature-456');
      const key2 = makeCompetitorFeatureKey('plan-123', 'feature-456');
      expect(key1).toBe(key2);
    });

    it('should create unique keys for different inputs', () => {
      const key1 = makeCompetitorFeatureKey('plan-123', 'feature-456');
      const key2 = makeCompetitorFeatureKey('plan-456', 'feature-123');
      expect(key1).not.toBe(key2);
    });

    it('should handle special characters', () => {
      const key = makeCompetitorFeatureKey('plan-$#@', 'feature-!%^');
      expect(key).toBeTruthy();
      expect(typeof key).toBe('string');
    });
  });

  describe('calculateCompetitorScore', () => {
    it('should calculate score correctly with all features included', () => {
      const result = calculateCompetitorScore(
        {
          includedFeatures: 10,
          partialFeatures: 0,
          paidFeatures: 0,
          customFeatures: 0,
          totalFeatures: 10,
          competitorPrice: 100,
          ourPrice: 100,
          pricingTransparency: 100,
        },
        {
          featureCoverage: 40,
          priceCompetitiveness: 30,
          valueRatio: 20,
          transparency: 10,
        }
      );

      expect(result.overall).toBe(100);
      expect(result.breakdown.featureCoverage).toBe(100);
      expect(result.breakdown.priceCompetitiveness).toBe(75);
    });

    it('should penalize missing features', () => {
      const result = calculateCompetitorScore(
        {
          includedFeatures: 5,
          partialFeatures: 0,
          paidFeatures: 0,
          customFeatures: 0,
          totalFeatures: 10,
          competitorPrice: 100,
          ourPrice: 100,
          pricingTransparency: 100,
        },
        {
          featureCoverage: 40,
          priceCompetitiveness: 30,
          valueRatio: 20,
          transparency: 10,
        }
      );

      expect(result.breakdown.featureCoverage).toBe(50);
      expect(result.overall).toBeLessThan(100);
    });

    it('should handle partial features', () => {
      const result = calculateCompetitorScore(
        {
          includedFeatures: 5,
          partialFeatures: 5,
          paidFeatures: 0,
          customFeatures: 0,
          totalFeatures: 10,
          competitorPrice: 100,
          ourPrice: 100,
          pricingTransparency: 100,
        },
        {
          featureCoverage: 40,
          priceCompetitiveness: 30,
          valueRatio: 20,
          transparency: 10,
        }
      );

      expect(result.breakdown.featureCoverage).toBeGreaterThan(50);
      expect(result.breakdown.featureCoverage).toBeLessThan(100);
    });

    it('should calculate price comparison correctly', () => {
      const cheaperResult = calculateCompetitorScore(
        {
          includedFeatures: 10,
          partialFeatures: 0,
          paidFeatures: 0,
          customFeatures: 0,
          totalFeatures: 10,
          competitorPrice: 50,
          ourPrice: 100,
          pricingTransparency: 100,
        },
        {
          featureCoverage: 40,
          priceCompetitiveness: 30,
          valueRatio: 20,
          transparency: 10,
        }
      );

      expect(cheaperResult.breakdown.priceCompetitiveness).toBeGreaterThan(50);

      const expensiveResult = calculateCompetitorScore(
        {
          includedFeatures: 10,
          partialFeatures: 0,
          paidFeatures: 0,
          customFeatures: 0,
          totalFeatures: 10,
          competitorPrice: 200,
          ourPrice: 100,
          pricingTransparency: 100,
        },
        {
          featureCoverage: 40,
          priceCompetitiveness: 30,
          valueRatio: 20,
          transparency: 10,
        }
      );

      expect(expensiveResult.breakdown.priceCompetitiveness).toBeLessThan(50);
    });

    it('should handle zero prices', () => {
      const result = calculateCompetitorScore(
        {
          includedFeatures: 10,
          partialFeatures: 0,
          paidFeatures: 0,
          customFeatures: 0,
          totalFeatures: 10,
          competitorPrice: 0,
          ourPrice: 100,
          pricingTransparency: 100,
        },
        {
          featureCoverage: 40,
          priceCompetitiveness: 30,
          valueRatio: 20,
          transparency: 10,
        }
      );

      expect(result.breakdown.priceCompetitiveness).toBeDefined();
      expect(result.overall).toBeDefined();
    });
  });
});

describe('ComparisonSection Hooks', () => {
  // Integration tests would go here
  // These require a testing library like @testing-library/react-hooks
  
  describe('useComparisonData', () => {
    it('should be tested with integration tests', () => {
      // TODO: Add integration tests with @testing-library/react-hooks
      expect(true).toBe(true);
    });
  });

  describe('useComparisonFilters', () => {
    it('should be tested with integration tests', () => {
      // TODO: Add integration tests
      expect(true).toBe(true);
    });
  });
});

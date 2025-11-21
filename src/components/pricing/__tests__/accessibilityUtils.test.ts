import {
  announceToScreenReader,
  getPricingPlanLabel,
  getToggleLabel,
  MODAL_ARIA_ATTRS,
} from '../accessibilityUtils';

describe('accessibilityUtils', () => {
  describe('announceToScreenReader', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    afterEach(() => {
      // Clean up announcer elements
      const announcers = document.querySelectorAll('[aria-live]');
      announcers.forEach(el => el.remove());
    });

    it('should create announcer element if not exists', () => {
      announceToScreenReader('Test message');
      
      const announcer = document.getElementById('sr-announcer');
      expect(announcer).toBeTruthy();
      expect(announcer?.getAttribute('aria-live')).toBe('polite');
      expect(announcer?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should announce message to screen reader', () => {
      announceToScreenReader('Test announcement');
      
      const announcer = document.getElementById('sr-announcer');
      expect(announcer?.textContent).toBe('Test announcement');
    });

    it('should reuse existing announcer element', () => {
      announceToScreenReader('First message');
      announceToScreenReader('Second message');
      
      const announcers = document.querySelectorAll('#sr-announcer');
      expect(announcers).toHaveLength(1);
      expect(announcers[0]?.textContent).toBe('Second message');
    });
  });

  describe('getPricingPlanLabel', () => {
    it('should format monthly plan label correctly', () => {
      const label = getPricingPlanLabel('Basic Plan', 10, '$', false);
      expect(label).toBe('Basic Plan - $10 per month');
    });

    it('should format annual plan label correctly', () => {
      const label = getPricingPlanLabel('Pro Plan', 8, '$', true);
      expect(label).toBe('Pro Plan - $8 per month, billed annually');
    });

    it('should handle different currencies', () => {
      const label = getPricingPlanLabel('Premium', 15, '€', false);
      expect(label).toBe('Premium - €15 per month');
    });
  });

  describe('getToggleLabel', () => {
    it('should return correct label for annual billing', () => {
      const label = getToggleLabel(true);
      expect(label).toBe('Annual billing selected');
    });

    it('should return correct label for monthly billing', () => {
      const label = getToggleLabel(false);
      expect(label).toBe('Monthly billing selected');
    });
  });

  describe('MODAL_ARIA_ATTRS', () => {
    it('should have correct ARIA attributes', () => {
      expect(MODAL_ARIA_ATTRS).toEqual({
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'pricing-modal-title',
        'aria-describedby': 'pricing-modal-description',
      });
    });
  });
});

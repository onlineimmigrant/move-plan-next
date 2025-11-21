import {
  ANIMATION_TIMING,
  ANIMATION_CLASSES,
  getCardAnimationDelay,
} from '../animations';

describe('animations', () => {
  describe('ANIMATION_TIMING', () => {
    it('should have correct timing constants', () => {
      expect(ANIMATION_TIMING.modalEntry).toBe('duration-300');
      expect(ANIMATION_TIMING.cardEntry).toBe('duration-500');
      expect(ANIMATION_TIMING.toggleSwitch).toBe('duration-300');
    });
  });

  describe('ANIMATION_CLASSES', () => {
    it('should have correct animation classes', () => {
      expect(ANIMATION_CLASSES.cardFadeIn).toBe('animate-in fade-in slide-in-from-bottom-4');
      expect(ANIMATION_CLASSES.modalFadeIn).toBe('animate-in fade-in');
    });
  });

  describe('getCardAnimationDelay', () => {
    it('should return correct delay for first card', () => {
      const delay = getCardAnimationDelay(0);
      expect(delay).toBe('delay-75');
    });

    it('should return correct delay for second card', () => {
      const delay = getCardAnimationDelay(1);
      expect(delay).toBe('delay-150');
    });

    it('should return correct delay for third card', () => {
      const delay = getCardAnimationDelay(2);
      expect(delay).toBe('delay-300');
    });

    it('should increment delays by 75ms', () => {
      expect(getCardAnimationDelay(0)).toBe('delay-75');
      expect(getCardAnimationDelay(1)).toBe('delay-150');
      expect(getCardAnimationDelay(2)).toBe('delay-300');
      expect(getCardAnimationDelay(3)).toBe('delay-500');
    });

    it('should handle negative indices', () => {
      const delay = getCardAnimationDelay(-1);
      expect(delay).toBe('delay-75'); // Math.max ensures minimum 75ms
    });
  });
});

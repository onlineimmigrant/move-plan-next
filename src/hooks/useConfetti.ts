import { useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';

export const useConfetti = () => {
  const prefersReducedMotion = useReducedMotion();

  const fireConfetti = useCallback(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) return;

    // Dynamic import to avoid SSR issues
    import('canvas-confetti').then((confetti) => {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 10000,
      };

      function fire(particleRatio: number, opts: any) {
        confetti.default({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      // Celebration burst
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    });
  }, [prefersReducedMotion]);

  return { fireConfetti };
};

/**
 * Animation keyframes and timing constants for pricing modal
 */

export const ANIMATION_TIMING = {
  cardEntry: 'duration-500',
  cardEntryDelay: {
    first: 'delay-75',
    second: 'delay-150',
    third: 'delay-225',
  },
  modalEntry: 'duration-300',
  toggleSwitch: 'duration-300',
  hover: 'duration-200',
} as const;

export const ANIMATION_CLASSES = {
  // Card entry animations
  cardFadeIn: 'animate-in fade-in slide-in-from-bottom-4',
  cardScale: 'animate-in zoom-in-95',
  
  // Modal entry
  modalFadeIn: 'animate-in fade-in',
  modalSlideUp: 'animate-in slide-in-from-bottom-6',
  
  // Hover effects
  cardHover: 'transition-all hover:scale-[1.02] hover:-translate-y-1',
  buttonHover: 'transition-all hover:scale-105',
  
  // Loading skeleton
  pulse: 'animate-pulse',
} as const;

/**
 * Get staggered animation delay for card index
 */
export function getCardAnimationDelay(index: number): string {
  const delays = ['delay-75', 'delay-150', 'delay-225', 'delay-300', 'delay-[375ms]', 'delay-[450ms]'];
  return delays[index] || delays[delays.length - 1];
}

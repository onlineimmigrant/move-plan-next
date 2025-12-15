import { useState, useEffect, useRef } from 'react';

interface UseScrollBehaviorProps {
  headerType: string;
}

/**
 * Manages scroll-based header behavior
 * Handles visibility, scroll direction, and scrolled state
 */
export const useScrollBehavior = ({ headerType }: UseScrollBehaviorProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const scrollThreshold = windowHeight * 0.1;
          
          // Update isScrolled state
          setIsScrolled(currentScrollY > 50);

          // Calculate scroll direction
          const scrollingUp = currentScrollY < lastScrollYRef.current;
          setIsScrollingUp(scrollingUp);

          // Show/hide header based on scroll behavior
          if (headerType === 'default' || headerType === 'transparent') {
            // For default/transparent: show when scrolling up or at top
            if (scrollingUp || currentScrollY < scrollThreshold) {
              setIsVisible(true);
            } else if (currentScrollY > scrollThreshold) {
              setIsVisible(false);
            }
          } else {
            // For other types: always visible
            setIsVisible(true);
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [headerType]);

  return {
    isScrolled,
    isVisible,
    isScrollingUp,
  };
};

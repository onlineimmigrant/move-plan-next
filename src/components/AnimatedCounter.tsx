'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function AnimatedCounter({
  value,
  duration = 800,
  decimals = 2,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const [count, setCount] = useState(value);
  const prevValue = useRef(value);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prevValue.current === value) return;

    const startValue = prevValue.current;
    const endValue = value;
    const startTime = Date.now();
    const animationDuration = prefersReducedMotion ? 0 : duration;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / animationDuration, 1);
      
      // Easing function (ease-out-cubic) - skip if reduced motion
      const easeOut = prefersReducedMotion ? 1 : 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * easeOut;
      setCount(currentValue);

      if (progress < 1 && !prefersReducedMotion) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, prefersReducedMotion]);

  return (
    <span className={className} aria-live="polite" aria-atomic="true">
      {prefix}{count.toFixed(decimals)}{suffix}
    </span>
  );
}

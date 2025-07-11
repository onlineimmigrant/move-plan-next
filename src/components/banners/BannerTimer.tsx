// components/banners/BannerTimer.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // For animations

interface BannerTimerProps {
  endDate: string; // ISO date string for end_date_promotion
  textColor?: string; // Optional text color for timer text
  backgroundColor?: string; // Optional background color for timer units
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const BannerTimer = ({ endDate, textColor = 'text-white', backgroundColor = 'bg-sky-600' }: BannerTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const distance = end - now;

      if (isNaN(end) || distance < 0) {
        setIsExpired(true);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`text-center text-sm font-semibold ${textColor}`}
      >
        Sale Ended
      </motion.div>
    );
  }

  if (!timeRemaining) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex space-x-2 justify-center items-center text-xs font-bold  text-white`}
        aria-live="polite"
      >
        {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
          <motion.div
            key={unit}
            initial={{ scale: 1 }}
            animate={{ scale: timeRemaining[unit] !== timeRemaining[unit] ? [1, 1.1, 1] : 1 }} // Subtle pulse on number change
            transition={{ duration: 0.2 }}
            className={`px-2.5 py-1.5 bg-sky-500 rounded-md shadow-sm flex items-center justify-center min-w-[2.5rem]`}
          >
            <span className="text-sm font-bold">{timeRemaining[unit]}</span>
            <span className="ml-1 text-xs lowercase">{unit.charAt(0)}</span>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
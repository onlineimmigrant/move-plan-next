// components/banners/BannerTimer.tsx
import { useEffect, useState } from 'react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
      <div className={`text-center text-sm font-semibold ${textColor} transition-opacity duration-300`}>
        Sale Ended
      </div>
    );
  }

  if (!timeRemaining || !mounted) {
    return null;
  }

  return (
    <div
      className={`flex space-x-2 justify-center items-center text-xs font-bold text-white transition-all duration-300`}
      aria-live="polite"
    >
      {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
        <div
          key={unit}
          className={`px-2.5 py-1.5 bg-sky-500 rounded-md shadow-sm flex items-center justify-center min-w-[2.5rem] transition-transform duration-200 hover:scale-105`}
        >
          <span className="text-sm font-bold">{timeRemaining[unit]}</span>
          <span className="ml-1 text-xs lowercase">{unit.charAt(0)}</span>
        </div>
      ))}
    </div>
  );
};
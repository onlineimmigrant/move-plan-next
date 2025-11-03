// components/ChatHelpWidget/ChatHelpToggleButton.tsx
'use client';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ChatHelpToggleButtonProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

export default function ChatHelpToggleButton({ isOpen, toggleOpen }: ChatHelpToggleButtonProps) {
  const themeColors = useThemeColors();
  
  return (
    <button
      onClick={toggleOpen}
      className={`
        fixed z-[9998]
        flex items-center justify-center
        w-12 h-12 sm:w-14 sm:h-14
        bottom-4 right-6 sm:bottom-6 sm:right-8
        rounded-full
        transform hover:scale-110 active:scale-95
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-0
        group
        backdrop-blur-xl bg-white/50 dark:bg-gray-900/50
        shadow-lg hover:shadow-xl
        border-0
        ${isOpen ? 'rotate-45' : ''}
      `}
      aria-label={isOpen ? 'Close help center' : 'Open help center'}
    >
      <RocketLaunchIcon 
        className="h-6 w-6 text-gray-900 dark:text-white transform group-hover:translate-y-[-2px] transition-transform duration-200" 
      />
    </button>
  );
}

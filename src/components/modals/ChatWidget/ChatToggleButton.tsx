// components/ChatWidget/ChatToggleButton.tsx
'use client';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

interface ChatToggleButtonProps {
  isOpen: boolean;
  toggleOpen: () => void;
  isModalOpen?: boolean;
}

export default function ChatToggleButton({ isOpen, toggleOpen, isModalOpen = false }: ChatToggleButtonProps) {
  return (
    <button
      onClick={toggleOpen}
      className={`
        fixed ${isModalOpen ? 'z-[10000001]' : 'z-[9998]'}
        flex items-center justify-center
        w-12 h-12 sm:w-14 sm:h-14
        bottom-4 right-4 sm:bottom-6 sm:right-6
        bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800
        hover:from-gray-700 hover:via-gray-800 hover:to-gray-900
        text-white
        rounded-full
        shadow-xl hover:shadow-2xl
        transform hover:scale-110 active:scale-95
        transition-all duration-300 ease-out
        focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-opacity-50
        group
        ${isOpen ? 'rotate-45' : ''}
      `}
      style={{ position: 'fixed' }}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      <RocketLaunchIcon className="h-6 w-6 transform group-hover:translate-y-[-2px] transition-transform duration-200" />
    </button>
  );
}
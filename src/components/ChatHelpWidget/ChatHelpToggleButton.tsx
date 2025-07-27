// components/ChatHelpWidget/ChatHelpToggleButton.tsx
'use client';
import { RocketLaunchIcon } from '@heroicons/react/24/outline';

interface ChatHelpToggleButtonProps {
  isOpen: boolean;
  toggleOpen: () => void;
}

export default function ChatHelpToggleButton({ isOpen, toggleOpen }: ChatHelpToggleButtonProps) {
  return (
    <button
      onClick={toggleOpen}
      className="cursor-pointer fixed bottom-12 right-4 bg-sky-500 text-white p-4 rounded-full shadow-lg z-61 hover:bg-sky-600 transition-colors"
    >
      <RocketLaunchIcon className="h-6 w-6" />
    </button>
  );
}

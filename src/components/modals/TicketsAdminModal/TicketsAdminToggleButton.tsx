'use client';

import { useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import TicketsAdminModal from './TicketsAdminModal';

export default function TicketsAdminToggleButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center z-[9998] group"
        aria-label="Ticket Management"
      >
        <Cog6ToothIcon className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <TicketsAdminModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

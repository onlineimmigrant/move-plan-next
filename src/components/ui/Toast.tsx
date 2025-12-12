"use client";

import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  autoDismissMs?: number;
  className?: string;
}

export function Toast({ message, type = 'info', onClose, autoDismissMs = 3000, className }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onClose(), autoDismissMs);
    return () => clearTimeout(t);
  }, [message, autoDismissMs, onClose]);

  if (!message) return null;

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-800';

  return (
    <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg text-white shadow-lg ${bg} ${className || ''}`}>
      <div className="flex items-center gap-3">
        <span className="text-sm">{message}</span>
        <button className="text-white/80 hover:text-white" onClick={onClose}>✕</button>
      </div>
    </div>
  );
}

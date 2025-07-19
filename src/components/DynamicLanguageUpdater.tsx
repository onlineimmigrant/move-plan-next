'use client';

import { useLanguageUpdater } from '@/hooks/useLanguageUpdater';

export default function DynamicLanguageUpdater() {
  useLanguageUpdater();
  return null; // This component doesn't render anything, just handles the side effect
}

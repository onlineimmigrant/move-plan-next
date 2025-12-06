'use client';

import dynamic from 'next/dynamic';

// Lazy load FormRenderer to defer framer-motion
const FormRenderer = dynamic(() => import('./FormRenderer'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse bg-gray-200 h-96 w-full max-w-2xl rounded-lg" />
    </div>
  )
});

export default FormRenderer;

// /src/components/ClientErrorUI.tsx
'use client';

import { useRouter } from 'next/navigation';

interface ClientErrorUIProps {
  errorMessage: string;
}

export default function ClientErrorUI({ errorMessage }: ClientErrorUIProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600">Error: {errorMessage}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-full"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
'use client';
import { useRouter } from 'next/navigation';
import FilesModal from '@/components/modals/ChatWidget/FilesModal';
import { useAccountAuth } from '@/hooks/useAccountAuth';

export default function FilesPage() {
  const { userId } = useAccountAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-xai-dark to-gray-900 flex items-center justify-center p-4">
      <FilesModal
        isOpen={true}
        onClose={() => router.push('/account')}
        userId={userId}
      />
    </div>
  );
}

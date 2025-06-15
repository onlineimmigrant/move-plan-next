import { Suspense } from 'react';
import SuccessContent from '@/components/product/SuccessContent';

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading payment status...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
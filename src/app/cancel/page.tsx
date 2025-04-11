import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
        Payment Canceled
      </h1>
      <p className="text-gray-600 text-base mb-6">
        Your payment was canceled. You can try again or continue shopping.
      </p>
      <Link href="/products">
        <span className="text-sky-600 hover:text-sky-700 text-sm font-medium inline-block transition-colors duration-200">
          Continue Shopping
        </span>
      </Link>
    </div>
  );
}
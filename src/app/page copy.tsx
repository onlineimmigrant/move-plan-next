import Link from 'next/link';


export default function HomePage() {
  return (
    <div className="min-h-screen relative isolate px-6 lg:px-8 bg-white">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu 
                   overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem]
                     -translate-x-1/2 rotate-[30deg] 
                     bg-gradient-to-tr from-green-700 via-green-500 to-green-300 
                     opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, ' +
              '85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, ' +
              '52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, ' +
              '0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, ' +
              '74.1% 44.1%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl items-center py-24 grid grid-cols-1 gap-x-12 gap-y-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1
            className="text-5xl sm:text-7xl font-bold tracking-tight 
                       bg-gradient-to-r from-green-500 via-green-500 to-amber-300 
                       bg-clip-text text-transparent hover:text-gray-700 py-16"
          >
            Let Spring 
          </h1>
          <p className="mt-6 text-gray-700 text-lg sm:text-xl tracking-wide">
            Start Your Relocation Planning Today
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/checkout"
              className="rounded-full bg-gradient-to-r from-green-700 
                         via-green-500 to-amber-300 py-2 px-4 
                         text-sm font-medium text-white shadow-sm 
                         hover:opacity-80"
            >
              Get Started
            </Link>
            <Link
              href="/products"
              className="flex items-center text-sm font-semibold leading-6 
                         text-gray-900 hover:text-gray-600"
            >
              Explore
             
            </Link>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 top-[calc(100%-13rem)] 
                   -z-10 transform-gpu overflow-hidden blur-3xl 
                   sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] 
                     w-[36.125rem] -translate-x-1/2 
                     bg-gradient-to-tr from-green-700 via-green-500 to-amber-500
                     opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, ' +
              '85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, ' +
              '52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, ' +
              '0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, ' +
              '74.1% 44.1%)',
          }}
        />
      </div>
    </div>
  );
}
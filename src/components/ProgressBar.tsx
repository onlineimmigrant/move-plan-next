'use client';

interface ProgressBarProps {
  stage: number; // Current stage (1, 2, or 3)
}

export default function ProgressBar({ stage }: ProgressBarProps) {
  const stages = [
    { id: 1, label: 'Basket' },
    { id: 2, label: 'Checkout' },
    { id: 3, label: 'Payment' },
  ];

  return (
    <div className="pt-8 flex items-center justify-center py-2 bg-transparent border-gray-200">
      <div className="flex items-center space-x-2">
        {stages.map((s, index) => (
          <div key={s.id} className="flex items-center">
            {/* Circle + Label */}
            <div className="flex items-center space-x-2">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full text-sm sm:text-base font-medium transition-colors border-2
                  ${
                    s.id === stage
                      ? // Active stage: outlined sky
                        'bg-white border-sky-600 text-sky-600'
                      : s.id < stage
                      ? // Completed stage: filled sky
                        'bg-sky-600 text-white border-sky-600'
                      : // Future stage: outlined gray
                        'border-gray-300 text-gray-400'
                  }
                `}
              >
                {s.id}
              </div>
              <span
                className={`text-sm transition-colors ${
                  s.id === stage
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500'
                }`}
              >
                {s.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < stages.length - 1 && (
              <div
                className={`
                  h-0.5 w-6 sm:w-24 mx-2 transition-colors
                  ${s.id < stage ? 'bg-sky-600' : 'bg-gray-200'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

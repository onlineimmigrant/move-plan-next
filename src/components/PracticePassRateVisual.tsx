// components/PracticePassRateVisual.tsx
'use client';

interface PracticePassRateVisualProps {
  quiz: {
    id: number;
    title: string;
    description: string | null;
    slug: string | null;
    percent_required: number; // Assumed field for pass rate
  };
}

export default function PracticePassRateVisual({ quiz }: PracticePassRateVisualProps) {
  // Calculate the circumference of the circle (radius = 30)
  const circumference = 2 * Math.PI * 30; // 188.4

  // Calculate the stroke-dasharray for the pass rate
  const strokeDasharrayNeed = (quiz.percent_required / 100) * circumference;

  return (
    <div className="flex justify-center mt-4">
      <div className="relative w-64 h-64">
        {/* SVG Circular Chart */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          className="block mx-auto max-w-full"
        >
          {/* Background Circle */}
          <circle
            className="fill-none stroke-gray-200"
            cx="50"
            cy="50"
            r="30"
            strokeWidth="12"
          />
          {/* Foreground Circle (Pass Rate) */}
          <circle
            className="fill-none stroke-yellow-200"
            cx="50"
            cy="50"
            r="30"
            strokeWidth="12"
            strokeLinecap="round"
            style={{
              strokeDasharray: `${strokeDasharrayNeed}, ${circumference}`,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
        {/* Text in the Center */}
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <p className="flex flex-col items-center text-xs text-gray-900">
            <span className="flex justify-center items-center font-bold text-3xl text-gray-900">
              {quiz.percent_required}%
              <br />
              Need
            </span>
          </p>
        </div>
      </div>
    </div>

 
  );
}
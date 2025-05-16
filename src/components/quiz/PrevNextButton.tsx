// src/components/quiz/PrevNextButton.tsx
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface PrevNextButtonProps {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function PrevNextButton({ onPrev, onNext, isFirst, isLast }: PrevNextButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-50/90 backdrop-blur-sm border-t border-gray-200 sm:border-none py-3 sm:py-4 z-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 flex justify-between items-center">
        {/* Previous Button */}
        <button
          type="button"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous question"
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            isFirst
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
              : 'bg-sky-100 text-sky-700 hover:bg-sky-200 hover:shadow-md active:scale-95'
          }`}
        >
          <FaArrowLeft className="h-4 w-4" />
          Prev
        </button>

        {/* Next/Submit Button */}
        <button
          type="submit"
          onClick={onNext}
          aria-label={isLast ? 'Submit quiz' : 'Next question'}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 hover:shadow-md active:scale-95 transition-all duration-200"
        >
          {isLast ? 'Submit' : 'Next'}
          {!isLast && <FaArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
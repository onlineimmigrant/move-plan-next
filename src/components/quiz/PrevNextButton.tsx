// src/components/quiz/PrevNextButton.tsx
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Button from '@/ui/Button';

interface PrevNextButtonProps {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function PrevNextButton({ onPrev, onNext, isFirst, isLast }: PrevNextButtonProps) {
  return (
    <div className="py-4 fixed sm:bottom-4 bottom-0 left-0 right-0 bg-transparent backdrop-blur-sm border-t border-gray-50 shadow sm:shadow-none sm:border-none  sm:py-4 z-10">
      <div className="mx-auto max-w-3xl px-8 sm:px-0 flex justify-between items-center">
        {/* Previous Button */}
        <Button
          type="button"
          variant="primary"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous question"
          className={` ${
            isFirst
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
              : 'bg-sky-100 text-sky-700 hover:bg-sky-200 hover:shadow-md active:scale-95'
          }`}
        >
          
          Prev
        </Button>

        {/* Next/Submit Button */}
        <Button
          type="submit"
          variant="primary"
          onClick={onNext}
          aria-label={isLast ? 'Submit quiz' : 'Next question'}
          className=""
        >
          {isLast ? 'Submit' : 'Next'}
          {!isLast }
        </Button>
      </div>
    </div>
  );
}
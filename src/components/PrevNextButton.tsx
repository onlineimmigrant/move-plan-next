// src/components/PrevNextButton.tsx
interface PrevNextButtonProps {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function PrevNextButton({ onPrev, onNext, isFirst, isLast }: PrevNextButtonProps) {
  return (

    <div className="fixed bottom-6 left-0 right-0 bg-white border-t sm:border-none border-gray-200 p-2 ">
      <div className="flex justify-between  mx-auto max-w-5xl px-4 ">
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirst}
        className={`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded ${isFirst ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Previous
      </button>
      <button
        type="submit"
        className="bg-sky-500 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded"
      >
        {isLast ? 'Submit' : 'Next'}
      </button>
      </div>
    </div>
  );
}
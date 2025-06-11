import Tooltip from "@/components/Tooltip";

// src/components/quiz/InfoQuizElement.tsx
export default function InfoQuizElement() {
  return (
    <span className="inline-flex items-center  py-1 text-sm font-medium text-sky-600 hover:underline hover:text-sky-700 cursor-pointer">
      <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
    </span>
  );
}
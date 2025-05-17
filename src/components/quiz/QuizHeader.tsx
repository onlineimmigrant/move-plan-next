import React from 'react';
import InfoQuizElement from './InfoQuizElement';

interface QuizHeaderProps {
  examMode: boolean;
  topicTitle: string;
  currentIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  openModal: (modalId: string) => void;
  modalId: string;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({
  examMode,
  topicTitle,
  currentIndex,
  totalQuestions,
  timeRemaining,
  openModal,
  modalId,
}) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="mt-6 sm:my-2 sm:mt-0">

      <div className="font-bold text-base sm:text-lg text-gray-900 space-x-1">
         <span>{topicTitle}</span>

       
      </div>
      <div className="flex justify-between text-sm font-medium text-gray-500">
        <span>
          {currentIndex + 1} of {totalQuestions}
        </span>
        <span id="time" className="text-sky-600 ml-4">
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  );
};

export default QuizHeader;
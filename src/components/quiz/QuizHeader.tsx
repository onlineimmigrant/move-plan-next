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
    <div className="my-4 ">
      {!examMode && (
        <button
          onClick={() => openModal(modalId)}
          title="Answer and explanation"
          className="text-sky-600 hover:text-sky-800 transition-colors"
        >
          <InfoQuizElement />
        </button>
      )}
      <div className="font-semibold text-lg text-gray-900">
        <span>{topicTitle}</span>
      </div>
      <div className="pb-2 flex justify-between text-sm font-medium text-gray-500">
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
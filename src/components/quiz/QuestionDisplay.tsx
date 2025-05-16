import React from 'react';

interface QuestionDisplayProps {
  questionText: string;
  correctAnswerCount: number;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ questionText, correctAnswerCount }) => (
  <>
    <h2 className="text-sm sm:text-base font-semibold text-gray-800 leading-relaxed">
      <span dangerouslySetInnerHTML={{ __html: questionText }} />
    </h2>
    {correctAnswerCount > 1 && (
      <span className="flex justify-end text-sm font-semibold text-sky-600">
        Select {correctAnswerCount}:
      </span>
    )}
  </>
);

export default QuestionDisplay;
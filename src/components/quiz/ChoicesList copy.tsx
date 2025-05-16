// src/components/quiz/ChoicesList.tsx
import React from 'react';
import { Choice } from './Types';

interface ChoicesListProps {
  choices: Choice[];
  questionId: number;
  currentAnswers: number[];
  correctAnswerCount: number;
  randomizeChoices: boolean;
  numerateChoices: boolean;
  handleAnswerChange: (questionId: number, choiceId: number, isMulti: boolean) => void;
}

const ChoicesList: React.FC<ChoicesListProps> = ({
  choices,
  questionId,
  currentAnswers,
  correctAnswerCount,
  numerateChoices,
  randomizeChoices,
  handleAnswerChange,
}) => {
  const isMulti = correctAnswerCount > 1;

  // Create a sorted array of choice IDs for enumeration
  const sortedChoiceIds = [...choices]
    .sort((a, b) => a.id - b.id)
    .map((choice, index) => ({
      id: choice.id,
      letter: String.fromCharCode(97 + index), // a, b, c, etc.
    }));

  // Map choice ID to its letter
  const getChoiceLetter = (choiceId: number) =>
    sortedChoiceIds.find((item) => item.id === choiceId)?.letter || '';

  return (
    <div>
      {/* Prompt with no blinking */}
      {!currentAnswers.length && (
        <div className="mt-2 p-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r animate-fadeIn !animate-none">
          Please select one of these options.
        </div>
      )}

      {choices.map((choice) => {
        const numeration = numerateChoices ? getChoiceLetter(choice.id) : null;
        const isSelected = currentAnswers.includes(choice.id);

        return (
          <div key={choice.id} className="my-2">
            {isMulti ? (
              // Multi-choice: Button-like selection (replacing checkbox)
              <button
                type="button"
                onClick={() => handleAnswerChange(questionId, choice.id, true)}
                className={`w-full flex items-center p-3 text-sm rounded-md border transition-colors ${
                  isSelected
                    ? 'bg-sky-100 border-sky-500 text-sky-800'
                    : 'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span
                  className={`w-5 h-5 mr-3 flex items-center justify-center rounded border ${
                    isSelected ? 'bg-sky-500 border-sky-500 text-white' : 'border-gray-300'
                  }`}
                >
                  {isSelected && '✓'}
                </span>
                <span className="flex-1 text-left">
                  {numeration && (
                    <span className="text-gray-500 font-medium mr-1.5">
                      {numeration}.
                    </span>
                  )}
                  {choice.choice_text || <span className="text-gray-400 italic">Empty choice</span>}
                </span>
              </button>
            ) : (
              // Single-choice: Button-like selection (replacing radio)
              <button
                type="button"
                onClick={() => handleAnswerChange(questionId, choice.id, false)}
                className={`w-full flex items-center p-3 text-sm rounded-md border transition-colors ${
                  isSelected
                    ? 'bg-sky-100 border-sky-500 text-sky-800'
                    : 'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100'
                }`}
              >
                <span
                  className={`w-5 h-5 mr-3 flex items-center justify-center rounded-full border ${
                    isSelected ? 'bg-sky-500 border-sky-500 text-white' : 'border-gray-300'
                  }`}
                >
                  {isSelected && '●'}
                </span>
                <span className="flex-1 text-left">
                  {numeration && (
                    <span className="text-gray-500 font-medium mr-1.5">
                      {numeration}.
                    </span>
                  )}
                  {choice.choice_text || <span className="text-gray-400 italic">Empty choice</span>}
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChoicesList;
// src/components/quiz/ChoicesList.tsx
import React from 'react';
import { Choice } from './Types';
import InfoQuizElement from './InfoQuizElement';

interface ChoicesListProps {
  choices: Choice[];
  examMode: boolean;
  openModal?: (modalId: string) => void; // Made optional to match QuizFormProps
  modalId: string;
  questionId: number;
  currentAnswers: number[];
  correctAnswerCount: number;
  randomizeChoices: boolean;
  numerateChoices: boolean;
  handleAnswerChange: (questionId: number, choiceId: number, isMulti: boolean) => void;
}

const ChoicesList: React.FC<ChoicesListProps> = ({
  modalId,
  examMode,
  openModal,
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
    <div className="space-y-2">
      {/* Prompt with no blinking, shown before choices */}
      {!currentAnswers.length && (
        <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-r text-sm font-medium animate-fadeIn !animate-none">
          Please select {isMulti ? 'one or more options' : 'an option'}.
        </div>
      )}

      {/* Choices */}
      {choices.map((choice) => {
        const numeration = numerateChoices ? getChoiceLetter(choice.id) : null;
        const isSelected = currentAnswers.includes(choice.id);

        return (
          <div key={choice.id}>
            {isMulti ? (
              <div
                className={`w-full flex items-center p-3 text-sm rounded-md border transition-colors ${
                  isSelected
                    ? 'bg-sky-100 border-sky-500 text-sky-800'
                    : 'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100'
                }`}
                onClick={() => {
                  handleAnswerChange(questionId, choice.id, true);
                  if (examMode && openModal) {
                    openModal(modalId); // Safely call openModal if defined
                  }
                }}
              >
                <input
                  type="checkbox"
                  id={`checkbox_${choice.id}`}
                  name={`question_${questionId}`}
                  value={choice.id}
                  checked={isSelected}
                  onChange={() => handleAnswerChange(questionId, choice.id, true)}
                  data-max={correctAnswerCount}
                  className="hidden"
                  aria-checked={isSelected}
                />
                <label
                  htmlFor={`checkbox_${choice.id}`}
                  className="w-full flex items-center cursor-pointer"
                >
                  <span
                    className={`w-5 h-5 mr-3 flex items-center justify-center rounded border ${
                      isSelected ? 'bg-sky-500 border-sky-500 text-white' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && '✓'}
                  </span>
                  <span className="flex-1 text-left font-medium text-gray-600">
                    {numeration && (
                      <span className="text-gray-500 font-medium mr-1.5">
                        {numeration}.
                      </span>
                    )}
                    {choice.choice_text || (
                      <span className="text-gray-400 italic">Empty choice</span>
                    )}
                  </span>
                </label>
              </div>
            ) : (
              <div
                className={`w-full flex items-center p-3 text-sm rounded-md border transition-colors ${
                  isSelected
                    ? 'bg-sky-100 border-sky-500 text-sky-800'
                    : 'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100'
                }`}
                onClick={() => {
                  handleAnswerChange(questionId, choice.id, false);
                  if (examMode && openModal) {
                    openModal(modalId); // Safely call openModal if defined
                  }
                }}
              >
                <input
                  type="radio"
                  id={`radio_${choice.id}`}
                  name={`question_${questionId}`}
                  value={choice.id}
                  checked={isSelected}
                  onChange={() => handleAnswerChange(questionId, choice.id, false)}
                  className="hidden"
                  aria-checked={isSelected}
                  required
                />
                <label
                  htmlFor={`radio_${choice.id}`}
                  className="w-full flex items-center cursor-pointer"
                >
                  <span
                    className={`w-5 h-5 mr-3 flex items-center justify-center rounded-full border ${
                      isSelected ? 'bg-sky-500 border-sky-500 text-white' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && '●'}
                  </span>
                  <span className="flex-1 text-left font-medium text-gray-600">
                    {numeration && (
                      <span className="text-gray-500 font-medium mr-1.5">
                        {numeration}.
                      </span>
                    )}
                    {choice.choice_text || (
                      <span className="text-gray-400 italic">Empty choice</span>
                    )}
                  </span>
                </label>
              </div>
            )}
          </div>
        );
      })}

      {/* InfoQuizElement button */}
      {!examMode && (
        <button
          onClick={() => openModal && openModal(modalId)} // Safely call openModal if defined
          title="Answer and explanation"
          className="mt-2 flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm font-medium text-sky-600 hover:bg-sky-100 hover:text-sky-800 transition-colors"
        >
          <InfoQuizElement />
          <span>Answer & Explanation</span>
        </button>
      )}
    </div>
  );
};

export default ChoicesList;
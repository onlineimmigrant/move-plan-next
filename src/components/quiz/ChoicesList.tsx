import React from 'react';
import { Choice } from './Types';

interface ChoicesListProps {
  choices: Choice[];
  questionId: number;
  currentAnswers: number[];
  correctAnswerCount: number;
  randomizeChoices: boolean;
  handleAnswerChange: (questionId: number, choiceId: number, isMulti: boolean) => void;
}

const ChoicesList: React.FC<ChoicesListProps> = ({
  choices,
  questionId,
  currentAnswers,
  correctAnswerCount,
  randomizeChoices,
  handleAnswerChange,
}) => {
  const isMulti = correctAnswerCount > 1;

  return (
    <>
      {choices.map((choice, idx) => {
        const numeration = randomizeChoices ? String.fromCharCode(97 + idx) : null;
        return (
          <div key={choice.id} className="my-2">
            {isMulti ? (
              <div className="flex items-center pl-4 text-sm py-3 bg-gray-50 rounded-lg hover:bg-sky-50 hover:text-sky-600 transition-colors">
                <input
                  type="checkbox"
                  id={`checkbox_${choice.id}`}
                  name={`question_${questionId}`}
                  value={choice.id}
                  checked={currentAnswers.includes(choice.id)}
                  onChange={() => handleAnswerChange(questionId, choice.id, true)}
                  data-max={correctAnswerCount}
                  className="w-5 h-5 text-sky-600 bg-white border-gray-300 rounded focus:ring-sky-500 focus:ring-2"
                />
                <label
                  htmlFor={`checkbox_${choice.id}`}
                  className="w-full py-2 mx-4 font-medium text-gray-700"
                >
                  {numeration && <span className="text-gray-500">({numeration}) </span>}
                  {choice.choice_text}
                </label>
              </div>
            ) : (
              <div className="flex items-center pl-4 text-sm bg-gray-50 py-3 rounded-lg hover:bg-sky-50 hover:text-sky-600 transition-colors">
                <input
                  type="radio"
                  id={`radio_${choice.id}`}
                  name={`question_${questionId}`}
                  value={choice.id}
                  checked={currentAnswers.includes(choice.id)}
                  onChange={() => handleAnswerChange(questionId, choice.id, false)}
                  className="w-5 h-5 text-sky-600 bg-white border-gray-300 focus:ring-sky-500 focus:ring-2"
                  required
                />
                <label
                  htmlFor={`radio_${choice.id}`}
                  className="w-full py-2 mx-4 font-medium text-gray-700"
                >
                  {numeration && <span className="text-gray-500">({numeration}) </span>}
                  {choice.choice_text}
                </label>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default ChoicesList;
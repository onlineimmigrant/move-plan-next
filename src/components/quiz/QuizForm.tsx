import React from 'react';
import PrevNextButton from '@/components/quiz/PrevNextButton';
import ChoicesList from './ChoicesList';
import { Choice, Question } from './Types';

interface QuizFormProps {
  question: Question;
  currentAnswers: number[];
  randomizeChoices: boolean;
  numerateChoices: boolean;
  handleAnswerChange: (questionId: number, choiceId: number, isMulti: boolean) => void;
  handleNext: () => void;
  handlePrev: () => void;
  currentIndex: number;
  totalQuestions: number;
}

const QuizForm: React.FC<QuizFormProps> = ({
  question,
  currentAnswers,
  randomizeChoices,
  numerateChoices,
  handleAnswerChange,
  handleNext,
  handlePrev,
  currentIndex,
  totalQuestions,
}) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      handleNext();
    }}
    className="text-left space-y-2"
  >
    <ChoicesList
      choices={question.choices}
      questionId={question.id}
      currentAnswers={currentAnswers}
      correctAnswerCount={question.correct_answer_count}
      randomizeChoices={randomizeChoices}
      numerateChoices={numerateChoices}
      handleAnswerChange={handleAnswerChange}
    />
    <PrevNextButton
      onPrev={handlePrev}
      onNext={handleNext}
      isFirst={currentIndex === 0}
      isLast={currentIndex === totalQuestions - 1}
    />
  </form>
);

export default QuizForm;
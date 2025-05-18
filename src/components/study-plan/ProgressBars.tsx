// src/components/study-plan/ProgressBars.tsx
import Link from 'next/link';
import { CourseProgress } from './types';

interface ProgressBarsProps {
  courseProgress: CourseProgress;
}

const ProgressBars = ({ courseProgress }: ProgressBarsProps) => {
  return (
    <div className="mt-2">
      <div className="mt-2">
        <div className="w-full bg-gray-100 h-10">
          <div
            className="rounded-md  flex bg-teal-500 h-10 items-center justify-between text-sm px-4 text-white font-semibold"
            style={{
              width: `${courseProgress.quiz_quizstatistic?.percent_correct || 0}%`,
              minWidth: '50%',
            }}
          >
            <span>
              {courseProgress.quiz_quizstatistic?.questions_correct || 0} /{' '}
              {courseProgress.quiz_quizstatistic?.questions_attempted || 0}
            </span>
            <span className="hidden sm:block text-gray-300">
              {courseProgress.quiz_quizstatistic?.percent_correct?.toFixed(2) || 0}%
            </span>
            <span>Practice</span>
            <Link
              href={`/account/edupro/${courseProgress.course.slug}/quiz/${courseProgress.quiz.slug}`}
              className="rounded-full font-bold px-1 py-0.5  hover:text-gray-300"
            >
              →
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-100 h-10">
          <div
            className={`rounded-md flex h-10 items-center justify-between text-sm px-4 text-white font-semibold ${
              courseProgress.completed_topics_percentage >= 50 ? 'bg-sky-500' : 'bg-sky-300'
            }`}
            style={{
              width: `${courseProgress.completed_topics_percentage}%`,
              minWidth: '50%',
            }}
          >
            <span>
              {courseProgress.completed_topics} / {courseProgress.total_topics}
            </span>
            <span className="px-2 text-gray-300 hidden sm:block">
              {courseProgress.completed_topics_percentage.toFixed(2)}%
            </span>
            <span>Topics</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBars;
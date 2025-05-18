// src/components/study-plan/TopicSection.tsx
import Link from 'next/link';
import LessonsTable from './LessonsTable';
import { TopicProgress } from './types';

interface TopicSectionProps {
  topicProg: TopicProgress;
  courseSlug: string;
  quizSlug: string;
  isEditingDates: boolean;
  preferenceStyle: 'intensive' | 'flexible' | 'linear';
  editedDates: { [key: number]: string };
  handleDateChange: (lessonId: number, date: string) => void;
  formatDate: (date: Date) => string;
}

const TopicSection = ({
  topicProg,
  courseSlug,
  quizSlug,
  isEditingDates,
  preferenceStyle,
  editedDates,
  handleDateChange,
  formatDate,
}: TopicSectionProps) => {
  return (
    <div className="mt-8">
      <div className="text-base font-semibold text-gray-900">
        <div className="grid grid-cols-7 sm:grid-cols-12 items-center">
          <div
            className={`ml-2 mr-auto flex items-center justify-center h-8 w-8 text-white text-sm font-semibold rounded-full ${
              topicProg.progress_percentage === 100 ? 'bg-sky-500' : 'bg-gray-300'
            }`}
          >
            {topicProg.topic.order}
          </div>
          <Link
            className="col-span-6 sm:col-span-11"
            href={`/account/edupro/${courseSlug}/topic/${topicProg.topic.slug}`}
          >
            <h4 className="font-semibold text-base sm:text-lg text-gray-900 hover:text-sky-500">
              {topicProg.topic.title}
            </h4>
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <LessonsTable
          lessonsProgress={topicProg.lessons_progress}
          courseSlug={courseSlug}
          topicSlug={topicProg.topic.slug}
          isEditingDates={isEditingDates}
          preferenceStyle={preferenceStyle}
          editedDates={editedDates}
          handleDateChange={handleDateChange}
          formatDate={formatDate}
        />
        <div className="w-full bg-gray-100 h-8 mt-2">
          <div
            className={`flex h-8 items-center justify-start text-xs px-4 text-white font-semibold ${
              topicProg.progress_percentage >= 50 ? 'bg-sky-500' : 'bg-sky-300'
            }`}
            style={{ width: `${topicProg.progress_percentage}%`, minWidth: '35%' }}
          >
            <span>
              {topicProg.completed_lessons_count} / {topicProg.lessons_progress.length}
            </span>
            <span className="px-2 text-gray-300 hidden sm:block">
              {topicProg.progress_percentage.toFixed(2)}%
            </span>
          </div>
        </div>
        {topicProg.quiz_topic_stats && (
          <div className="mt-6">
            <div className="text-base font-semibold text-gray-900">
              <Link
                href={`/account/edupro/${courseSlug}/quiz/${quizSlug}?topics=${topicProg.quiz_topic_id}&num_questions=10&exam_mode=1`}
                className="text-sky-500 hover:underline text-xs sm:text-sm font-light pr-4"
              >
                Practice for {topicProg.topic.title}
              </Link>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-100 h-8">
                <div
                  className="flex bg-teal-500 h-8 items-center justify-between text-xs px-4 text-white font-semibold"
                  style={{
                    width: `${topicProg.quiz_topic_stats.percent_correct}%`,
                    minWidth: '22%',
                  }}
                >
                  <span>
                    {topicProg.quiz_topic_stats.correct_answers} /{' '}
                    {topicProg.quiz_topic_stats.total_questions}
                  </span>
                  <span className="px-2 text-gray-300 hidden sm:block">
                    {topicProg.quiz_topic_stats.percent_correct.toFixed(2)}%
                  </span>
                  <Link
                    href={`/account/edupro/${courseSlug}/quiz/${quizSlug}?topics=${topicProg.quiz_topic_id}&num_questions=10&exam_mode=1`}
                    className="rounded-full font-bold px-1 py-0.5 border border-white hover:bg-white hover:text-gray-500"
                  >
                    →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicSection;
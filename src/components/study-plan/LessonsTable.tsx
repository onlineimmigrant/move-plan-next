// src/components/study-plan/LessonsTable.tsx
import Link from 'next/link';
import { LessonProgress } from './Types';

interface LessonsTableProps {
  lessonsProgress: LessonProgress[];
  courseSlug: string;
  topicSlug: string;
  isEditingDates: boolean;
  preferenceStyle: 'intensive' | 'flexible' | 'linear';
  editedDates: { [key: number]: string };
  handleDateChange: (lessonId: number, date: string) => void;
  formatDate: (date: Date) => string;
}

const LessonsTable = ({
  lessonsProgress,
  courseSlug,
  topicSlug,
  isEditingDates,
  preferenceStyle,
  editedDates,
  handleDateChange,
  formatDate,
}: LessonsTableProps) => {
  return (
    <table className="border-2 sm:border-none  border-gray-200 min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50 rounded-md">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
            #
          </th>
          <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider">
            Lesson
          </th>
          <th className="px-2 py-3 text-left text-xs font-medium uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
            Completion 
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
            Plan Date
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {lessonsProgress.map((lessonProg, index) => (
          <tr
            key={lessonProg.lesson.id}
            className={index % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'}
          >
            <td
              className={`px-6 py-4 whitespace-nowrap text-sm ${
                lessonProg.completed ? 'text-sky-500' : 'text-gray-500'
              }`}
            >
              {lessonProg.lesson.order}
            </td>
            <td className="px-2 py-4 whitespace-nowrap text-sm font-semibold">
              <Link
                href={`/account/edupro/${courseSlug}/topic/${topicSlug}/lesson/${lessonProg.lesson.id}`}
                className={`rounded-md px-5 py-2 hover:bg-gray-200 hover:text-gray-500 ${
                  lessonProg.completed
                    ? 'bg-sky-500 text-white'
                    : lessonProg.lesson.title.includes('Practice')
                    ? 'bg-yellow-200 text-gray-700'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {lessonProg.lesson.title}
              </Link>
            </td>
            <td className="px-2 py-4 whitespace-nowrap text-center text-sm">
              {lessonProg.completed ? (
                <span className="text-sky-500 text-xl" title="Completed">
                  ✓
                </span>
              ) : (
                <span className="text-gray-400 text-xl" title="Not Completed">
                  ✗
                </span>
              )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {lessonProg.completion_date
                ? formatDate(new Date(lessonProg.completion_date))
                : ''}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <div className="flex justify-between gap-4">
                {isEditingDates && preferenceStyle === 'flexible' ? (
                  <input
                    type="date"
                    value={
                      editedDates[lessonProg.lesson.id] ||
                      lessonProg.planned_completion_date
                    }
                    onChange={(e) =>
                      handleDateChange(lessonProg.lesson.id, e.target.value)
                    }
                    className="border rounded px-2 py-1 text-sm"
                  />
                ) : (
                  <>
                    <span>
                      {formatDate(new Date(lessonProg.planned_completion_date))}
                    </span>
                    <span className='hidden sm:block'>
                      {new Date(
                        lessonProg.planned_completion_date
                      ).toLocaleString('en-US', {
                        weekday: 'long',
                      })}
                    </span>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default LessonsTable;
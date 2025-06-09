// components/edupro/LessonContent.tsx
import { EduProLesson } from '@/types/edupro';

interface LessonContentProps {
  lesson: EduProLesson;
}

const LessonContent: React.FC<LessonContentProps> = ({ lesson }) => (
  <div className="hidden relative pl-4 py-4 bg-white rounded-lg shadow-sm">
    <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-xs font-medium rounded-full cursor-pointer">
      {lesson.order}
    </span>
    <h3 className="text-lg font-medium text-gray-900 pr-8">{lesson.title}</h3>
    {lesson.description && <p className="text-sm text-gray-600 mt-2">{lesson.description}</p>}
    {lesson.duration && <p className="text-sm text-gray-500 mt-2">Duration: {lesson.duration}</p>}
    {lesson.content_type && <p className="text-sm text-gray-500 mt-2">Content Type: {lesson.content_type}</p>}
    {lesson.links_to_video && (
      <div className="mt-2">
        <p className="text-sm text-gray-500">Video Link:</p>
        <a
          href={lesson.links_to_video}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:underline cursor-pointer"
        >
          {lesson.links_to_video}
        </a>
      </div>
    )}
    {lesson.video_player && (
      <div className="mt-2">
        <p className="text-sm text-gray-500">Video Player URL:</p>
        <a
          href={lesson.video_player}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:underline cursor-pointer"
        >
          {lesson.video_player}
        </a>
      </div>
    )}
    {lesson.image && (
      <div className="mt-2">
        <p className="text-sm text-gray-500">Image URL:</p>
        <a
          href={lesson.image}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-600 hover:underline cursor-pointer"
        >
          {lesson.image}
        </a>
      </div>
    )}
    {lesson.assessment_methods && (
      <p className="text-sm text-gray-500 mt-2">Assessment Methods: {lesson.assessment_methods}</p>
    )}
    {lesson.plan && (
      <div className="mt-2">
        <p className="text-sm text-gray-500">Lesson Plan:</p>
        <p className="text-sm text-gray-600">{lesson.plan}</p>
      </div>
    )}
    {lesson.created_at && (
      <p className="text-sm text-gray-400 mt-2">
        Created At: {new Date(lesson.created_at).toLocaleString()}
      </p>
    )}
    {lesson.updated_at && (
      <p className="text-sm text-gray-400 mt-2">
        Updated At: {new Date(lesson.updated_at).toLocaleString()}
      </p>
    )}
  </div>
);

export default LessonContent;
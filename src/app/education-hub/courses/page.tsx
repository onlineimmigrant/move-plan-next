'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface BlogCourse {
  id: number;
  slug: string;
  title: string | null;
  description: string | null;
  display_this_course?: boolean;
  display_as_blog_course?: boolean;
  image?: string | null;
  subsection?: string | null;
  section_id?: number | null;
  product_id: string;
  product_slug: string; // Added for product.slug
}

const CoursesListPage: React.FC = () => {
  const [courses, setCourses] = useState<BlogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/courses');
        if (response.ok) {
          const data = await response.json();
          console.log('Raw API response:', data);
          if (!Array.isArray(data)) {
            console.error('Expected an array, got:', data);
            return;
          }
          data.forEach((course: BlogCourse, index: number) => {
            console.log(`Course ${index}:`, {
              slug: course.slug,
              section_id: course.section_id,
              product_slug: course.product_slug,
            });
          });
          setCourses(data);
        } else {
          console.error('Failed to fetch courses:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses
    .filter((course) => {
      const title = course.title ?? '';
      const description = course.description ?? '';
      const subsection = course.subsection ?? '';
      const query = searchQuery.toLowerCase();
      const shouldDisplay = course.display_this_course !== false;
      const isBlogCourse = course.display_as_blog_course !== false;
      console.log('Course:', course, 'display_this_course:', course.display_this_course, 'Should display:', shouldDisplay);
      return (
        shouldDisplay &&
        isBlogCourse &&
        // Removed course.product_slug filter to debug why nothing shows
        (title.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query) ||
          subsection.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      const hasPhotoA = a.image && a.image.trim() !== '';
      const hasPhotoB = b.image && b.image.trim() !== '';
      return hasPhotoB ? 1 : hasPhotoA ? -1 : 0;
    });

  if (loading)
    return (
      <div className="py-32 text-center text-gray-500">
        <div className="animate-pulse">Loading...</div>
      </div>
    );

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4  py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <h1 className="px-4 sm:px-0 text-2xl font-bold text-gray-700 tracking-wide my-4 sm:mb-0">Courses</h1>

          <div className="relative w-full sm:w-80 px-4 sm:px-0">
            <span className="absolute inset-y-0 left-4 sm:left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 p-4 text-base font-light border bg-white border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
            />
          </div>
         
        </div>
        <div className='px-4 sm:px-0 tracking-wider py-4 text-gray-500 font-base font-light'>
        <span >Each Course is a complete package, encompassing topic-focused quizzes and supporting resources to enhance learning.</span>
        </div>
       
        {courses.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No courses available</div>
        ) : filteredCourses.length === 0 && searchQuery ? (
          <div className="text-center py-16 text-gray-500">
            No courses found matching - {searchQuery}
          </div>
        ) : (
          <div className="px-4 sm:px-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                href={course.product_slug ? `/products/${course.product_slug}` : '#'}
                className="group"
              >
                <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {course.image && course.image.trim() !== '' && (
                    <div className="w-full h-auto p-2 flex-shrink-0">
                      <img
                        src={course.image}
                        alt={course.title ?? 'Blog course image'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', course.image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="tracking-tight text-lg line-clamp-1 font-semibold text-gray-900 mb-3 group-hover:text-sky-400">
                      {course.title ?? 'Untitled'}
                    </h2>
                    <p className="tracking-widest text-base text-gray-600 font-light line-clamp-2 flex-grow">
                      {course.description ?? 'No description available'}
                    </p>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0 flex justify-end relative">
                    {course.subsection && course.subsection.trim() !== '' ? (
                      <>
                        <span className="text-gray-500 text-sm font-medium group-hover:opacity-0 transition-opacity duration-200">
                          {course.subsection}
                        </span>
                        <span className="absolute right-6 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <ArrowRightIcon className="h-5 w-5" />
                        </span>
                      </>
                    ) : (
                      <span className="text-sky-400">
                        <ArrowRightIcon className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursesListPage;
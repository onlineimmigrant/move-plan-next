'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the EduProResource interface with the image field
interface EduProResource {
  id: number;
  title: string;
  description: string | null;
  url: string | null;
  image: string | null; // Added image field
  course_id: number;
  created_at: string | null;
  updated_at: string | null;
  order: number | null;
}

interface StudyBooksProps {
  courseId: number; // Prop to receive the course ID
}

export default function StudyBooks({ courseId }: StudyBooksProps) {
  const [resources, setResources] = useState<EduProResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('edu_pro_resource')
          .select(`
            id,
            title,
            description,
            url,
            image,
            course_id,
            created_at,
            updated_at,
            order
          `)
          .eq('course_id', courseId)
          .order('order', { ascending: true });

        if (resourcesError) {
          throw new Error(`Error fetching resources: ${resourcesError.message}`);
        }

        setResources(resourcesData || []);
      } catch (err) {
        console.error('StudyBooks: Error:', err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {resources.length > 0 ? (
        <ul className="grid grid-cols-1 lg:grid-cols-4 gap-8 sm:gap-x-16">
          {resources.map((resource) => (
            <Link
              key={resource.id}
              href={'/account/profile/purchases'} // Fallback to /account/profile/purchases if url is null
              target="_blank"
              rel="noopener noreferrer"
              className="block " // Ensure the link takes up the full space of the li
            >
              <li
                className="relative border-l-4 border-gray-600 bg-white hover:bg-sky-50 rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center h-24" // Fixed height for vertical centering
              >
                {/* Order number in top-right corner */}
                {resource.order !== null && (
                  <span className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-gray-600 text-white text-xs font-medium rounded-full">
                    {resource.order}
                  </span>
                )}

                {/* Image on the left */}
                {resource.image && (
                  <div className="flex-shrink-0 mr-4">
                    <img
                      src={resource.image}
                      alt={`${resource.title} cover`}
                      className="w-16 h-auto object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-book-cover.jpg'; // Fallback image if the URL fails
                      }}
                    />
                  </div>
                )}

                {/* Text content on the right */}
                <div className="flex-1 flex items-center justify-start pr-8">
                  <h3 className="text-sm font-medium text-gray-900 ">{resource.title}</h3>
                  {resource.description && (
                    <p className="text-sm text-gray-600 mt-1 text-center">{resource.description}</p>
                  )}
                  {/* Removed separate Link for Access Resource since the whole li is now clickable */}
                </div>
              </li>
            </Link>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 text-center">No study books available for this course.</p>
      )}
    </div>
  );
}
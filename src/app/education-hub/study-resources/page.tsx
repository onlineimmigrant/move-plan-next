'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

interface BlogResource {
  id: number;
  slug: string;
  name: string | null;
  resource_type: string | null;
  is_displayed?: boolean;
  display_as_blog_resource?: boolean;
  image?: string | null;
  subsection?: string | null;
  section_id?: number | null;
  product_id: string; // Kept as string to match course/quiz interfaces
  product_slug: string; // Added for product.slug
}

const ResourcesListPage: React.FC = () => {
  const [resources, setResources] = useState<BlogResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch('/api/study-resources');
        if (response.ok) {
          const data = await response.json();
          console.log('Raw API response:', data);
          if (!Array.isArray(data)) {
            console.error('Expected an array, got:', data);
            return;
          }
          data.forEach((resource: BlogResource, index: number) => {
            console.log(`Resource ${index}:`, {
              slug: resource.slug,
              section_id: resource.section_id,
              product_slug: resource.product_slug,
            });
          });
          setResources(data);
        } else {
          console.error('Failed to fetch resources:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('An error occurred:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const filteredResources = resources
    .filter((resource) => {
      const name = resource.name ?? '';
      const resource_type = resource.resource_type ?? '';
      const subsection = resource.subsection ?? '';
      const query = searchQuery.toLowerCase();
      const shouldDisplay = resource.is_displayed !== false;
      const isBlogResource = resource.display_as_blog_resource !== false;
      console.log(
        'Resource:',
        resource,
        'Should display:',
        shouldDisplay
      );
      return (
        shouldDisplay &&
        isBlogResource &&
        (name.toLowerCase().includes(query) ||
          resource_type.toLowerCase().includes(query) ||
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
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <h1 className="px-4 sm:px-0 text-2xl font-bold text-gray-700 tracking-wide my-4 sm:mb-0">Study Resources</h1>
        <div className="relative w-full sm:w-80 px-4 sm:px-0">
            <span className="absolute inset-y-0 left-4 sm:left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-4 text-base font-light border bg-white border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
        <div className='px-4 sm:px-0 tracking-wider py-4 text-gray-500 font-base font-light'>
        <span >Our Study Resources section is a curated collection of educational tools and materials to supplement your study and knowledge expansion.</span>
        </div>

        {resources.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No resources available</div>
        ) : filteredResources.length === 0 && searchQuery ? (
          <div className="text-center py-16 text-gray-500">
            No resources found matching - {searchQuery}
          </div>
        ) : (
          <div className="px-4 sm:px-0 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredResources.map((resource) => (
              <Link
                key={resource.id}
                href={resource.product_slug ? `/products/${resource.product_slug}` : '#'}
                className="group"
              >
                <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {resource.image && resource.image.trim() !== '' && (
                    <div className="w-full h-auto flex-shrink-0">
                      <img
                        src={resource.image}
                        alt={resource.name ?? 'Blog resource image'}
                        className="w-full rounded-t-xl h-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', resource.image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="tracking-tight text-lg line-clamp-1 font-semibold text-gray-900 mb-3 group-hover:text-sky-400">
                      {resource.name ?? 'Untitled'}
                    </h2>
                    <p className="tracking-widest text-base text-gray-600 font-light line-clamp-2 flex-grow">
                      {resource.resource_type ?? 'No resource_type available'}
                    </p>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0 flex justify-end relative">
                    {resource.subsection && resource.subsection.trim() !== '' ? (
                      <>
                        <span className="text-gray-500 text-sm font-medium group-hover:opacity-0 transition-opacity duration-200">
                          {resource.subsection}
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

export default ResourcesListPage;
// src/app/features/page.tsx (your version with fix)
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Icons from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';
import parse from 'html-react-parser';

interface Feature {
  id: string;
  created_at: string;
  name: string;
  feature_image?: string;
  content: string;
  slug: string;
  display_content: boolean;
  display_on_product: boolean;
  type?: string;
  package?: string;
  description?: string;
  type_display?: string;
}

export default function FeaturesPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const { data, error } = await supabase.from('feature').select('*');

        if (error) throw new Error(error.message);
        setFeatures(data || []);
      } catch (error) {
        console.error('Error fetching features:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  const filteredFeatures = features
    .filter(feature => {
      const query = searchQuery.toLowerCase();
      return [feature.name, feature.content, feature.type]
        .some(field => field?.toLowerCase().includes(query));
    })
    .sort((a, b) => (b.feature_image ? 1 : a.feature_image ? -1 : 0));

  if (loading) return <div className="py-32 text-center text-gray-500 animate-pulse">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto sm:px-0 px-6 py-16 pt-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12">
        <h1 className="tracking-wide text-2xl font-bold text-gray-900 mb-6 sm:mb-0">Features</h1>
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 font-light pr-3 py-4 text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {filteredFeatures.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          {searchQuery ? `No features found matching \"${searchQuery}\"` : 'No features available'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredFeatures.map((feature) => {
            const IconComponent = Icons[feature.feature_image as keyof typeof Icons] || ArrowRightIcon;

            return (
              <Link key={feature.id} href={`/features/${feature.slug}`} className="group relative">
                <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  <IconComponent className="h-6 w-6 text-sky-400 absolute top-4 right-4" />
                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-lg line-clamp-1 font-semibold text-gray-900 mb-3 group-hover:text-sky-400">
                      {feature.name}
                    </h2>
                    <div className="text-base text-gray-600 font-light line-clamp-2 flex-grow">
                      {parse(feature.content.split(' ').slice(0, 12).join(' ') + (feature.content.split(' ').length > 12 ? '...' : ''))}
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0 flex justify-end relative">
                    {feature.type ? (
                      <>
                        <span className="text-gray-500 text-sm font-medium group-hover:opacity-0 transition-opacity duration-200">
                          {feature.type}
                        </span>
                        <ArrowRightIcon className="h-5 w-5 text-sky-400 absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </>
                    ) : (
                      <ArrowRightIcon className="h-5 w-5 text-sky-400" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
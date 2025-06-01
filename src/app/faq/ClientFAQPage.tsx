// app/faq/ClientFAQPage.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import FAQSection from '../../components/HomePageSections/FAQSection';
import { FAQ } from '@/types/faq';

interface ClientFAQPageProps {
  initialFAQs: FAQ[];
}

export default function ClientFAQPage({ initialFAQs }: ClientFAQPageProps) {
  // Memoize normalizedFAQs
  const normalizedFAQs = useMemo(
    () =>
      initialFAQs.map(faq => ({
        ...faq,
        organization_id: faq.organization_id ?? faq.organisation_id ?? null,
      })),
    [initialFAQs]
  );

  const [faqs, setFAQs] = useState<FAQ[]>(normalizedFAQs);
  const [filteredFAQs, setFilteredFAQs] = useState<FAQ[]>(normalizedFAQs);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQs based on search query
  useEffect(() => {
    let result = normalizedFAQs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((faq) => {
        const question = faq.question ?? '';
        return question.toLowerCase().includes(query);
      });
    }

    setFilteredFAQs(result);
  }, [searchQuery, normalizedFAQs]);

  return (
    <div className="">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 pt-8">
        <h1 className="px-4 text-2xl font-bold text-gray-700 tracking-wide mb-6 sm:mb-0">
          FAQ
        </h1>
        <div className="relative w-full sm:w-80 px-4 sm:px-0">
          <span className="absolute inset-y-0 left-4 sm:left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-4 text-base font-light border bg-white border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* FAQ Section */}
      <FAQSection faqs={filteredFAQs} />
    </div>
  );
}
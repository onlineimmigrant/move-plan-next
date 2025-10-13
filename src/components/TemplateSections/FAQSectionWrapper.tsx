'use client';

import React, { useEffect, useState } from 'react';
import FAQSection from '@/components/TemplateSections/FAQSection';
import { getOrganizationId } from '@/lib/supabase';
import { FAQ } from '@/types/faq';

interface FAQSectionWrapperProps {
  section: any; // Template section data (unused but consistent with pattern)
}

const FAQSectionWrapper: React.FC<FAQSectionWrapperProps> = ({ section }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const organizationId = await getOrganizationId(baseUrl);
        if (!organizationId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/faqs?organization_id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          setFaqs(data);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [baseUrl]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return <FAQSection faqs={faqs} showTitle={true} />;
};

export default FAQSectionWrapper;

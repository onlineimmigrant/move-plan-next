"use client";

import { useCallback, useMemo, useEffect, useState } from 'react';
import parse from 'html-react-parser';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

// Simple debounce implementation
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Define types for FAQ items
type FAQ = {
  id: number;
  question: string;
  answer: string;
  section?: string;
  display_order?: number;
  order?: number;
  product_sub_type_id?: number;
  [key: string]: any;
};

interface FAQSectionProps {
  slug?: string;
  faqs: FAQ[];
}

const FAQSection = ({ slug, faqs }: FAQSectionProps) => {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  // Group FAQs by section, defaulting to "General" if section is not specified
  const groupedFaqs = useMemo(() => {
    return faqs.reduce((acc: { [key: string]: FAQ[] }, item) => {
      const sectionName = item.section || 'General';
      if (!acc[sectionName]) {
        acc[sectionName] = [];
      }
      acc[sectionName].push(item);
      return acc;
    }, {});
  }, [faqs]);

  // Filter out sections with no FAQs
  const filteredSections = Object.keys(groupedFaqs).filter(
    (section) => groupedFaqs[section].length > 0
  );

  if (filteredSections.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-20 bg-transparent">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* FAQ Title */}
        <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-gray-900 mb-12 tracking-tight">
          Frequently Asked Questions
        </h2>

        {/* FAQ Sections */}
        <div className="space-y-16">
          {filteredSections.map((section) => (
            <div key={section} className="space-y-8">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-500">{section}</h3>
              <div className="divide-y divide-gray-200 rounded-xl bg-white shadow-lg ring-1 ring-gray-100">
                {groupedFaqs[section].map((item) => (
                  <FAQItem key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Individual FAQ item component
const FAQItem = ({ item }: { item: FAQ }) => {
  const [parsedAnswer, setParsedAnswer] = useState<React.ReactNode | null>(null);

  // Preload parsing during idle time
  useEffect(() => {
    const parseAnswer = () => {
      setParsedAnswer(parse(item.answer));
    };

    if (window.requestIdleCallback) {
      const idleId = window.requestIdleCallback(parseAnswer, { timeout: 1000 });
      return () => window.cancelIdleCallback(idleId);
    } else {
      parseAnswer();
    }
  }, [item.answer]);

  // Debounce toggle function
  const debouncedToggle = useCallback(debounce(() => {}, 100), []);

  return (
    <Disclosure as="div" className="p-6">
      {({ open, toggle }) => (
        <>
          <DisclosureButton
            onClick={() => debouncedToggle(toggle)}
            className={`group flex w-full items-center justify-between text-left py-5 transition-colors duration-200 ${
              open ? ' border-gray-100' : ''
            }`}
          >
            <span className="flex items-center flex-1">
              {item.display_order && (
                <span className="flex items-center justify-center w-10 h-10 mr-4 rounded-full bg-sky-50 text-sky-700 text-base font-semibold flex-shrink-0">
                  {item.order}
                </span>
              )}
              <span
                className={`font-semibold transition-colors duration-200 ${
                  open
                    ? 'text-xl text-gray-900'
                    : 'text-lg text-gray-800 group-hover:text-sky-500'
                }`}
              >
                {item.question}
              </span>
            </span>
            <ChevronDownIcon
              className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
                open ? 'rotate-180 text-sky-500' : ''
              } group-hover:text-sky-500`}
            />
          </DisclosureButton>
          <DisclosurePanel className="mt-5 text-base text-gray-600 leading-relaxed pr-4">
            {open && (parsedAnswer || 'Loading...')}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
};

export default FAQSection;
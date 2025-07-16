'use client';

import { useMemo, useEffect, useState } from 'react';
import parse from 'html-react-parser';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { FAQ } from '@/types/faq';

interface FAQSectionProps {
  slug?: string;
  faqs: FAQ[];
  showTitle?: boolean; // Add prop to control title display
}

const FAQSection = ({ faqs, showTitle = true }: FAQSectionProps) => {
  // Move useMemo to top level
  const groupedFaqs = useMemo(() => {
    if (!faqs || faqs.length === 0) {
      return {};
    }
    return faqs.reduce((acc: { [key: string]: FAQ[] }, item) => {
      const sectionName = item.section || 'General';
      if (!acc[sectionName]) {
        acc[sectionName] = [];
      }
      acc[sectionName].push(item);
      return acc;
    }, {});
  }, [faqs]);

  // Early return after hooks
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const filteredSections = Object.keys(groupedFaqs).filter(
    (section) => groupedFaqs[section].length > 0
  );

  if (filteredSections.length === 0) {
    return null;
  }

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-none">
        {showTitle && (
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our services
            </p>
          </div>
        )}
        <div className="space-y-16">
          {filteredSections.map((section) => (
            <div key={section} className="space-y-8">
              <h3 className="text-center text-lg font-bold text-gray-700">{section}</h3>
              <div className="divide-y divide-gray-100">
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

const FAQItem = ({ item }: { item: FAQ }) => {
  const [parsedAnswer, setParsedAnswer] = useState<React.ReactNode | null>(null);

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

  return (
    <Disclosure as="div" className="px-6 py-5">
      {({ open }) => (
        <>
          <DisclosureButton
            className="cursor-pointer group flex w-full items-center justify-between text-left transition-colors duration-200 focus:outline-none"
          >
            <span className="flex items-center flex-1">
              {item.display_order && (
                <span className="flex items-center justify-center w-8 h-8 mr-4 text-sky-600 text-sm font-semibold flex-shrink-0">
                  {item.order}
                </span>
              )}
              <span
                className={`font-semibold transition-colors duration-200 ${
                  open
                    ? 'text-lg text-gray-900'
                    : 'text-base text-gray-800 group-hover:text-sky-600'
                }`}
              >
                {item.question}
              </span>
            </span>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-all duration-200 ${
                open ? 'rotate-180 text-sky-500' : ''
              } group-hover:text-sky-500`}
            />
          </DisclosureButton>
          <DisclosurePanel className="mt-4 text-sm text-gray-600 leading-relaxed">
            {open && (parsedAnswer || (
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full"></div>
                <span>Loading...</span>
              </div>
            ))}
          </DisclosurePanel>
        </>
      )}
    </Disclosure>
  );
};

export default FAQSection;
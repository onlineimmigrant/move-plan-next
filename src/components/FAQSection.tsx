'use client';

import parse from 'html-react-parser';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

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
  const groupedFaqs = faqs.reduce((acc: { [key: string]: FAQ[] }, item) => {
    const sectionName = item.section || 'General';
    if (!acc[sectionName]) {
      acc[sectionName] = [];
    }
    acc[sectionName].push(item);
    return acc;
  }, {});

  // Filter out sections with no FAQs
  const filteredSections = Object.keys(groupedFaqs).filter(
    (section) => groupedFaqs[section].length > 0
  );

  if (filteredSections.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-12">
      <div className="mx-auto w-full max-w-5xl divide-gray-200 rounded-xl">
        {/* FAQ Title */}
        <h2 className="text-center text-lg sm:text-xl px-2 text-gray-700 font-semibold">
          Frequently Asked Questions
        </h2>

        {/* FAQ Sections */}
        <div>
          {filteredSections.map((section) => (
            <div key={section} className="mt-8">
              <h3 className="px-4 text-base sm:text-lg font-bold text-gray-900">{section}</h3>
              {groupedFaqs[section].map((item) => (
                <Disclosure as="div" key={item.id} className="p-4">
                  {({ open }) => (
                    <>
                      <DisclosureButton className="group flex w-full items-center justify-between">
                        <span className="flex items-center">
                          {item.display_order && (
                            <span className="flex items-center justify-center w-6 h-6 mr-4 sm:mr-8 rounded-full bg-gray-200 text-gray-700 text-sm font-semibold flex-shrink-0">
                              {item.order}
                            </span>
                          )}
                          <span
                            className={`text-left font-medium transition-all duration-300 ${
                              open
                                ? 'text-xl text-gray-500'
                                : 'text-base text-gray-700 group-hover:text-xl group-hover:text-gray-500'
                            }`}
                          >
                            {item.question}
                          </span>
                        </span>
                        <ChevronDownIcon
                          className={`w-5 h-5 fill-current ${
                            open ? 'text-gray-500' : 'text-gray-700/60'
                          } group-hover:fill-gray-500/50 transition-transform duration-200 ${
                            open ? 'rotate-180' : ''
                          }`}
                        />
                      </DisclosureButton>
                      <DisclosurePanel className="mt-2 py-8 pt-4 text-base font-light text-gray-500">
                        {parse(item.answer)}
                      </DisclosurePanel>
                    </>
                  )}
                </Disclosure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
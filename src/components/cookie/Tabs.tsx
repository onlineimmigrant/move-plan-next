'use client';

import React from 'react';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import Category from './Category';
import Service from './Service';
import { useCookieTranslations } from './useCookieTranslations';

interface TabsProps {
  categories: {
    id: number;
    name: string;
    description: string;
    cookie_service: { id: number; name: string; description: string; active: boolean }[];
  }[];
  consent: { services: number[] };
  setConsent: React.Dispatch<React.SetStateAction<{ services: number[] }>>;
}

const Tabs: React.FC<TabsProps> = ({ categories, consent, setConsent }) => {
  const t = useCookieTranslations();
  const isEssentialCategory = (name: string) => {
    return name.toLowerCase() === 'essential';
  };

  return (
    <TabGroup>
      <TabList className="flex space-x-2 rounded-lg bg-gray-50 p-2 shadow-sm">
        <Tab
          className={({ selected }) =>
            `cursor-pointer w-full py-1.5 px-6 text-sm font-medium rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
              selected
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-sky-700'
            }`
          }
        >
          {t.categories}
        </Tab>
        <Tab
          className={({ selected }) =>
            `cursor-pointer w-full py-1.5 px-6 text-sm font-medium rounded-md transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
              selected
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-sky-700'
            }`
          }
        >
          {t.services}
        </Tab>
      </TabList>

      <TabPanels className="py-4">
        <TabPanel>
          {categories.map((category) => (
            <Category
              key={category.id}
              category={category}
              consent={consent}
              setConsent={setConsent}
              isEssentialCategory={isEssentialCategory}
            />
          ))}
        </TabPanel>

        <TabPanel>
          {categories
            .flatMap((category) =>
              category.cookie_service.map((service) => ({
                ...service,
                categoryName: category.name,
              }))
            )
            .map((service) => (
              <Service
                key={service.id}
                service={service}
                consent={consent}
                setConsent={setConsent}
                isEssentialCategory={isEssentialCategory}
              />
            ))}
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
};

export default Tabs;
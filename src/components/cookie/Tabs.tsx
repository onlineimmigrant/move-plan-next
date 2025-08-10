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
      <TabList className="flex space-x-1 rounded-2xl bg-gray-100/60 backdrop-blur-sm p-1.5 shadow-sm border border-gray-200/50">
        <Tab
          className={({ selected }) =>
            `cursor-pointer w-full py-3 px-6 text-[14px] font-medium rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 focus:ring-offset-transparent antialiased ${
              selected
                ? 'bg-white text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-semibold'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'
            }`
          }
        >
          {t.categories}
        </Tab>
        <Tab
          className={({ selected }) =>
            `cursor-pointer w-full py-3 px-6 text-[14px] font-medium rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-gray-400/20 focus:ring-offset-1 focus:ring-offset-transparent antialiased ${
              selected
                ? 'bg-white text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.08)] font-semibold'
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-800'
            }`
          }
        >
          {t.services}
        </Tab>
      </TabList>

      <TabPanels className="py-6">
        <TabPanel className="space-y-4">
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

        <TabPanel className="space-y-4">
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
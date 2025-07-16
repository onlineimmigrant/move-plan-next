'use client';

import { Disclosure } from '@headlessui/react';
import { HiMinus,  HiCheck } from 'react-icons/hi';
import Link from 'next/link';


interface Feature {
  id: number;
  name: string;
  feature_image?: string;
  content: string;
  slug: string;
}

interface AssociatedFeaturesDisclosureProps {
  associatedFeatures: Feature[];
}

export default function AssociatedFeaturesDisclosure({
  associatedFeatures,
}: AssociatedFeaturesDisclosureProps) {
  return (
    <div className="mt-4 w-full">
      <Disclosure>
        {({ open }) => (
          <div className="w-full">
            <Disclosure.Button className="flex rounded-full px-2 items-center justify-between w-full py-2 text-xs font-normal text-sky-500 hover:text-gray-700 transition-colors duration-200">
              <span>Included Features</span>
              <span className="ml-2">
                {open ? (
                  <HiMinus className="w-4 h-4 text-sky-500" />
                ) : (
                  " "
                )}
              </span>
            </Disclosure.Button>
            <Disclosure.Panel className="pt-2 w-full">
              <div className="grid grid-cols-1 gap-1 w-full">
                {associatedFeatures.map((feature) => (
                  <Link href={`/features/${feature.slug}`} key={feature.id} className="w-full">
                    <div className="flex items-center bg-gray-100 border-gray-200 rounded-lg p-2 duration-200 cursor-pointer w-full hover:bg-gray-200">
                      <div className="w-5 h-5 bg-transparent rounded flex items-center justify-center mr-3 flex-shrink-0">
                        <HiCheck className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs font-medium text-gray-700 truncate">
                          {feature.name}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Disclosure.Panel>
          </div>
        )}
      </Disclosure>
    </div>
  );
}
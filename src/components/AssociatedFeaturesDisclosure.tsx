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
    <div className="mt-4">
      <Disclosure>
        {({ open }) => (
          <div> {/* Replace Fragment with div */}
            <Disclosure.Button className="flex rounded-full px-2 items-center justify-between w-full sm:w-1/2 py-2 text-xs font-normal text-sky-500 hover:text-gray-700 transition-colors duration-200">
              <span>Included Features</span>
              <span className="ml-2">
                {open ? (
                  <HiMinus className="w-4 h-4 text-sky-500" />
                ) : (
                  " "
                )}
              </span>
            </Disclosure.Button>
            <Disclosure.Panel className="pt-2">
              <div className="grid grid-cols-2 gap-1">
                {associatedFeatures.map((feature) => (
                  <Link href={`/features/${feature.slug}`} key={feature.id}>
                    <div className="flex items-center bg-gray-100 border-gray-200 rounded-lg p-1 duration-200 cursor-pointer">
                      <div className="w-6 h-6 bg-transparent rounded flex items-center justify-center mr-3">
                        <HiCheck className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xs font-medium text-gray-700">
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
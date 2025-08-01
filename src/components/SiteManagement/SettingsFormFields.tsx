import React, { useState } from 'react';
import { Listbox, Transition, Disclosure } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Settings, organizationTypes } from './types';

interface SettingsFormFieldsProps {
  settings: Settings;
  onChange: (field: keyof Settings, value: any) => void;
  onImageUpload: (field: 'image' | 'favicon' | 'hero_image') => void;
  uploadingImages: Set<string>;
  isNarrow?: boolean;
}

const colorOptions = [
  // Red colors
  { name: 'Red 50', value: 'red-50', color: 'bg-red-50' },
  { name: 'Red 100', value: 'red-100', color: 'bg-red-100' },
  { name: 'Red 200', value: 'red-200', color: 'bg-red-200' },
  { name: 'Red 300', value: 'red-300', color: 'bg-red-300' },
  { name: 'Red 400', value: 'red-400', color: 'bg-red-400' },
  { name: 'Red 500', value: 'red-500', color: 'bg-red-500' },
  { name: 'Red 600', value: 'red-600', color: 'bg-red-600' },
  { name: 'Red 700', value: 'red-700', color: 'bg-red-700' },
  { name: 'Red 800', value: 'red-800', color: 'bg-red-800' },
  { name: 'Red 900', value: 'red-900', color: 'bg-red-900' },
  { name: 'Red 950', value: 'red-950', color: 'bg-red-950' },
  
  // Orange colors
  { name: 'Orange 50', value: 'orange-50', color: 'bg-orange-50' },
  { name: 'Orange 100', value: 'orange-100', color: 'bg-orange-100' },
  { name: 'Orange 200', value: 'orange-200', color: 'bg-orange-200' },
  { name: 'Orange 300', value: 'orange-300', color: 'bg-orange-300' },
  { name: 'Orange 400', value: 'orange-400', color: 'bg-orange-400' },
  { name: 'Orange 500', value: 'orange-500', color: 'bg-orange-500' },
  { name: 'Orange 600', value: 'orange-600', color: 'bg-orange-600' },
  { name: 'Orange 700', value: 'orange-700', color: 'bg-orange-700' },
  { name: 'Orange 800', value: 'orange-800', color: 'bg-orange-800' },
  { name: 'Orange 900', value: 'orange-900', color: 'bg-orange-900' },
  { name: 'Orange 950', value: 'orange-950', color: 'bg-orange-950' },
  
  // Amber colors
  { name: 'Amber 50', value: 'amber-50', color: 'bg-amber-50' },
  { name: 'Amber 100', value: 'amber-100', color: 'bg-amber-100' },
  { name: 'Amber 200', value: 'amber-200', color: 'bg-amber-200' },
  { name: 'Amber 300', value: 'amber-300', color: 'bg-amber-300' },
  { name: 'Amber 400', value: 'amber-400', color: 'bg-amber-400' },
  { name: 'Amber 500', value: 'amber-500', color: 'bg-amber-500' },
  { name: 'Amber 600', value: 'amber-600', color: 'bg-amber-600' },
  { name: 'Amber 700', value: 'amber-700', color: 'bg-amber-700' },
  { name: 'Amber 800', value: 'amber-800', color: 'bg-amber-800' },
  { name: 'Amber 900', value: 'amber-900', color: 'bg-amber-900' },
  { name: 'Amber 950', value: 'amber-950', color: 'bg-amber-950' },
  
  // Yellow colors
  { name: 'Yellow 50', value: 'yellow-50', color: 'bg-yellow-50' },
  { name: 'Yellow 100', value: 'yellow-100', color: 'bg-yellow-100' },
  { name: 'Yellow 200', value: 'yellow-200', color: 'bg-yellow-200' },
  { name: 'Yellow 300', value: 'yellow-300', color: 'bg-yellow-300' },
  { name: 'Yellow 400', value: 'yellow-400', color: 'bg-yellow-400' },
  { name: 'Yellow 500', value: 'yellow-500', color: 'bg-yellow-500' },
  { name: 'Yellow 600', value: 'yellow-600', color: 'bg-yellow-600' },
  { name: 'Yellow 700', value: 'yellow-700', color: 'bg-yellow-700' },
  { name: 'Yellow 800', value: 'yellow-800', color: 'bg-yellow-800' },
  { name: 'Yellow 900', value: 'yellow-900', color: 'bg-yellow-900' },
  { name: 'Yellow 950', value: 'yellow-950', color: 'bg-yellow-950' },
  
  // Lime colors
  { name: 'Lime 50', value: 'lime-50', color: 'bg-lime-50' },
  { name: 'Lime 100', value: 'lime-100', color: 'bg-lime-100' },
  { name: 'Lime 200', value: 'lime-200', color: 'bg-lime-200' },
  { name: 'Lime 300', value: 'lime-300', color: 'bg-lime-300' },
  { name: 'Lime 400', value: 'lime-400', color: 'bg-lime-400' },
  { name: 'Lime 500', value: 'lime-500', color: 'bg-lime-500' },
  { name: 'Lime 600', value: 'lime-600', color: 'bg-lime-600' },
  { name: 'Lime 700', value: 'lime-700', color: 'bg-lime-700' },
  { name: 'Lime 800', value: 'lime-800', color: 'bg-lime-800' },
  { name: 'Lime 900', value: 'lime-900', color: 'bg-lime-900' },
  { name: 'Lime 950', value: 'lime-950', color: 'bg-lime-950' },
  
  // Green colors
  { name: 'Green 50', value: 'green-50', color: 'bg-green-50' },
  { name: 'Green 100', value: 'green-100', color: 'bg-green-100' },
  { name: 'Green 200', value: 'green-200', color: 'bg-green-200' },
  { name: 'Green 300', value: 'green-300', color: 'bg-green-300' },
  { name: 'Green 400', value: 'green-400', color: 'bg-green-400' },
  { name: 'Green 500', value: 'green-500', color: 'bg-green-500' },
  { name: 'Green 600', value: 'green-600', color: 'bg-green-600' },
  { name: 'Green 700', value: 'green-700', color: 'bg-green-700' },
  { name: 'Green 800', value: 'green-800', color: 'bg-green-800' },
  { name: 'Green 900', value: 'green-900', color: 'bg-green-900' },
  { name: 'Green 950', value: 'green-950', color: 'bg-green-950' },
  
  // Emerald colors
  { name: 'Emerald 50', value: 'emerald-50', color: 'bg-emerald-50' },
  { name: 'Emerald 100', value: 'emerald-100', color: 'bg-emerald-100' },
  { name: 'Emerald 200', value: 'emerald-200', color: 'bg-emerald-200' },
  { name: 'Emerald 300', value: 'emerald-300', color: 'bg-emerald-300' },
  { name: 'Emerald 400', value: 'emerald-400', color: 'bg-emerald-400' },
  { name: 'Emerald 500', value: 'emerald-500', color: 'bg-emerald-500' },
  { name: 'Emerald 600', value: 'emerald-600', color: 'bg-emerald-600' },
  { name: 'Emerald 700', value: 'emerald-700', color: 'bg-emerald-700' },
  { name: 'Emerald 800', value: 'emerald-800', color: 'bg-emerald-800' },
  { name: 'Emerald 900', value: 'emerald-900', color: 'bg-emerald-900' },
  { name: 'Emerald 950', value: 'emerald-950', color: 'bg-emerald-950' },
  
  // Teal colors
  { name: 'Teal 50', value: 'teal-50', color: 'bg-teal-50' },
  { name: 'Teal 100', value: 'teal-100', color: 'bg-teal-100' },
  { name: 'Teal 200', value: 'teal-200', color: 'bg-teal-200' },
  { name: 'Teal 300', value: 'teal-300', color: 'bg-teal-300' },
  { name: 'Teal 400', value: 'teal-400', color: 'bg-teal-400' },
  { name: 'Teal 500', value: 'teal-500', color: 'bg-teal-500' },
  { name: 'Teal 600', value: 'teal-600', color: 'bg-teal-600' },
  { name: 'Teal 700', value: 'teal-700', color: 'bg-teal-700' },
  { name: 'Teal 800', value: 'teal-800', color: 'bg-teal-800' },
  { name: 'Teal 900', value: 'teal-900', color: 'bg-teal-900' },
  { name: 'Teal 950', value: 'teal-950', color: 'bg-teal-950' },
  
  // Cyan colors
  { name: 'Cyan 50', value: 'cyan-50', color: 'bg-cyan-50' },
  { name: 'Cyan 100', value: 'cyan-100', color: 'bg-cyan-100' },
  { name: 'Cyan 200', value: 'cyan-200', color: 'bg-cyan-200' },
  { name: 'Cyan 300', value: 'cyan-300', color: 'bg-cyan-300' },
  { name: 'Cyan 400', value: 'cyan-400', color: 'bg-cyan-400' },
  { name: 'Cyan 500', value: 'cyan-500', color: 'bg-cyan-500' },
  { name: 'Cyan 600', value: 'cyan-600', color: 'bg-cyan-600' },
  { name: 'Cyan 700', value: 'cyan-700', color: 'bg-cyan-700' },
  { name: 'Cyan 800', value: 'cyan-800', color: 'bg-cyan-800' },
  { name: 'Cyan 900', value: 'cyan-900', color: 'bg-cyan-900' },
  { name: 'Cyan 950', value: 'cyan-950', color: 'bg-cyan-950' },
  
  // Sky colors
  { name: 'Sky 50', value: 'sky-50', color: 'bg-sky-50' },
  { name: 'Sky 100', value: 'sky-100', color: 'bg-sky-100' },
  { name: 'Sky 200', value: 'sky-200', color: 'bg-sky-200' },
  { name: 'Sky 300', value: 'sky-300', color: 'bg-sky-300' },
  { name: 'Sky 400', value: 'sky-400', color: 'bg-sky-400' },
  { name: 'Sky 500', value: 'sky-500', color: 'bg-sky-500' },
  { name: 'Sky 600', value: 'sky-600', color: 'bg-sky-600' },
  { name: 'Sky 700', value: 'sky-700', color: 'bg-sky-700' },
  { name: 'Sky 800', value: 'sky-800', color: 'bg-sky-800' },
  { name: 'Sky 900', value: 'sky-900', color: 'bg-sky-900' },
  { name: 'Sky 950', value: 'sky-950', color: 'bg-sky-950' },
  
  // Blue colors
  { name: 'Blue 50', value: 'blue-50', color: 'bg-blue-50' },
  { name: 'Blue 100', value: 'blue-100', color: 'bg-blue-100' },
  { name: 'Blue 200', value: 'blue-200', color: 'bg-blue-200' },
  { name: 'Blue 300', value: 'blue-300', color: 'bg-blue-300' },
  { name: 'Blue 400', value: 'blue-400', color: 'bg-blue-400' },
  { name: 'Blue 500', value: 'blue-500', color: 'bg-blue-500' },
  { name: 'Blue 600', value: 'blue-600', color: 'bg-blue-600' },
  { name: 'Blue 700', value: 'blue-700', color: 'bg-blue-700' },
  { name: 'Blue 800', value: 'blue-800', color: 'bg-blue-800' },
  { name: 'Blue 900', value: 'blue-900', color: 'bg-blue-900' },
  { name: 'Blue 950', value: 'blue-950', color: 'bg-blue-950' },
  
  // Indigo colors
  { name: 'Indigo 50', value: 'indigo-50', color: 'bg-indigo-50' },
  { name: 'Indigo 100', value: 'indigo-100', color: 'bg-indigo-100' },
  { name: 'Indigo 200', value: 'indigo-200', color: 'bg-indigo-200' },
  { name: 'Indigo 300', value: 'indigo-300', color: 'bg-indigo-300' },
  { name: 'Indigo 400', value: 'indigo-400', color: 'bg-indigo-400' },
  { name: 'Indigo 500', value: 'indigo-500', color: 'bg-indigo-500' },
  { name: 'Indigo 600', value: 'indigo-600', color: 'bg-indigo-600' },
  { name: 'Indigo 700', value: 'indigo-700', color: 'bg-indigo-700' },
  { name: 'Indigo 800', value: 'indigo-800', color: 'bg-indigo-800' },
  { name: 'Indigo 900', value: 'indigo-900', color: 'bg-indigo-900' },
  { name: 'Indigo 950', value: 'indigo-950', color: 'bg-indigo-950' },
  
  // Violet colors
  { name: 'Violet 50', value: 'violet-50', color: 'bg-violet-50' },
  { name: 'Violet 100', value: 'violet-100', color: 'bg-violet-100' },
  { name: 'Violet 200', value: 'violet-200', color: 'bg-violet-200' },
  { name: 'Violet 300', value: 'violet-300', color: 'bg-violet-300' },
  { name: 'Violet 400', value: 'violet-400', color: 'bg-violet-400' },
  { name: 'Violet 500', value: 'violet-500', color: 'bg-violet-500' },
  { name: 'Violet 600', value: 'violet-600', color: 'bg-violet-600' },
  { name: 'Violet 700', value: 'violet-700', color: 'bg-violet-700' },
  { name: 'Violet 800', value: 'violet-800', color: 'bg-violet-800' },
  { name: 'Violet 900', value: 'violet-900', color: 'bg-violet-900' },
  { name: 'Violet 950', value: 'violet-950', color: 'bg-violet-950' },
  
  // Purple colors
  { name: 'Purple 50', value: 'purple-50', color: 'bg-purple-50' },
  { name: 'Purple 100', value: 'purple-100', color: 'bg-purple-100' },
  { name: 'Purple 200', value: 'purple-200', color: 'bg-purple-200' },
  { name: 'Purple 300', value: 'purple-300', color: 'bg-purple-300' },
  { name: 'Purple 400', value: 'purple-400', color: 'bg-purple-400' },
  { name: 'Purple 500', value: 'purple-500', color: 'bg-purple-500' },
  { name: 'Purple 600', value: 'purple-600', color: 'bg-purple-600' },
  { name: 'Purple 700', value: 'purple-700', color: 'bg-purple-700' },
  { name: 'Purple 800', value: 'purple-800', color: 'bg-purple-800' },
  { name: 'Purple 900', value: 'purple-900', color: 'bg-purple-900' },
  { name: 'Purple 950', value: 'purple-950', color: 'bg-purple-950' },
  
  // Fuchsia colors
  { name: 'Fuchsia 50', value: 'fuchsia-50', color: 'bg-fuchsia-50' },
  { name: 'Fuchsia 100', value: 'fuchsia-100', color: 'bg-fuchsia-100' },
  { name: 'Fuchsia 200', value: 'fuchsia-200', color: 'bg-fuchsia-200' },
  { name: 'Fuchsia 300', value: 'fuchsia-300', color: 'bg-fuchsia-300' },
  { name: 'Fuchsia 400', value: 'fuchsia-400', color: 'bg-fuchsia-400' },
  { name: 'Fuchsia 500', value: 'fuchsia-500', color: 'bg-fuchsia-500' },
  { name: 'Fuchsia 600', value: 'fuchsia-600', color: 'bg-fuchsia-600' },
  { name: 'Fuchsia 700', value: 'fuchsia-700', color: 'bg-fuchsia-700' },
  { name: 'Fuchsia 800', value: 'fuchsia-800', color: 'bg-fuchsia-800' },
  { name: 'Fuchsia 900', value: 'fuchsia-900', color: 'bg-fuchsia-900' },
  { name: 'Fuchsia 950', value: 'fuchsia-950', color: 'bg-fuchsia-950' },
  
  // Pink colors
  { name: 'Pink 50', value: 'pink-50', color: 'bg-pink-50' },
  { name: 'Pink 100', value: 'pink-100', color: 'bg-pink-100' },
  { name: 'Pink 200', value: 'pink-200', color: 'bg-pink-200' },
  { name: 'Pink 300', value: 'pink-300', color: 'bg-pink-300' },
  { name: 'Pink 400', value: 'pink-400', color: 'bg-pink-400' },
  { name: 'Pink 500', value: 'pink-500', color: 'bg-pink-500' },
  { name: 'Pink 600', value: 'pink-600', color: 'bg-pink-600' },
  { name: 'Pink 700', value: 'pink-700', color: 'bg-pink-700' },
  { name: 'Pink 800', value: 'pink-800', color: 'bg-pink-800' },
  { name: 'Pink 900', value: 'pink-900', color: 'bg-pink-900' },
  { name: 'Pink 950', value: 'pink-950', color: 'bg-pink-950' },
  
  // Rose colors
  { name: 'Rose 50', value: 'rose-50', color: 'bg-rose-50' },
  { name: 'Rose 100', value: 'rose-100', color: 'bg-rose-100' },
  { name: 'Rose 200', value: 'rose-200', color: 'bg-rose-200' },
  { name: 'Rose 300', value: 'rose-300', color: 'bg-rose-300' },
  { name: 'Rose 400', value: 'rose-400', color: 'bg-rose-400' },
  { name: 'Rose 500', value: 'rose-500', color: 'bg-rose-500' },
  { name: 'Rose 600', value: 'rose-600', color: 'bg-rose-600' },
  { name: 'Rose 700', value: 'rose-700', color: 'bg-rose-700' },
  { name: 'Rose 800', value: 'rose-800', color: 'bg-rose-800' },
  { name: 'Rose 900', value: 'rose-900', color: 'bg-rose-900' },
  { name: 'Rose 950', value: 'rose-950', color: 'bg-rose-950' },
  
  // Gray colors
  { name: 'Gray 50', value: 'gray-50', color: 'bg-gray-50' },
  { name: 'Gray 100', value: 'gray-100', color: 'bg-gray-100' },
  { name: 'Gray 200', value: 'gray-200', color: 'bg-gray-200' },
  { name: 'Gray 300', value: 'gray-300', color: 'bg-gray-300' },
  { name: 'Gray 400', value: 'gray-400', color: 'bg-gray-400' },
  { name: 'Gray 500', value: 'gray-500', color: 'bg-gray-500' },
  { name: 'Gray 600', value: 'gray-600', color: 'bg-gray-600' },
  { name: 'Gray 700', value: 'gray-700', color: 'bg-gray-700' },
  { name: 'Gray 800', value: 'gray-800', color: 'bg-gray-800' },
  { name: 'Gray 900', value: 'gray-900', color: 'bg-gray-900' },
  { name: 'Gray 950', value: 'gray-950', color: 'bg-gray-950' },
  
  // Slate colors
  { name: 'Slate 50', value: 'slate-50', color: 'bg-slate-50' },
  { name: 'Slate 100', value: 'slate-100', color: 'bg-slate-100' },
  { name: 'Slate 200', value: 'slate-200', color: 'bg-slate-200' },
  { name: 'Slate 300', value: 'slate-300', color: 'bg-slate-300' },
  { name: 'Slate 400', value: 'slate-400', color: 'bg-slate-400' },
  { name: 'Slate 500', value: 'slate-500', color: 'bg-slate-500' },
  { name: 'Slate 600', value: 'slate-600', color: 'bg-slate-600' },
  { name: 'Slate 700', value: 'slate-700', color: 'bg-slate-700' },
  { name: 'Slate 800', value: 'slate-800', color: 'bg-slate-800' },
  { name: 'Slate 900', value: 'slate-900', color: 'bg-slate-900' },
  { name: 'Slate 950', value: 'slate-950', color: 'bg-slate-950' },
  
  // Zinc colors
  { name: 'Zinc 50', value: 'zinc-50', color: 'bg-zinc-50' },
  { name: 'Zinc 100', value: 'zinc-100', color: 'bg-zinc-100' },
  { name: 'Zinc 200', value: 'zinc-200', color: 'bg-zinc-200' },
  { name: 'Zinc 300', value: 'zinc-300', color: 'bg-zinc-300' },
  { name: 'Zinc 400', value: 'zinc-400', color: 'bg-zinc-400' },
  { name: 'Zinc 500', value: 'zinc-500', color: 'bg-zinc-500' },
  { name: 'Zinc 600', value: 'zinc-600', color: 'bg-zinc-600' },
  { name: 'Zinc 700', value: 'zinc-700', color: 'bg-zinc-700' },
  { name: 'Zinc 800', value: 'zinc-800', color: 'bg-zinc-800' },
  { name: 'Zinc 900', value: 'zinc-900', color: 'bg-zinc-900' },
  { name: 'Zinc 950', value: 'zinc-950', color: 'bg-zinc-950' },
  
  // Neutral colors
  { name: 'Neutral 50', value: 'neutral-50', color: 'bg-neutral-50' },
  { name: 'Neutral 100', value: 'neutral-100', color: 'bg-neutral-100' },
  { name: 'Neutral 200', value: 'neutral-200', color: 'bg-neutral-200' },
  { name: 'Neutral 300', value: 'neutral-300', color: 'bg-neutral-300' },
  { name: 'Neutral 400', value: 'neutral-400', color: 'bg-neutral-400' },
  { name: 'Neutral 500', value: 'neutral-500', color: 'bg-neutral-500' },
  { name: 'Neutral 600', value: 'neutral-600', color: 'bg-neutral-600' },
  { name: 'Neutral 700', value: 'neutral-700', color: 'bg-neutral-700' },
  { name: 'Neutral 800', value: 'neutral-800', color: 'bg-neutral-800' },
  { name: 'Neutral 900', value: 'neutral-900', color: 'bg-neutral-900' },
  { name: 'Neutral 950', value: 'neutral-950', color: 'bg-neutral-950' },
  
  // Stone colors
  { name: 'Stone 50', value: 'stone-50', color: 'bg-stone-50' },
  { name: 'Stone 100', value: 'stone-100', color: 'bg-stone-100' },
  { name: 'Stone 200', value: 'stone-200', color: 'bg-stone-200' },
  { name: 'Stone 300', value: 'stone-300', color: 'bg-stone-300' },
  { name: 'Stone 400', value: 'stone-400', color: 'bg-stone-400' },
  { name: 'Stone 500', value: 'stone-500', color: 'bg-stone-500' },
  { name: 'Stone 600', value: 'stone-600', color: 'bg-stone-600' },
  { name: 'Stone 700', value: 'stone-700', color: 'bg-stone-700' },
  { name: 'Stone 800', value: 'stone-800', color: 'bg-stone-800' },  
  { name: 'Stone 900', value: 'stone-900', color: 'bg-stone-900' },
  { name: 'Stone 950', value: 'stone-950', color: 'bg-stone-950' }
];

const menuWidthOptions = [
  { name: 'Small (240px)', value: '240px' },
  { name: 'Medium (280px)', value: '280px' },
  { name: 'Large (320px)', value: '320px' },
  { name: 'Extra Large (360px)', value: '360px' }
];

export default function SettingsFormFields({ 
  settings, 
  onChange, 
  onImageUpload, 
  uploadingImages,
  isNarrow = false
}: SettingsFormFieldsProps) {
  // Helper function to get grid classes based on narrow state
  const getGridClasses = (columns: number = 2) => {
    if (isNarrow) {
      return 'grid grid-cols-1 gap-3';
    }
    if (columns === 3) {
      return 'grid grid-cols-1 md:grid-cols-3 gap-3';
    }
    return 'grid grid-cols-1 md:grid-cols-2 gap-3';
  };

  const ColorSelect = ({ 
    label, 
    name, 
    value, 
    onChange 
  }: { 
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  }) => {
    const selectedColor = colorOptions.find(c => c.value === value) || colorOptions[0];
    
    const handleSelectionChange = (newValue: string) => {
      // Create a synthetic event to maintain compatibility
      const syntheticEvent = {
        target: {
          name,
          value: newValue,
          type: 'select-one'
        }
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    };

    return (
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-gray-700 mb-2">{label}</label>
        <div className="relative">
          <Listbox value={value} onChange={handleSelectionChange}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white border border-gray-200 py-2.5 pl-3 pr-8 text-left shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full border border-white shadow-sm ${selectedColor.color}`}></div>
                  <span className="block truncate text-sm font-medium text-gray-900">{selectedColor.name}</span>
                </div>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              
              <Transition
                as={React.Fragment}
                leave="transition ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                  {colorOptions.map((color) => (
                    <Listbox.Option
                      key={color.value}
                      className={({ active, selected }) =>
                        `relative cursor-pointer select-none py-2 pl-3 pr-8 transition-colors duration-200 ${
                          active ? 'bg-sky-50 text-sky-900' : 'text-gray-900'
                        } ${selected ? 'bg-sky-100/60' : ''}`
                      }
                      value={color.value}
                    >
                      {({ selected, active }) => (
                        <>
                          <div className="flex items-center space-x-2">
                            <div className={`w-4 h-4 rounded-full border border-white shadow-sm ${color.color} ${
                              selected ? 'ring-2 ring-sky-400 ring-offset-1' : ''
                            }`}></div>
                            <span className={`block truncate text-sm ${
                              selected ? 'font-semibold text-sky-900' : 'font-medium text-gray-900'
                            }`}>
                              {color.name}
                            </span>
                          </div>
                          {selected && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-sky-600">
                              <CheckIcon className="h-4 w-4" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onChange(name as keyof Settings, checked);
    } else if (type === 'number') {
      onChange(name as keyof Settings, parseInt(value, 10) || 0);
    } else if (name === 'supported_locales') {
      // Convert comma-separated string to array for supported_locales
      const localesArray = value.split(',').map(locale => locale.trim()).filter(locale => locale.length > 0);
      onChange(name as keyof Settings, localesArray);
    } else {
      onChange(name as keyof Settings, value);
    }
  };

  const ImageUploadField = ({ 
    label, 
    field, 
    value 
  }: { 
    label: string;
    field: 'image' | 'favicon' | 'hero_image';
    value: string | null;
  }) => (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-gray-700">{label}</label>
      
      {/* Upload Area */}
      <div className="relative">
        {value ? (
          <div className="relative group">
            <div className="w-full h-28 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:border-sky-300 group-hover:shadow-lg">
              <img 
                src={value} 
                alt={label} 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => onImageUpload(field)}
                disabled={uploadingImages.has(field)}
                className="px-3 py-1.5 bg-white/95 text-gray-800 rounded-lg text-xs font-semibold hover:bg-white transition-all duration-300 shadow-lg backdrop-blur-sm"
              >
                {uploadingImages.has(field) ? 'Uploading...' : 'Replace'}
              </button>
              <button
                type="button"
                onClick={() => onChange(field, null)}
                className="px-3 py-1.5 bg-red-500/95 text-white rounded-lg text-xs font-semibold hover:bg-red-500 transition-all duration-300 shadow-lg backdrop-blur-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onImageUpload(field)}
            disabled={uploadingImages.has(field)}
            className="w-full h-28 bg-gradient-to-br from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 border border-dashed border-sky-200 hover:border-sky-300 rounded-xl flex flex-col items-center justify-center space-y-2 transition-all duration-300 group hover:shadow-lg"
          >
            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center group-hover:bg-sky-200 transition-all duration-300 group-hover:scale-110">
              <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <span className="block text-xs font-semibold text-sky-700 group-hover:text-sky-600 transition-colors duration-300">
                {uploadingImages.has(field) ? 'Uploading...' : `Upload ${label}`}
              </span>
              <span className="block text-xs text-sky-500 mt-0.5 group-hover:text-sky-400 transition-colors duration-300">
                Click to browse files
              </span>
            </div>
          </button>
        )}
      </div>
      
      {/* URL Input */}
      {value && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-xs font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
          placeholder="Or paste image URL"
        />
      )}
    </div>
  );

  // Disclosure Section Component
  const DisclosureSection = ({ 
    title, 
    children, 
    defaultOpen = false 
  }: { 
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }) => (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open }) => (
        <div className={`group bg-white rounded-xl border transition-all duration-500 ${
          open 
            ? 'border-sky-200 shadow-lg shadow-sky-100/20 ring-1 ring-sky-100' 
            : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
        }`}>
          <Disclosure.Button className={`flex w-full items-center justify-between p-3 text-left transition-all duration-300 rounded-xl ${
            open 
              ? 'bg-gradient-to-r from-sky-50/50 to-blue-50/30' 
              : 'hover:bg-gray-50/50'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                open 
                  ? 'bg-sky-500 shadow-sm shadow-sky-200' 
                  : 'bg-gray-300 group-hover:bg-gray-400'
              }`} />
              <h3 className={`text-sm font-semibold tracking-tight transition-colors duration-300 ${
                open 
                  ? 'text-sky-900' 
                  : 'text-gray-900 group-hover:text-gray-700'
              }`}>
                {title}
              </h3>
            </div>
            <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
              open 
                ? 'bg-sky-100 text-sky-600' 
                : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600'
            }`}>
              <ChevronRightIcon
                className={`h-3 w-3 transition-transform duration-300 ${
                  open ? 'rotate-90' : ''
                }`}
              />
            </div>
          </Disclosure.Button>
          <Transition
            enter="transition duration-500 ease-out"
            enterFrom="transform scale-98 opacity-0 -translate-y-2"
            enterTo="transform scale-100 opacity-100 translate-y-0"
            leave="transition duration-300 ease-in"
            leaveFrom="transform scale-100 opacity-100 translate-y-0"
            leaveTo="transform scale-98 opacity-0 -translate-y-2"
          >
            <Disclosure.Panel className="px-3 pb-4 space-y-4">
              <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent opacity-50" />
              {children}
            </Disclosure.Panel>
          </Transition>
        </div>
      )}
    </Disclosure>
  );

  return (
    <div className="space-y-3">
      {/* Basic Information */}
      <DisclosureSection title="Basic Information" defaultOpen={true}>
        <div className={getGridClasses()}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Site Title</label>
            <input
              type="text"
              name="site"
              value={settings.site || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
              placeholder="Enter your site title"
            />
          </div>
        </div>

        <div className={getGridClasses()}>
          <div className="space-y-2">
            <ColorSelect
              label="Primary Color"
              name="primary_color"
              value={settings.primary_color || 'sky-500'}
              onChange={handleInputChange}
            />
          </div>

          <div className="space-y-2">
            <ColorSelect
              label="Secondary Color"
              name="secondary_color"
              value={settings.secondary_color || 'gray-500'}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </DisclosureSection>

      {/* Layout & Design */}
      <DisclosureSection title="Layout & Design">
        <div className={getGridClasses()}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Header Style</label>
            <select
              name="header_style"
              value={settings.header_style || 'default'}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md appearance-none cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="minimal">Minimal</option>
              <option value="centered">Centered</option>
              <option value="sidebar">Sidebar</option>
            </select>
          </div>

          <div className="space-y-2">
            <ColorSelect
              label="Footer Color"
              name="footer_color"
              value={settings.footer_color || 'gray-500'}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className={getGridClasses()}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Menu Width</label>
            <select
              name="menu_width"
              value={settings.menu_width || '280px'}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md appearance-none cursor-pointer"
            >
              {menuWidthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Font Family</label>
            <input
              type="text"
              name="font_family"
              value={settings.font_family || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
              placeholder="e.g., SF Pro Display, Inter, Arial"
            />
          </div>
        </div>
      </DisclosureSection>

      {/* Images */}
      <DisclosureSection title="Images">
        <div className={getGridClasses(3)}>
          <ImageUploadField 
            label="Logo" 
            field="image" 
            value={settings.image || null} 
          />
          <ImageUploadField 
            label="Favicon" 
            field="favicon" 
            value={settings.favicon || null} 
          />
          <ImageUploadField 
            label="Hero Image" 
            field="hero_image" 
            value={settings.hero_image || null} 
          />
        </div>
      </DisclosureSection>

      {/* SEO & Analytics */}
      <DisclosureSection title="SEO & Analytics">
        <div className={getGridClasses()}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">SEO Title</label>
            <input
              type="text"
              name="seo_title"
              value={settings.seo_title || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
              placeholder="Page title for search engines"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Google Analytics ID</label>
            <input
              type="text"
              name="google_analytics_id"
              value={settings.google_analytics_id || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
              placeholder="GA-XXXXXXXXX-X"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Google Tag Manager ID</label>
            <input
              type="text"
              name="google_tag"
              value={settings.google_tag || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
              placeholder="GTM-XXXXXXX"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700 mb-2">SEO Description</label>
          <textarea
            name="seo_description"
            value={settings.seo_description || ''}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md resize-none"
            placeholder="Meta description for search engines"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700 mb-2">SEO Keywords</label>
          <textarea
            name="seo_keywords"
            value={settings.seo_keywords || ''}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md resize-none"
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>
      </DisclosureSection>

      {/* Language & Localization */}
      <DisclosureSection title="Language & Localization">
        <div className={getGridClasses()}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Default Language</label>
            <input
              type="text"
              name="language"
              value={settings.language || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
              placeholder="e.g., en"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Supported Languages</label>
            <input
              type="text"
              name="supported_locales"
              value={Array.isArray(settings.supported_locales) ? settings.supported_locales.join(',') : (settings.supported_locales || '')}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
              placeholder="e.g., en,es,fr"
            />
          </div>
        </div>

        <div className="flex items-center bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-xl p-3 hover:from-sky-100 hover:to-blue-100 hover:border-sky-200 transition-all duration-300 group">
          <input
            type="checkbox"
            id="with_language_switch"
            name="with_language_switch"
            checked={settings.with_language_switch || false}
            onChange={handleInputChange}
            className="h-4 w-4 text-sky-500 focus:ring-sky-500/30 border-sky-300 rounded transition-all duration-300 bg-white shadow-sm"
          />
          <label htmlFor="with_language_switch" className="ml-3 text-xs font-semibold text-sky-900 cursor-pointer group-hover:text-sky-800 transition-colors duration-300">
            Enable Language Switcher
          </label>
        </div>
      </DisclosureSection>

      {/* Contact Information */}
      <DisclosureSection title="Contact Information">
        <div className={getGridClasses()}>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Contact Email</label>
            <input
              type="email"
              name="contact_email"
              value={settings.contact_email || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
              placeholder="contact@yoursite.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Contact Phone</label>
            <input
              type="tel"
              name="contact_phone"
              value={settings.contact_phone || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all duration-300 text-sm font-normal shadow-sm hover:border-gray-300 hover:shadow-md"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </DisclosureSection>
    </div>
  );
}

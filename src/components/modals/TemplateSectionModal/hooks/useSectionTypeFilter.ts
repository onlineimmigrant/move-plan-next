/**
 * useSectionTypeFilter - Search/filter for section types
 */

import { useState, useMemo } from 'react';
import {
  HomeIcon,
  BuildingOfficeIcon,
  NewspaperIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChatBubbleBottomCenterTextIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

export interface SectionTypeOption {
  value: 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans' | 'team' | 'testimonials' | 'appointment' | 'form_harmony' | 'comparison';
  label: string;
  description: string;
  shortDescription?: string;
  icon: any;
  color: string;
}

export const SECTION_TYPE_OPTIONS: SectionTypeOption[] = [
  {
    value: 'general',
    label: 'General',
    description: 'Flexible section for any content',
    shortDescription: 'Flexible content',
    icon: HomeIcon,
    color: 'gray',
  },
  {
    value: 'reviews',
    label: 'Reviews',
    description: 'Customer reviews and ratings',
    shortDescription: 'Customer reviews',
    icon: StarIcon,
    color: 'amber',
  },
  {
    value: 'help_center',
    label: 'Help Center',
    description: 'Support articles and guides',
    shortDescription: 'Support & guides',
    icon: QuestionMarkCircleIcon,
    color: 'indigo',
  },
  {
    value: 'real_estate',
    label: 'Real Estate',
    description: 'Property listings and details',
    shortDescription: 'Property listings',
    icon: BuildingOfficeIcon,
    color: 'green',
  },
  {
    value: 'brand',
    label: 'Brands',
    description: 'Showcase brand logos and partners',
    shortDescription: 'Brand logos',
    icon: BuildingOfficeIcon,
    color: 'purple',
  },
  {
    value: 'article_slider',
    label: 'Article Slider',
    description: 'Horizontal scrolling articles',
    shortDescription: 'Scrolling articles',
    icon: NewspaperIcon,
    color: 'orange',
  },
  {
    value: 'contact',
    label: 'Contact',
    description: 'Contact form and information',
    shortDescription: 'Contact form',
    icon: EnvelopeIcon,
    color: 'pink',
  },
  {
    value: 'faq',
    label: 'FAQ',
    description: 'Frequently asked questions',
    shortDescription: 'Questions & answers',
    icon: ChatBubbleBottomCenterTextIcon,
    color: 'blue',
  },
  {
    value: 'pricing_plans',
    label: 'Pricing Plans',
    description: 'Product pricing cards',
    shortDescription: 'Pricing cards',
    icon: CurrencyDollarIcon,
    color: 'yellow',
  },
  {
    value: 'team',
    label: 'Team Members',
    description: 'Display team member profiles',
    shortDescription: 'Team profiles',
    icon: UserGroupIcon,
    color: 'teal',
  },
  {
    value: 'testimonials',
    label: 'Testimonials',
    description: 'Customer testimonials and ratings',
    shortDescription: 'Customer testimonials',
    icon: ChatBubbleLeftRightIcon,
    color: 'rose',
  },
  {
    value: 'appointment',
    label: 'Appointment',
    description: 'Embedded booking system for appointments',
    shortDescription: 'Booking system',
    icon: CalendarIcon,
    color: 'cyan',
  },
  {
    value: 'form_harmony',
    label: 'Form Harmony',
    description: 'Custom forms with conditional logic and analytics',
    shortDescription: 'Custom forms',
    icon: ClipboardDocumentListIcon,
    color: 'violet',
  },
  {
    value: 'comparison',
    label: 'Comparison',
    description: 'Compare pricing and features with competitors',
    shortDescription: 'Competitor comparison',
    icon: TableCellsIcon,
    color: 'emerald',
  },
];

export function useSectionTypeFilter() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return SECTION_TYPE_OPTIONS;

    const query = searchQuery.toLowerCase();
    return SECTION_TYPE_OPTIONS.filter(option =>
      option.label.toLowerCase().includes(query) ||
      option.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredOptions,
  };
}

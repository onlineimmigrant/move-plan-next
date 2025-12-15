/**
 * SectionTypeRenderer Component
 * Handles rendering of specialized section types
 * Cleaner alternative to large switch statements
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for heavy section components
const FormHarmonySection = dynamic(() => import('@/components/TemplateSections/FormHarmonySection'), {
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
});
const FeedbackAccordion = dynamic(() => import('@/components/TemplateSections/FeedbackAccordion'));
const HelpCenterSection = dynamic(() => import('@/components/TemplateSections/HelpCenterSection'));
const RealEstateModal = dynamic(() => import('@/components/TemplateSections/RealEstateModal').then(mod => ({ default: mod.RealEstateModal })));
const BlogPostSlider = dynamic(() => import('@/components/TemplateSections/BlogPostSlider'));
const ContactForm = dynamic(() => import('@/components/contact/ContactForm'));
const BrandsSection = dynamic(() => import('@/components/TemplateSections/BrandsSection'));
const FAQSectionWrapper = dynamic(() => import('@/components/TemplateSections/FAQSectionWrapper'));
const PricingPlansSectionWrapper = dynamic(() => import('@/components/TemplateSections/PricingPlansSectionWrapper'));
const TeamMember = dynamic(() => import('@/components/TemplateSections/TeamMember'));
const Testimonials = dynamic(() => import('@/components/TemplateSections/Testimonials'));
const AppointmentSection = dynamic(() => import('@/components/TemplateSections/AppointmentSection'));

interface SectionTypeRendererProps {
  sectionType?: string;
  section: any;
  children?: React.ReactNode;
}

// Mapping object for cleaner section type rendering
const SECTION_TYPE_MAP: Record<string, React.ComponentType<any>> = {
  reviews: () => <FeedbackAccordion type="all_products" />,
  help_center: ({ section }) => <HelpCenterSection section={section} />,
  real_estate: () => <RealEstateModal />,
  brand: ({ section }) => <BrandsSection section={section} />,
  article_slider: ({ section }) => <BlogPostSlider backgroundColor={section.background_color} />,
  contact: () => <ContactForm />,
  faq: ({ section }) => <FAQSectionWrapper section={section} />,
  pricing_plans: ({ section }) => <PricingPlansSectionWrapper section={section} />,
  appointment: ({ section }) => <AppointmentSection section={section} />,
  team: ({ section }) => <TeamMember section={section} />,
  testimonials: ({ section }) => <Testimonials section={section} />,
  form_harmony: ({ section }) => {
    if (!section.form_id) {
      return (
        <div className="text-center text-gray-500 py-8">
          <p>No form selected. Please configure this section in the admin panel.</p>
        </div>
      );
    }
    return <FormHarmonySection formId={section.form_id} />;
  },
};

export const SectionTypeRenderer: React.FC<SectionTypeRendererProps> = ({ 
  sectionType, 
  section,
  children 
}) => {
  // If sectionType is 'general' or undefined, render children (general content)
  if (!sectionType || sectionType === 'general') {
    return <>{children}</>;
  }

  // Get the component from the map
  const SectionComponent = SECTION_TYPE_MAP[sectionType];
  
  if (!SectionComponent) {
    // Fallback to general content for unknown types
    return <>{children}</>;
  }

  // Render the specialized section component
  return <SectionComponent section={section} />;
};

export default SectionTypeRenderer;

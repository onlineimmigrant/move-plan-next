'use client';

import { Suspense } from 'react';
import ContactForm from '@/components/contact/ContactForm';
import { createPageMetadata } from '@/lib/metadata-utils';
import { useContactTranslations } from '@/components/contact/useContactTranslations';

export default function ContactPage() {
  const { t } = useContactTranslations();
  
  return (
    <div className=" container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mt-24 mb-8">{t.contactUs}</h1>
      <Suspense fallback={<div>{t.loading}</div>}>
        <ContactForm />
      </Suspense>
    </div>
  );
}

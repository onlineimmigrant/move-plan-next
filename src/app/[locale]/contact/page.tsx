import { Suspense } from 'react';
import ContactForm from '@/components/ContactForm';
import { createPageMetadata } from '@/lib/metadata-utils';

export async function generateMetadata() {
  // =============================================== 
  // CONTACT PAGE METADATA - HUMAN READABLE FORMAT
  // ===============================================
  // Page: /contact
  // Purpose: Contact form and business inquiries
  // Data source: /src/lib/page-metadata-definitions.ts
  // ===============================================
  return await createPageMetadata('/contact');
}

export default function ContactPage() {
  return (
    <div className=" container mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold my-16">Contact Us</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ContactForm />
      </Suspense>
    </div>
  );
}

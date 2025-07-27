import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HelpCenterPage from '@/components/HelpCenter/HelpCenterPage';
import { getSupportedLocales, DEFAULT_SUPPORTED_LOCALES } from '@/lib/language-utils';

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  
  return {
    title: 'Help Center - Support & Knowledge Base',
    description: 'Find answers to your questions, browse our knowledge base, and get the support you need.',
    openGraph: {
      title: 'Help Center - Support & Knowledge Base',
      description: 'Find answers to your questions, browse our knowledge base, and get the support you need.',
      type: 'website',
    },
  };
}

export async function generateStaticParams() {
  return DEFAULT_SUPPORTED_LOCALES.map((locale: string) => ({ locale }));
}

export default async function HelpCenter({ params }: Props) {
  const { locale } = await params;
  const supportedLocales = getSupportedLocales();
  
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  return <HelpCenterPage locale={locale} />;
}

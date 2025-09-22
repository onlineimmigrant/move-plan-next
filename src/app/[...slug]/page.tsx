import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default async function RootCatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  const slugPath = slug.join('/');
  
  // Redirect to the English version with locale prefix
  // This ensures the [locale]/[slug]/page.tsx route handles the post
  redirect(`/en/${slugPath}`);
}

export const dynamic = 'force-dynamic';

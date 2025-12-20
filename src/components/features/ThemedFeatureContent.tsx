// src/components/features/ThemedFeatureContent.tsx
'use client';

import parse from 'html-react-parser';
import { BeakerIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function ThemedFeatureContent({ content, description }: { content: string; description?: string }) {
  const themeColors = useThemeColors();

  if (!content && !description) {
    return (
      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md p-12 sm:p-16 mb-20 text-center transition-all duration-500 animate-in fade-in slide-in-from-bottom-3 delay-150">
        <div className="inline-flex p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full mb-6">
          <BeakerIcon className="w-16 h-16 text-gray-400" />
        </div>
        <h3 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold text-gray-900 mb-4 tracking-tight">Content Coming Soon</h3>
        <p className="text-gray-600 text-[clamp(1rem,2vw,1.125rem)] font-light tracking-wide max-w-2xl mx-auto leading-relaxed">
          We're currently preparing detailed information about this feature. Check back soon for comprehensive documentation and guides.
        </p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl shadow-sm hover:shadow-md p-8 sm:p-12 mb-20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-3 delay-150">
      <div 
        className="prose prose-2xl max-w-none text-gray-700 leading-relaxed prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:tracking-[-0.02em] prose-p:font-normal prose-p:leading-[1.8] prose-p:tracking-normal prose-a:no-underline hover:prose-a:underline prose-a:transition-all"
        style={{
          '--tw-prose-links': themeColors.cssVars.primary.base,
        } as React.CSSProperties}
      >
        {parse(description || content || '')}
      </div>
    </section>
  );
}

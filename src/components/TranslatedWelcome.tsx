'use client';

import { useTranslations } from 'next-intl';

export default function TranslatedWelcome() {
  const t = useTranslations('hero');

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-blue-900 mb-4">
        {t('welcome')}
      </h2>
      <p className="text-blue-700 mb-4">
        {t('description')}
      </p>
      <div className="flex gap-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
          {t('getStarted')}
        </button>
        <button className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition-colors">
          {t('learnMore')}
        </button>
      </div>
    </div>
  );
}

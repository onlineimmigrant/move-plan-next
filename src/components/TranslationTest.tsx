'use client';

import { useTranslations } from 'next-intl';

export default function TranslationTest() {
  const t = useTranslations();

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <h3 className="font-bold text-lg mb-2">Translation Test Debug</h3>
      <div className="space-y-2">
        <p><strong>frequentlyAskedQuestions:</strong> "{t('frequentlyAskedQuestions')}"</p>
        <p><strong>findAnswersToCommonQuestions:</strong> "{t('findAnswersToCommonQuestions')}"</p>
        <p><strong>searchThroughFAQDatabase:</strong> "{t('searchThroughFAQDatabase')}"</p>
        <p><strong>getStarted:</strong> "{t('getStarted')}"</p>
        <p><strong>explore:</strong> "{t('explore')}"</p>
      </div>
    </div>
  );
}

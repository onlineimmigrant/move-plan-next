import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useFAQs } from './hooks/useFAQs';
import { useArticles } from './hooks/useArticles';
import { useFeatures } from './hooks/useFeatures';
import { usePricingPlans } from './hooks/usePricingPlans';

interface HelpCenterNavBadgesProps {
  activeTab?: 'all' | 'faq' | 'articles' | 'features' | 'offerings' | 'none';
  translations: {
    all?: string;
    faqs: string;
    articles: string;
    features: string;
    offerings: string;
  };
  onNavigate?: (tab: string) => void;
  customHandlers?: {
    onAllClick?: () => void;
    onFAQClick?: () => void;
    onArticlesClick?: () => void;
    onFeaturesClick?: () => void;
    onOfferingsClick?: () => void;
  };
  showAllBadge?: boolean;
}

export const HelpCenterNavBadges: React.FC<HelpCenterNavBadgesProps> = ({ 
  activeTab = 'none', 
  translations: t, 
  onNavigate, 
  customHandlers,
  showAllBadge = false 
}) => {
  const themeColors = useThemeColors();
  const { faqs } = useFAQs();
  const { articles } = useArticles();
  const { features } = useFeatures();
  const { pricingPlans } = usePricingPlans();

  const allBadge = showAllBadge ? [{
    key: 'all',
    label: t.all || 'All',
    count: faqs.length + articles.length + features.length + pricingPlans.length,
    tab: 'all',
    onClick: customHandlers?.onAllClick
  }] : [];

  const badges = [
    ...allBadge,
    {
      key: 'faq',
      label: t.faqs,
      count: faqs.length,
      tab: 'faq',
      onClick: customHandlers?.onFAQClick
    },
    {
      key: 'articles',
      label: t.articles,
      count: articles.length,
      tab: 'articles',
      onClick: customHandlers?.onArticlesClick
    },
    {
      key: 'features',
      label: t.features,
      count: features.length,
      tab: 'features',
      onClick: customHandlers?.onFeaturesClick
    },
    {
      key: 'offerings',
      label: t.offerings,
      count: pricingPlans.length,
      tab: 'offerings',
      onClick: customHandlers?.onOfferingsClick
    }
  ];

  const handleClick = (badge: typeof badges[0]) => {
    if (badge.onClick) {
      badge.onClick();
    } else if (onNavigate) {
      onNavigate(badge.tab);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 max-w-full">
        {badges.map((badge) => {
          const isActive = activeTab === badge.key;
          
          return (
            <button
              key={badge.key}
              onClick={() => !isActive && handleClick(badge)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2"
              style={{
                backgroundColor: isActive 
                  ? themeColors.cssVars.primary.base 
                  : 'white',
                color: isActive 
                  ? 'white' 
                  : themeColors.cssVars.primary.base,
                border: `1px solid ${isActive ? themeColors.cssVars.primary.base : themeColors.cssVars.primary.light}40`,
                cursor: isActive ? 'default' : 'pointer'
              }}
            >
              <span>{badge.label}</span>
              <span 
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: isActive 
                    ? 'rgba(255, 255, 255, 0.25)' 
                    : `${themeColors.cssVars.primary.lighter}60`,
                  color: isActive 
                    ? 'white' 
                    : themeColors.cssVars.primary.hover,
                }}
              >
                {badge.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

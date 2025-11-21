import { usePathname } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';

// Pricing modal translation interface
export interface PricingTranslations {
  monthly: string;
  annual: string;
  compareAllFeatures: string;
  seeEverythingIncluded: string;
  features: string;
  mostPopular: string;
  limitedTimeOffer: string;
  viewMore: string;
  viewLess: string;
  buyNow: string;
  getStarted: string;
}

// Static translations for pricing modal
export const PRICINGPLAN_TRANSLATIONS: Record<string, PricingTranslations> = {
  en: { 
    monthly: 'Monthly',
    annual: 'Annual',
    compareAllFeatures: 'Compare all features',
    seeEverythingIncluded: 'See everything that\'s included in each plan',
    features: 'Features',
    mostPopular: 'Most popular',
    limitedTimeOffer: 'Limited Time Offer',
    viewMore: 'View more',
    viewLess: 'View less',
    buyNow: 'Buy Now',
    getStarted: 'Get Started'
  },
  es: { 
    monthly: 'Mensual',
    annual: 'Anual',
    compareAllFeatures: 'Comparar todas las características',
    seeEverythingIncluded: 'Ve todo lo que está incluido en cada plan',
    features: 'Características',
    mostPopular: 'Más popular',
    limitedTimeOffer: 'Oferta por tiempo limitado',
    viewMore: 'Ver más',
    viewLess: 'Ver menos',
    buyNow: 'Comprar ahora',
    getStarted: 'Comenzar'
  },
  fr: { 
    monthly: 'Mensuel',
    annual: 'Annuel',
    compareAllFeatures: 'Comparer toutes les fonctionnalités',
    seeEverythingIncluded: 'Voir tout ce qui est inclus dans chaque plan',
    features: 'Fonctionnalités',
    mostPopular: 'Le plus populaire',
    limitedTimeOffer: 'Offre à durée limitée',
    viewMore: 'Voir plus',
    viewLess: 'Voir moins',
    buyNow: 'Acheter maintenant',
    getStarted: 'Commencer'
  },
  de: { 
    monthly: 'Monatlich',
    annual: 'Jährlich',
    compareAllFeatures: 'Alle Funktionen vergleichen',
    seeEverythingIncluded: 'Sehen Sie alles, was in jedem Plan enthalten ist',
    features: 'Funktionen',
    mostPopular: 'Am beliebtesten',
    limitedTimeOffer: 'Zeitlich begrenztes Angebot',
    viewMore: 'Mehr anzeigen',
    viewLess: 'Weniger anzeigen',
    buyNow: 'Jetzt kaufen',
    getStarted: 'Loslegen'
  },
  ru: { 
    monthly: 'Ежемесячно',
    annual: 'Ежегодно',
    compareAllFeatures: 'Сравнить все функции',
    seeEverythingIncluded: 'Посмотрите все, что включено в каждый план',
    features: 'Функции',
    mostPopular: 'Популярный',
    limitedTimeOffer: 'Ограниченное по времени предложение',
    viewMore: 'Показать больше',
    viewLess: 'Показать меньше',
    buyNow: 'Купить сейчас',
    getStarted: 'Начать'
  },
  it: { 
    monthly: 'Mensile',
    annual: 'Annuale',
    compareAllFeatures: 'Confronta tutte le funzionalità',
    seeEverythingIncluded: 'Vedi tutto ciò che è incluso in ogni piano',
    features: 'Funzionalità',
    mostPopular: 'Popolare',
    limitedTimeOffer: 'Offerta a tempo limitato',
    viewMore: 'Vedi di più',
    viewLess: 'Vedi meno',
    buyNow: 'Acquista ora',
    getStarted: 'Inizia'
  },
  pt: { 
    monthly: 'Mensal',
    annual: 'Anual',
    compareAllFeatures: 'Compare todos os recursos',
    seeEverythingIncluded: 'Veja tudo o que está incluído em cada plano',
    features: 'Recursos',
    mostPopular: 'Popular',
    limitedTimeOffer: 'Oferta por tempo limitado',
    viewMore: 'Ver mais',
    viewLess: 'Ver menos',
    buyNow: 'Comprar agora',
    getStarted: 'Começar'
  },
  pl: { 
    monthly: 'Miesięczny',
    annual: 'Roczny',
    compareAllFeatures: 'Porównaj wszystkie funkcje',
    seeEverythingIncluded: 'Zobacz wszystko, co jest zawarte w każdym planie',
    features: 'Funkcje',
    mostPopular: 'Najpopularniejszy',
    limitedTimeOffer: 'Oferta ograniczona czasowo',
    viewMore: 'Zobacz więcej',
    viewLess: 'Zobacz mniej',
    buyNow: 'Kup teraz',
    getStarted: 'Rozpocznij'
  },
  zh: { 
    monthly: '每月',
    annual: '每年',
    compareAllFeatures: '比较所有功能',
    seeEverythingIncluded: '查看每个计划包含的所有内容',
    features: '功能',
    mostPopular: '最受欢迎',
    limitedTimeOffer: '限时优惠',
    viewMore: '查看更多',
    viewLess: '查看更少',
    buyNow: '立即购买',
    getStarted: '开始使用'
  },
  ja: { 
    monthly: '月額',
    annual: '年額',
    compareAllFeatures: 'すべての機能を比較',
    seeEverythingIncluded: '各プランに含まれるすべてを確認',
    features: '機能',
    mostPopular: '最も人気',
    limitedTimeOffer: '期間限定オファー',
    viewMore: 'もっと見る',
    viewLess: '少なく表示',
    buyNow: '今すぐ購入',
    getStarted: '開始する'
  }
};

// Hook to get translations based on current locale
export function usePricingTranslations() {
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Extract locale from pathname (e.g., /en/page -> en)
  const pathLocale = pathname.split('/')[1];
  
  // Use path locale if valid, otherwise fall back to application's default language, then English
  const defaultLanguage = settings?.language || 'en';
  const currentLocale = (pathLocale && PRICINGPLAN_TRANSLATIONS[pathLocale as keyof typeof PRICINGPLAN_TRANSLATIONS]) 
    ? pathLocale 
    : defaultLanguage;
  
  // Get translations for current locale or fallback to English
  const translations = PRICINGPLAN_TRANSLATIONS[currentLocale as keyof typeof PRICINGPLAN_TRANSLATIONS] || PRICINGPLAN_TRANSLATIONS.en;
  
  return {
    ...translations,
    currentLocale,
    hasTranslations: true
  };
}

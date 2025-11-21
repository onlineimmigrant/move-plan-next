/*
 * Advanced Product Pricing Linking System
 * 
 * This PricingModal component now supports advanced URL-based product linking:
 * 
 * URL Formats:
 * - /#pricing                    -> Opens modal with first available product
 * - /#pricing#product_name       -> Opens modal with specific product (by name)
 * - /#pricing#product_id         -> Opens modal with specific product (by ID)
 * - /#pricing#product_slug       -> Opens modal with specific product (by slug)
 * 
 * Examples:
 * - /#pricing#basic_plan         -> Selects product with name "Basic Plan"
 * - /#pricing#123                -> Selects product with ID 123
 * - /#pricing#premium_package    -> Selects product with name "Premium Package"
 * 
 * Product Name Conversion:
 * Product names are converted to URL-safe identifiers by:
 * 1. Converting to lowercase
 * 2. Replacing non-alphanumeric characters with underscores
 * 3. Removing duplicate underscores
 * 4. Trimming underscores from start/end
 * 
 * Fallback Logic:
 * 1. Try to match by converted product name
 * 2. Try to match by product ID
 * 3. Try to match by product slug
 * 4. Fall back to first product if no matches found
 */

"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon as XMarkIconSmall } from '@heroicons/react/20/solid';
import { useSettings } from '@/context/SettingsContext';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';
import { detectUserCurrency, getPriceForCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency';
import PricingModalProductBadges from '@/components/PricingModalProductBadges';
import { PricingComparisonProduct } from '@/types/product';
import { PricingPlan } from '@/types/pricingplan';

// Utility function to generate product-specific pricing URLs (can be used externally)
export function generateProductPricingUrl(product: PricingComparisonProduct, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  const productIdentifier = product.product_name ? 
    product.product_name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') : 
    product.id.toString();
  return `${base}#pricing#${productIdentifier}`;
}

// Utility function to generate basic pricing URL
export function generateBasicPricingUrl(baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');
  return `${base}#pricing`;
}

// Feature interface for pricing modal
interface Feature {
  id: string;
  name: string;
  content: string;
  slug: string;
  type: 'features' | 'modules' | 'support';
  order: number;
}

// Static translations for pricing modal
const PRICINGPLAN_TRANSLATIONS = {
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

interface SamplePricingPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  buttonVariant: 'primary' | 'secondary';
  monthlyRecurringCount: number;
  annualRecurringCount: number;
  actualAnnualPrice?: number; // For real data: the actual annual plan price
  annualSizeDiscount?: number; // New field for annual discount percentage
  planId?: number; // Plan ID for feature lookup
  realFeatures?: Feature[]; // Real feature objects with full data
  productSlug?: string; // Product slug for linking to product page
  order: number; // Order field for sorting plans
  isPromotion?: boolean; // Promotion flag
  promotionPrice?: number; // Promotional price
  monthlyPromotionPrice?: number; // Monthly promotional price
  annualPromotionPrice?: number; // Annual promotional price
  currencySymbol?: string; // Currency symbol for monthly price
  annualCurrencySymbol?: string; // Currency symbol for annual price
}

interface PricingComparison {
  id: number;
  created_at: string;
  name: string;
  description: string;
  name_translation: Record<string, string>;
  description_translation: Record<string, string>;
  organization_id: number;
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pricingComparison?: PricingComparison | null;
}

// Hook to get translations based on current locale
function usePricingTranslations() {
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

// No more sample data - using real database content only

// Helper function to get all unique features across all plans
const getAllFeatures = (plans: SamplePricingPlan[]): string[] => {
  const allFeatures = plans.flatMap(plan => plan.features);
  return [...new Set(allFeatures)];
};

// Helper function to check if a plan has a feature (including inherited features)
const planHasFeature = (planIndex: number, feature: string, plans: SamplePricingPlan[]): boolean => {
  // Check if current plan has the feature
  if (plans[planIndex].features.includes(feature)) {
    return true;
  }
  
  // Check if any lower-tier plan has this feature (inheritance)
  for (let i = 0; i < planIndex; i++) {
    if (plans[i].features.includes(feature)) {
      return true;
    }
  }
  
  return false;
};

// Helper function to get all unique features from real feature data, grouped by type
const getAllFeaturesGroupedByType = (plans: SamplePricingPlan[]): { [type: string]: Feature[] } => {
  const featuresMap: { [type: string]: Feature[] } = {};
  
  plans.forEach(plan => {
    if (plan.realFeatures && plan.realFeatures.length > 0) {
      plan.realFeatures.forEach(feature => {
        const featureType = feature.type || 'features'; // Default to 'features' if no type
        if (!featuresMap[featureType]) {
          featuresMap[featureType] = [];
        }
        
        // Add feature if not already in the group (avoid duplicates)
        if (!featuresMap[featureType].some(f => f.id === feature.id)) {
          featuresMap[featureType].push(feature);
        }
      });
    }
  });
  
  // Sort features within each type group by their order field
  Object.keys(featuresMap).forEach(type => {
    featuresMap[type].sort((a, b) => (a.order || 999) - (b.order || 999));
  });
  
  return featuresMap;
};

// Helper function to check if a plan has a specific real feature (with inheritance)
const planHasRealFeature = (plan: SamplePricingPlan, feature: Feature, allPlans: SamplePricingPlan[]): boolean => {
  // Check if current plan has the feature directly
  if (plan.realFeatures?.some(f => f.id === feature.id)) {
    return true;
  }
  
  // Check inheritance: if any cheaper plan has this feature, this plan inherits it
  // Sort plans by price (ascending) to establish hierarchy
  const sortedPlans = [...allPlans].sort((a, b) => a.monthlyPrice - b.monthlyPrice);
  const currentPlanIndex = sortedPlans.findIndex(p => p.name === plan.name);
  
  // Check if any plan with lower or equal price has this feature
  for (let i = 0; i <= currentPlanIndex; i++) {
    const lowerPlan = sortedPlans[i];
    if (lowerPlan.realFeatures?.some(f => f.id === feature.id)) {
      return true;
    }
  }
  
  return false;
};

export default function PricingModal({ isOpen, onClose, pricingComparison }: PricingModalProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PricingComparisonProduct | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<Record<number, Feature[]>>({});
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [initialProductIdentifier, setInitialProductIdentifier] = useState<string | null>(null);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const translations = usePricingTranslations();
  const pathname = usePathname();
  const { settings } = useSettings();
  
  // Get current locale for content translations
  const currentLocale = getLocaleFromPathname(pathname);

  // Detect user currency when pricing plans are loaded
  useEffect(() => {
    // Only detect currency after pricing plans are loaded for smart base currency detection
    if (pricingPlans.length > 0) {
      const detectedCurrency = detectUserCurrency(undefined, undefined, pricingPlans);
      setUserCurrency(detectedCurrency);
      
      // Set currency symbol based on detected currency
      const currencySymbols: Record<string, string> = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'PLN': 'zł',
        'RUB': '₽'
      };
      setCurrencySymbol(currencySymbols[detectedCurrency] || '$');
    }
  }, [pricingPlans]); // Depend on pricingPlans to re-run when they're loaded

  // Parse URL fragment to extract product identifier
  const parseProductFromHash = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const hash = window.location.hash;
    // Support formats: #pricing#product_name, #pricing#product_id, or just #pricing
    const hashParts = hash.split('#').filter(Boolean);
    
    if (hashParts.length >= 2 && hashParts[0] === 'pricing') {
      return hashParts[1]; // Return the product identifier
    }
    
    return null;
  }, []);

  // Update URL hash when product changes
  const updateUrlHash = useCallback((product?: PricingComparisonProduct | null) => {
    if (typeof window === 'undefined') return;
    
    const baseHash = '#pricing';
    let newHash = baseHash;
    
    if (product) {
      // Use product name as identifier, fallback to ID
      const productIdentifier = product.product_name ? 
        product.product_name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') : 
        product.id.toString();
      newHash = `${baseHash}#${productIdentifier}`;
    }
    
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
    }
  }, []);

  // Generate pricing link for a specific product (utility function for external use)
  const generateProductPricingLink = useCallback((product: PricingComparisonProduct, baseUrl?: string) => {
    const base = baseUrl || window.location.origin + window.location.pathname;
    const productIdentifier = product.product_name ? 
      product.product_name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') : 
      product.id.toString();
    return `${base}#pricing#${productIdentifier}`;
  }, []);

  // Helper function to remove pricing hash from URL
  const removePricingHash = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const hash = window.location.hash;
    const hashParts = hash.split('#').filter(Boolean);
    
    // Remove hash if it starts with 'pricing'
    if (hashParts.length > 0 && hashParts[0] === 'pricing') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Handle product selection with URL update
  const handleProductSelect = useCallback((product: PricingComparisonProduct) => {
    setSelectedProduct(product);
    updateUrlHash(product);
    // console.log('Selected product in pricing modal:', product);
  }, [updateUrlHash]);

  // Fetch pricing plans when selected product changes
  useEffect(() => {
    const fetchPricingPlans = async () => {
      if (!settings?.organization_id) return;
      
      setIsLoadingPlans(true);
      
      try {
        const productParam = selectedProduct?.id ? `&productId=${selectedProduct.id}` : '';
        const currencyParam = `&currency=${userCurrency}`;
        const url = `/api/pricing-comparison?organizationId=${encodeURIComponent(settings.organization_id)}&type=plans${productParam}${currencyParam}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-currency': userCurrency,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setPricingPlans(data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error fetching pricing plans:', errorData);
          setPricingPlans([]);
        }
      } catch (error) {
        console.error('Network error fetching pricing plans:', error);
        setPricingPlans([]);
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPricingPlans();
  }, [settings?.organization_id, selectedProduct?.id, userCurrency]);

  // Fetch features for pricing plans when they change
  useEffect(() => {
    const fetchFeaturesForPlans = async () => {
      if (!pricingPlans.length || !settings?.organization_id) return;
      
      setIsLoadingFeatures(true);
      const featuresMap: Record<number, Feature[]> = {};
      
      try {
        // Fetch features for each pricing plan
        for (const plan of pricingPlans) {
          const url = `/api/pricingplan-features?planId=${plan.id}&organizationId=${encodeURIComponent(settings.organization_id)}`;

          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const features = await response.json();
            featuresMap[plan.id] = features;

          } else {
            console.error(`Error fetching features for plan ${plan.id}:`, await response.json().catch(() => ({})));
            featuresMap[plan.id] = [];
          }
        }
        
        setPlanFeatures(featuresMap);
      } catch (error) {
        console.error('Network error fetching features:', error);
        setPlanFeatures({});
      } finally {
        setIsLoadingFeatures(false);
      }
    };

    fetchFeaturesForPlans();
  }, [pricingPlans, settings?.organization_id]);

  // Transform real pricing plans into display format
  const transformPricingPlans = (plans: PricingPlan[]): SamplePricingPlan[] => {
    if (!plans || plans.length === 0) return []; // Return empty array when no plans available
    
    // Group plans by product and create monthly/annual pairs
    const plansByProduct: { [key: string]: { monthly?: PricingPlan; annual?: PricingPlan } } = {};
    
    plans.forEach(plan => {
      // Skip null or undefined plans
      if (!plan) return;
      
      const productKey = plan.package || `Product ${plan.product_id}`;
      if (!plansByProduct[productKey]) {
        plansByProduct[productKey] = {};
      }
      
      if (plan.recurring_interval === 'month') {
        plansByProduct[productKey].monthly = plan;
      } else if (plan.recurring_interval === 'year') {
        plansByProduct[productKey].annual = plan;
      }
    });
    
    const transformedPlans = Object.entries(plansByProduct).map(([productName, { monthly, annual }], index) => {
      // Get currency-aware prices using our utility function
      const monthlyPriceResult = getPriceForCurrency(monthly, userCurrency);
      const annualPriceResult = getPriceForCurrency(annual, userCurrency);
      
      // Use currency-aware prices or fallback to raw price (legacy system uses actual currency units)
      const monthlyPrice = monthlyPriceResult?.price ?? (monthly?.price || 0);
      const monthlyPriceSymbol = monthlyPriceResult?.symbol || currencySymbol;
      
      // Calculate annual price with priority:
      // 1. Use annual plan's monthly_price_calculated if available
      // 2. Calculate from monthly price using annual_size_discount if available
      // 3. Fallback to monthly price
      let annualPrice = monthlyPrice;
      let actualAnnualPrice = undefined;
      let annualPriceSymbol = monthlyPriceSymbol;
      
      if (annual?.monthly_price_calculated) {
        // Direct annual plan exists - use currency-aware pricing
        annualPrice = annualPriceResult?.price ?? (annual?.price || monthlyPrice);
        annualPriceSymbol = annualPriceResult?.symbol || currencySymbol;
        actualAnnualPrice = annualPrice ? parseFloat((annualPrice * (annual.recurring_interval_count || 12)).toFixed(2)) : undefined;
      } else if (monthly?.annual_size_discount && monthly.annual_size_discount > 0) {
        // Calculate annual price from monthly using discount
        const discountMultiplier = (100 - monthly.annual_size_discount) / 100;
        annualPrice = parseFloat((monthlyPrice * discountMultiplier).toFixed(2));
        actualAnnualPrice = parseFloat((annualPrice * 12).toFixed(2)); // Calculate actual annual total
        annualPriceSymbol = monthlyPriceSymbol; // Use same symbol
      }
      
      // Get features for this plan
      const planId = monthly?.id || annual?.id;
      const realFeatures = planId ? (planFeatures[planId] || []) : [];

      // Handle promotion pricing with currency awareness
      const monthlyIsPromotion = monthly?.is_promotion && (monthly?.promotion_price !== undefined || monthly?.promotion_percent !== undefined);
      const annualIsPromotion = annual?.is_promotion && (annual?.promotion_price !== undefined || annual?.promotion_percent !== undefined);
      
      let monthlyPromotionPrice = undefined;
      let annualPromotionPrice = undefined;
      
      if (monthlyIsPromotion) {
        if (monthly?.promotion_percent !== undefined) {
          // Calculate promotion price from percentage of the converted price
          monthlyPromotionPrice = parseFloat((monthlyPrice * (1 - monthly.promotion_percent / 100)).toFixed(2));
          console.log('🔴 Monthly promotion from PERCENT:', monthlyPromotionPrice, 'base price:', monthlyPrice, 'percent:', monthly.promotion_percent);
        } else if (monthly?.promotion_price !== undefined) {
          // TEMP FIX: Try using promotion_price directly without any division
          // This assumes promotion_price is already in the correct currency units
          monthlyPromotionPrice = monthly.promotion_price;
          console.log('🔴 Monthly promotion from PRICE (no division):', monthlyPromotionPrice, 'original promotion_price:', monthly.promotion_price);
        }
      }
      
      if (annualIsPromotion) {
        if (annual?.promotion_percent !== undefined) {
          // Calculate promotion price from percentage of the converted price
          annualPromotionPrice = parseFloat((annualPrice * (1 - annual.promotion_percent / 100)).toFixed(2));
          console.log('🔴 Annual promotion from PERCENT:', annualPromotionPrice, 'base price:', annualPrice, 'percent:', annual.promotion_percent);
        } else if (annual?.promotion_price !== undefined) {
          // TEMP FIX: Try using promotion_price directly without any division
          // This assumes promotion_price is already in the correct currency units
          annualPromotionPrice = annual.promotion_price;
          console.log('🔴 Annual promotion from PRICE (no division):', annualPromotionPrice, 'original promotion_price:', annual.promotion_price);
        }
      } else if (monthlyIsPromotion && monthlyPromotionPrice !== undefined && monthly?.annual_size_discount && monthly.annual_size_discount > 0) {
        // Calculate annual promotion price from monthly promotion using discount
        const discountMultiplier = (100 - monthly.annual_size_discount) / 100;
        annualPromotionPrice = parseFloat((monthlyPromotionPrice * discountMultiplier).toFixed(2));
      }

      return {
        name: productName,
        monthlyPrice: parseFloat(monthlyPrice.toFixed(2)),
        annualPrice: parseFloat(annualPrice.toFixed(2)),
        period: '/month',
        description: monthly?.description || annual?.description || '',
        features: [], // Will be populated after sorting and filtering
        buttonText: monthly?.type === 'one_time' ? 'Buy Now' : 'Get Started', // Will be translated in render
        // Add currency information
        currencySymbol: monthlyPriceSymbol,
        annualCurrencySymbol: annualPriceSymbol,
        // Add recurring interval data for total calculation
        monthlyRecurringCount: monthly?.recurring_interval_count || 1,
        annualRecurringCount: annual?.recurring_interval_count || 1,
        // Add the actual annual plan price for correct total calculation (already converted from cents)
        actualAnnualPrice,
        // Add discount information for display
        annualSizeDiscount: monthly?.annual_size_discount || annual?.annual_size_discount || 0,
        // Store the actual plan ID and features for feature comparison table
        planId: planId || 0,
        realFeatures: realFeatures || [],
        // Add product slug for linking to product page
        productSlug: monthly?.product?.slug || annual?.product?.slug || '',
        // Store the order for sorting
        order: monthly?.order_number || annual?.order_number || 999, // Default to 999 if no order specified
        // Promotion fields
        isPromotion: monthlyIsPromotion || annualIsPromotion,
        promotionPrice: monthlyIsPromotion ? monthlyPromotionPrice : annualIsPromotion ? annualPromotionPrice : undefined,
        monthlyPromotionPrice,
        annualPromotionPrice,
      };
    }).sort((a, b) => a.order - b.order);

    // After sorting, filter features to exclude cheapest plan features from higher tier plans
    const sortedPlans = transformedPlans.map((plan, sortedIndex) => {
      const cheapestPlan = transformedPlans[0]; // First plan after sorting by price
      const cheapestPlanFeatures = cheapestPlan.realFeatures || [];
      
      // For the cheapest plan, show all its features
      // For higher tier plans, exclude features that exist in the cheapest plan
      let filteredFeatures: Feature[] = [];
      if (sortedIndex === 0) {
        // Cheapest plan - show all features
        filteredFeatures = plan.realFeatures || [];
      } else {
        // Higher tier plans - exclude cheapest plan features
        filteredFeatures = (plan.realFeatures || []).filter(feature => 
          !cheapestPlanFeatures.some(cheapFeature => cheapFeature.id === feature.id)
        );
      }

      // Convert to display format with feature names
      const displayFeatures = filteredFeatures.map(feature => feature.name);

      return {
        ...plan,
        features: displayFeatures,
        realFeatures: filteredFeatures, // Update real features to match filtered features
        highlighted: sortedIndex === 1, // Highlight the second plan after sorting
        buttonVariant: (sortedIndex === 1 ? 'primary' : 'secondary') as 'primary' | 'secondary',
      };
    });

    return sortedPlans;
  };

  const displayPlans = transformPricingPlans(pricingPlans);

  // Check if any plans are one-time payments to hide annual/monthly toggle
  const hasOneTimePlans = pricingPlans.some(plan => plan.type === 'one_time');

  // Get translated title and description
  const getTranslatedTitle = () => {
    if (!pricingComparison) return "Choose the plan that's right for you.";
    // Use the translation system with fallback to 'en' when currentLocale is null
    const localeToUse = currentLocale || 'en';
    return getTranslatedMenuContent(pricingComparison.name, pricingComparison.name_translation, localeToUse);
  };

  const getTranslatedDescription = () => {
    if (!pricingComparison) return "Cancel or change plans anytime. No hidden fees, no surprises.";
    // Use the translation system with fallback to 'en' when currentLocale is null
    const localeToUse = currentLocale || 'en';
    return getTranslatedMenuContent(pricingComparison.description, pricingComparison.description_translation, localeToUse);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      
      // Capture the initial product identifier from URL hash when modal opens
      const productIdentifier = parseProductFromHash();
      setInitialProductIdentifier(productIdentifier);
      
      if (productIdentifier) {
        // console.log('PricingModal: Detected product identifier in URL:', productIdentifier);
      } else {
        // console.log('PricingModal: No product identifier in URL, will use default');
      }
      
      // Update URL hash when modal opens (if no specific product is targeted)
      const currentHash = window.location.hash;
      const hashParts = currentHash.split('#').filter(Boolean);
      
      if (hashParts.length === 0 || (hashParts.length === 1 && hashParts[0] !== 'pricing')) {
        // No hash or incorrect hash, set to #pricing
        window.history.replaceState(null, '', window.location.pathname + window.location.search + '#pricing');
      } else if (hashParts.length === 1 && hashParts[0] === 'pricing') {
        // Just #pricing, leave as is for now (will be updated when product is selected)
      }
      // If hashParts.length >= 2, we already have a product identifier, keep it as is
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, parseProductFromHash]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => {
          onClose();
          // Remove hash when clicking backdrop
          removePricingHash();
        }}
        aria-hidden="true"
      />
      
      {/* Modal - Full Screen */}
      <div className="relative h-full w-full flex">
        <div className="relative bg-white w-full h-full overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="relative bg-white px-6 py-6 sm:px-8 sm:py-8 flex-shrink-0 border-b border-gray-100">
            <button
              onClick={() => {
                onClose();
                // Remove hash when clicking close button
                removePricingHash();
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50"
              aria-label="Close pricing modal"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            
            <div className="text-center max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-4xl font-extralight tracking-tight mb-3 sm:mb-4 text-gray-700 leading-tight">
                {getTranslatedTitle()}
              </h2>
              <p className="hidden sm:block text-base sm:text-lg font-light text-gray-500 leading-relaxed mb-6 max-w-2xl mx-auto">
                {getTranslatedDescription()}
              </p>
              
              {/* Product Selection Badges */}
              <div className="mb-4 sm:mb-6">
                <PricingModalProductBadges
                  onProductSelect={handleProductSelect}
                  selectedProductId={selectedProduct?.id}
                  initialProductIdentifier={initialProductIdentifier}
                />
              </div>
              
              {/* Pricing Toggle - Only show for recurring plans */}
              {!hasOneTimePlans && (
                <div className="flex justify-center">
                  <div className="relative bg-gray-50/70 p-0.5 rounded-full border border-gray-200/50 backdrop-blur-sm">
                    <div className={` ${
                      isAnnual ? 'transform translate-x-full' : 'transform translate-x-0'
                    }`}></div>
                    <button 
                      onClick={() => setIsAnnual(false)}
                      className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ease-out ${
                        !isAnnual 
                          ? 'text-gray-700 bg-white shadow-sm border border-gray-200/60' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {translations.monthly}
                    </button>
                    <button 
                      onClick={() => setIsAnnual(true)}
                      className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ease-out ${
                        isAnnual 
                          ? 'text-gray-700 bg-white shadow-sm border border-gray-200/60' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {translations.annual}
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                        %
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white px-6 py-6 sm:px-8 sm:py-8 overflow-y-auto">
            


            {/* Pricing Cards - Smaller on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-4xl xl:max-w-5xl mx-auto mb-20">
              {isLoadingPlans ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative bg-white rounded-3xl border border-gray-200 shadow-sm p-8 animate-pulse"
                  >
                    <div className="text-center mb-8">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-100 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded mb-8"></div>
                      <div className="h-12 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                displayPlans.map((plan, index) => (
                <div
                  key={plan.name}
                  className={`relative bg-white rounded-3xl border transition-all hover:shadow-xl group ${
                    plan.highlighted
                      ? 'border-gray-400 shadow-lg ring-1 ring-gray-400/10'
                      : 'border-gray-200 shadow-sm hover:border-gray-300'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gray-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                        {translations.mostPopular}
                      </span>
                    </div>
                  )}

                  <div className="p-8">
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-gray-500 mb-2 font-light text-sm leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                      
                      {/* Discount Badge - Above Price (with consistent height) - Only for recurring plans */}
                      <div className="flex justify-center mb-4 h-7">
                        {!hasOneTimePlans && isAnnual && (
                          <span className="bg-gradient-to-r from-sky-500 to-sky-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                            Save {plan.annualSizeDiscount && plan.annualSizeDiscount > 0 
                              ? Math.round(plan.annualSizeDiscount)
                              : Math.round(((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100)
                            }%
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-baseline justify-center mb-8">
                        {plan.isPromotion ? (
                          <div className="flex flex-col items-center">
                            {/* Original price crossed out */}
                            <span className="text-sm text-sky-500 line-through mr-2">
                              {(isAnnual ? plan.annualCurrencySymbol : plan.currencySymbol) || currencySymbol}{hasOneTimePlans ? plan.monthlyPrice.toFixed(2) : (isAnnual ? plan.annualPrice.toFixed(2) : plan.monthlyPrice.toFixed(2))}
                            </span>
                            {/* Promotional price - same style as normal prices */}
                            <span className="text-4xl font-extralight text-gray-700">
                                {(isAnnual ? plan.annualCurrencySymbol : plan.currencySymbol) || currencySymbol}{hasOneTimePlans 
                                  ? (plan.monthlyPromotionPrice || plan.monthlyPrice).toFixed(2) 
                                  : (isAnnual ? (plan.annualPromotionPrice || plan.annualPrice).toFixed(2) : (plan.monthlyPromotionPrice || plan.monthlyPrice).toFixed(2))
                                }
                            </span>
                            {/* Limited Time Offer text */}
                            <span className="text-xs text-gray-400 font-medium mt-1">
                              {translations.limitedTimeOffer}
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="text-4xl font-extralight text-gray-700">
                              {(isAnnual ? plan.annualCurrencySymbol : plan.currencySymbol) || currencySymbol}{hasOneTimePlans ? plan.monthlyPrice.toFixed(2) : (isAnnual ? plan.annualPrice.toFixed(2) : plan.monthlyPrice.toFixed(2))}
                            </span>
                            {!hasOneTimePlans && (
                              <span className="text-sm text-gray-500 ml-1 font-light">
                                {plan.period}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Total Recurring Amount - Only for recurring plans */}
                      {!hasOneTimePlans && (
                        <div className="text-center mb-4">
                          <span className="text-xs text-gray-400 font-light">
                            {isAnnual ? (
                              // For annual: use promotion price if available, otherwise regular price
                              plan.actualAnnualPrice ? 
                                <>Total annual: {plan.annualCurrencySymbol || currencySymbol}{plan.actualAnnualPrice.toFixed(2)}</> :
                                plan.isPromotion && plan.annualPromotionPrice ?
                                  <>Total annual: {plan.annualCurrencySymbol || currencySymbol}{(plan.annualPromotionPrice * 12).toFixed(2)}</> :
                                  <>Total annual: {plan.annualCurrencySymbol || currencySymbol}{(plan.annualPrice * 12).toFixed(2)}</>
                            ) : (
                              plan.isPromotion && plan.monthlyPromotionPrice ?
                                <>Total monthly: {plan.currencySymbol || currencySymbol}{(plan.monthlyPromotionPrice * plan.monthlyRecurringCount).toFixed(2)}</> :
                                <>Total monthly: {plan.currencySymbol || currencySymbol}{(plan.monthlyPrice * plan.monthlyRecurringCount).toFixed(2)}</>
                            )}
                          </span>
                        </div>
                      )}

                      <Link
                        href={plan.productSlug ? `/products/${plan.productSlug}` : '#'}
                        className={`inline-block w-full py-3.5 px-6 rounded-full font-medium text-sm transition-all group-hover:scale-[1.02] text-center ${
                          plan.buttonVariant === 'primary'
                            ? 'bg-gray-800 text-white hover:bg-gray-900'
                            : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {plan.buttonText === 'Buy Now' ? translations.buyNow : translations.getStarted}
                      </Link>
                    </div>

                    <div className="space-y-4">
                      <ul className="space-y-3">
                        {isLoadingFeatures ? (
                          // Loading skeleton for features
                          Array.from({ length: 4 }).map((_, featureIndex) => (
                            <li key={featureIndex} className="flex items-start animate-pulse">
                              <div className="h-4 w-4 bg-gray-200 rounded shrink-0 mt-0.5 mr-3"></div>
                              <div className="h-4 bg-gray-200 rounded w-full"></div>
                            </li>
                          ))
                        ) : (
                          (() => {
                            const maxFeatures = 7;
                            const isExpanded = expandedFeatures[plan.name] || false;
                            const featuresToShow = isExpanded ? plan.features : plan.features.slice(0, maxFeatures);
                            const hasMoreFeatures = plan.features.length > maxFeatures;

                            return (
                              <>
                                {featuresToShow.map((feature, featureIndex) => {
                                  // Check if this is a real feature with additional data
                                  const realFeature = plan.realFeatures?.find(rf => rf.name === feature);
                                  
                                  return (
                                    <li key={featureIndex} className="flex items-start">
                                      <CheckIcon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5 mr-3" />
                                      {realFeature ? (
                                        <Link
                                          href={`/features/${realFeature.slug}`}
                                          className="text-gray-600 text-sm font-light leading-relaxed hover:text-sky-600 hover:underline transition-colors"
                                        >
                                          {feature}
                                        </Link>
                                      ) : (
                                        <span className="text-gray-600 text-sm font-light leading-relaxed">
                                          {feature}
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                                
                                {/* View more/less button */}
                                {hasMoreFeatures && (
                                  <li className="flex items-start">
                                    <div className="h-4 w-4 shrink-0 mt-0.5 mr-3"></div>
                                    <button
                                      onClick={() => setExpandedFeatures(prev => ({
                                        ...prev,
                                        [plan.name]: !isExpanded
                                      }))}
                                      className="text-gray-500 text-sm font-medium hover:text-gray-700 hover:underline transition-colors flex items-center gap-1"
                                    >
                                      {isExpanded ? (
                                        <>
                                          {translations.viewLess}
                                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                          </svg>
                                        </>
                                      ) : (
                                        <>
                                          {translations.viewMore} {plan.features.length - maxFeatures}
                                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                          </svg>
                                        </>
                                      )}
                                    </button>
                                  </li>
                                )}
                              </>
                            );
                          })()
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>

            {/* Feature Comparison Table */}
            <div className="max-w-6xl mx-auto mb-20">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-extralight text-gray-700 mb-4">
                  {translations.compareAllFeatures}
                </h3>
                <p className="text-gray-500 font-light">
                  {translations.seeEverythingIncluded}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">
                          {translations.features}
                        </th>
                        {displayPlans.map((plan) => (
                          <th key={plan.name} className="text-center py-4 px-6 min-w-[120px]">
                            <div className="text-sm font-semibold text-gray-700 mb-1">
                              {plan.name}
                            </div>
                            <div className="flex flex-col items-center">
                              {plan.isPromotion ? (
                                <>
                                  {/* Original price crossed out */}
                                  <span className="text-sm text-sky-500 line-through">
                                    {(isAnnual ? plan.annualCurrencySymbol : plan.currencySymbol) || currencySymbol}{hasOneTimePlans ? plan.monthlyPrice : (isAnnual ? plan.annualPrice : plan.monthlyPrice)}
                                  </span>
                                  {/* Promotional price - same style as normal prices */}
                                  <div className="text-lg font-extralight text-gray-600">
                                    {(isAnnual ? plan.annualCurrencySymbol : plan.currencySymbol) || currencySymbol}{hasOneTimePlans 
                                      ? (plan.monthlyPromotionPrice || plan.monthlyPrice) 
                                      : (isAnnual 
                                        ? (plan.annualPromotionPrice || plan.annualPrice) 
                                        : (plan.monthlyPromotionPrice || plan.monthlyPrice)
                                      )
                                    }
                                    {!hasOneTimePlans && (
                                      <span className="text-xs text-gray-500">/mo</span>
                                    )}
                                  </div>
                                  {/* Limited Time Offer text */}
                                  <span className="text-xs text-gray-400 font-medium">
                                    {translations.limitedTimeOffer}
                                  </span>
                                </>
                              ) : (
                                <div className="text-lg font-extralight text-gray-600">
                                  {(isAnnual ? plan.annualCurrencySymbol : plan.currencySymbol) || currencySymbol}{hasOneTimePlans ? plan.monthlyPrice : (isAnnual ? plan.annualPrice : plan.monthlyPrice)}
                                  {!hasOneTimePlans && (
                                    <span className="text-xs text-gray-500">/mo</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Create grouped rows for features by type */}
                      {(() => {
                        const featuresGroupedByType = getAllFeaturesGroupedByType(displayPlans);
                        const hasRealFeatures = Object.keys(featuresGroupedByType).length > 0;
                        
                        if (!hasRealFeatures) {
                          // Fallback to old string-based features if no real features
                          return getAllFeatures(displayPlans).map((feature, index) => (
                            <tr key={feature} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                              <td className="py-4 px-6 text-sm text-gray-700 font-light">
                                {feature}
                              </td>
                              {displayPlans.map((plan, planIndex) => (
                                <td key={`${plan.name}-${feature}`} className="text-center py-4 px-6">
                                  {planHasFeature(planIndex, feature, displayPlans) ? (
                                    <CheckIcon className="h-5 w-5 text-emerald-600 mx-auto" />
                                  ) : (
                                    <XMarkIconSmall className="h-5 w-5 text-gray-300 mx-auto" />
                                  )}
                                </td>
                              ))}
                            </tr>
                          ));
                        }
                        
                        // Define the order: features (no subtitle), modules, other types, support (last)
                        const typeOrder = ['features', 'modules'];
                        const orderedTypes: string[] = [];
                        const otherTypes: string[] = [];
                        
                        // Separate types into ordered and others
                        Object.keys(featuresGroupedByType).forEach(type => {
                          if (type === 'features' || type === 'modules') {
                            if (!orderedTypes.includes(type)) {
                              orderedTypes.push(type);
                            }
                          } else if (type !== 'support') {
                            otherTypes.push(type);
                          }
                        });
                        
                        // Sort ordered types according to our preference
                        orderedTypes.sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));
                        
                        // Final order: features, modules, other types (alphabetically), support
                        const finalOrder = [
                          ...orderedTypes,
                          ...otherTypes.sort(),
                          ...(featuresGroupedByType.support ? ['support'] : [])
                        ];
                        
                        // Render features grouped by type
                        let rowIndex = 0;
                        return finalOrder.map((featureType) => {
                          const features = featuresGroupedByType[featureType];
                          if (!features || features.length === 0) return null;
                          
                          const needsSubtitle = featureType !== 'features'; // No subtitle for 'features' type
                          let typeDisplayName = '';
                          
                          if (needsSubtitle) {
                            if (featureType === 'modules') {
                              typeDisplayName = 'Modules';
                            } else if (featureType === 'support') {
                              typeDisplayName = 'Support';
                            } else {
                              typeDisplayName = featureType.charAt(0).toUpperCase() + featureType.slice(1);
                            }
                          }
                          
                          return (
                            <React.Fragment key={featureType}>
                              {/* Type header row (only if needed) */}
                              {needsSubtitle && (
                                <tr className="bg-gray-100 border-b border-gray-200">
                                  <td className="py-3 px-6 text-sm font-semibold text-gray-800" colSpan={displayPlans.length + 1}>
                                    {typeDisplayName}
                                  </td>
                                </tr>
                              )}
                              
                              {/* Features under this type */}
                              {features.map((feature) => {
                                const currentRowIndex = rowIndex++;
                                return (
                                  <tr key={feature.id} className={`border-b border-gray-100 ${currentRowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                                    <td className="py-4 px-6 text-sm text-gray-700 font-light">
                                      <Link
                                        href={`/features/${feature.slug}`}
                                        className="hover:text-blue-600 hover:underline transition-colors"
                                      >
                                        {feature.name}
                                      </Link>
                                    </td>
                                    {displayPlans.map((plan) => (
                                      <td key={`${plan.name}-${feature.id}`} className="text-center py-4 px-6">
                                        {planHasRealFeature(plan, feature, displayPlans) ? (
                                          <CheckIcon className="h-5 w-5 text-emerald-600 mx-auto" />
                                        ) : (
                                          <XMarkIconSmall className="h-5 w-5 text-gray-300 mx-auto" />
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

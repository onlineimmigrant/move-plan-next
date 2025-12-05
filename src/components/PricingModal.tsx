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

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/context/SettingsContext';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';
import { detectUserCurrency, getPriceForCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency';
import PricingModalProductBadges from '@/components/PricingModalProductBadges';
import { PricingComparisonProduct } from '@/types/product';
import { PricingPlan } from '@/types/pricingplan';
import PricingCard from '@/components/pricing/PricingCard';
import PricingComparisonTable from '@/components/pricing/PricingComparisonTable';
import { 
  generateProductPricingUrl, 
  generateBasicPricingUrl,
  parseProductFromHash,
  updatePricingHash,
  removePricingHash,
  getCurrencySymbol,
  productNameToIdentifier
} from '@/utils/pricingUtils';
import { PRICING_CONSTANTS } from '@/utils/pricingConstants';

// Re-export utility functions for external use
export { generateProductPricingUrl, generateBasicPricingUrl };

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

export default function PricingModal({ isOpen, onClose, pricingComparison }: PricingModalProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PricingComparisonProduct | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [planFeatures, setPlanFeatures] = useState<Record<string, Feature[]>>({});
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

  // Update URL hash when product changes
  const handleProductSelect = useCallback((product: PricingComparisonProduct) => {
    setSelectedProduct(product);
    updatePricingHash(product);
  }, []);

  // Fetch pricing plans when selected product changes
  useEffect(() => {
    const fetchPricingPlans = async () => {
      if (!settings?.organization_id) return;
      
      setIsLoadingPlans(true);
      
      try {
        const productParam = selectedProduct?.id ? `&productId=${selectedProduct.id}` : '';
        const currencyParam = `&currency=${userCurrency}`;
        const url = `/api/pricing-comparison?organizationId=${encodeURIComponent(settings.organization_id)}&type=plans${productParam}${currencyParam}`;
        
        console.log('[PricingModal] Fetching plans with organization_id:', settings.organization_id, 'URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-currency': userCurrency,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[PricingModal] Fetched pricing plans:', data.length, 'plans');
          console.log('[PricingModal] First plan sample:', data[0]);
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
      const featuresMap: Record<string, Feature[]> = {};
      
      try {
        // Fetch ALL features for the organization at once (more efficient than per-plan requests)
        const url = `/api/pricingplan-features?organization_id=${encodeURIComponent(settings.organization_id)}`;
        
        console.log('[PricingModal] Fetching all features for organization:', settings.organization_id);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const allFeatures = await response.json();
          console.log('[PricingModal] Fetched features:', allFeatures.length, 'total features');
          
          // Group features by pricingplan_id
          allFeatures.forEach((pf: any) => {
            const planId = pf.pricingplan_id;
            if (!featuresMap[planId]) {
              featuresMap[planId] = [];
            }
            // Extract the actual feature data
            if (pf.feature) {
              featuresMap[planId].push(pf.feature);
            }
          });
          
          console.log('[PricingModal] Grouped features by plan:', Object.keys(featuresMap).length, 'plans have features');
          console.log('[PricingModal] Sample plan IDs with features:', Object.keys(featuresMap).slice(0, 3));
        } else {
          console.error('Error fetching features:', await response.json().catch(() => ({})));
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
    console.log('[transformPricingPlans] Input plans:', plans.length);
    if (!plans || plans.length === 0) return []; // Return empty array when no plans available
    
    // For one-time plans, each plan should be its own card
    // For subscription plans, group by product to show monthly/annual options
    const plansByProduct: { [key: string]: { monthly?: PricingPlan; annual?: PricingPlan } } = {};
    
    plans.forEach(plan => {
      // Skip null or undefined plans
      if (!plan) return;
      
      // Use product name or product_id as the key to properly group plans
      // This prevents plans with the same package name but different products from overwriting each other
      const productName = plan.product?.product_name || plan.package || `Product ${plan.product_id}`;
      
      // For one-time purchases, create a unique key for each plan using the plan ID
      // For subscription plans (month/year), group by product
      let productKey: string;
      if (plan.recurring_interval === 'month' || plan.recurring_interval === 'year') {
        // Subscription plans: group by product
        productKey = `${plan.product_id}_${productName}`;
      } else {
        // One-time plans: each plan gets its own card
        productKey = `${plan.id}_${plan.package || productName}`;
      }
      
      if (!plansByProduct[productKey]) {
        plansByProduct[productKey] = {};
      }
      
      if (plan.recurring_interval === 'month') {
        plansByProduct[productKey].monthly = plan;
      } else if (plan.recurring_interval === 'year') {
        plansByProduct[productKey].annual = plan;
      } else {
        // Handle one-time purchases and plans with null recurring_interval
        // Each one-time plan gets its own entry
        plansByProduct[productKey].monthly = plan;
      }
    });
    
    const transformedPlans = Object.entries(plansByProduct).map(([productKey, { monthly, annual }], index) => {
      // Extract the actual product name from the key (format: "product_id_product_name")
      const productName = monthly?.product?.product_name || annual?.product?.product_name || monthly?.package || annual?.package || 'Unknown Product';
      
      console.log('[Transform] Processing:', productKey);
      console.log('[Transform] Monthly plan:', monthly ? { id: monthly.id, package: monthly.package, price: monthly.price, description: monthly.description } : 'none');
      console.log('[Transform] Annual plan:', annual ? { id: annual.id, package: annual.package, price: annual.price } : 'none');
      
      // Get currency-aware prices using our utility function
      const monthlyPriceResult = getPriceForCurrency(monthly, userCurrency);
      const annualPriceResult = getPriceForCurrency(annual, userCurrency);
      
      // Use raw prices directly as they are already in the correct currency units (not cents)
      // The database stores prices in pence/cents format (35000 = £350.00)
      const monthlyPrice = (monthly?.price || 0) / 100; // Divide by 100 to convert pence to pounds
      const monthlyPriceSymbol = monthly?.currency_symbol || currencySymbol;
      
      // Calculate annual price with priority:
      // 1. Use annual plan's monthly_price_calculated if available
      // 2. Calculate from monthly price using annual_size_discount if available
      // 3. Fallback to monthly price
      let annualPrice = monthlyPrice;
      let actualAnnualPrice = undefined;
      let annualPriceSymbol = monthlyPriceSymbol;
      
      if (annual?.monthly_price_calculated) {
        // Direct annual plan exists - use raw price divided by 100
        annualPrice = (annual?.price || monthlyPrice * 100) / 100;
        annualPriceSymbol = annual?.currency_symbol || currencySymbol;
        const commitmentMonths = annual.commitment_months || 12;
        actualAnnualPrice = annualPrice ? parseFloat((annualPrice * commitmentMonths).toFixed(2)) : undefined;
      } else if (monthly?.annual_size_discount && monthly.annual_size_discount > 0) {
        // Calculate annual price from monthly using discount
        const discountMultiplier = (100 - monthly.annual_size_discount) / 100;
        annualPrice = parseFloat((monthlyPrice * discountMultiplier).toFixed(2));
        actualAnnualPrice = parseFloat((annualPrice * 12).toFixed(2)); // Calculate actual annual total
        annualPriceSymbol = monthlyPriceSymbol; // Use same symbol
      }
      
      // Get features for this plan
      const planId = monthly?.id || annual?.id;
      const planIdNumber = planId ? (typeof planId === 'number' ? planId : parseInt(String(planId), 10)) : undefined;
      const realFeatures = planIdNumber ? (planFeatures[planIdNumber] || []) : [];
      
      console.log('[PricingModal] Plan ID:', planIdNumber, 'Features found:', realFeatures.length);

      // Handle promotion pricing with currency awareness
      const monthlyIsPromotion = monthly?.is_promotion && (monthly?.promotion_price !== undefined || monthly?.promotion_percent !== undefined);
      const annualIsPromotion = annual?.is_promotion && (annual?.promotion_price !== undefined || annual?.promotion_percent !== undefined);
      
      let monthlyPromotionPrice = undefined;
      let annualPromotionPrice = undefined;
      
      if (monthlyIsPromotion) {
        if (monthly?.promotion_percent !== undefined) {
          // Calculate promotion price from percentage of the converted price
          monthlyPromotionPrice = parseFloat((monthlyPrice * (1 - monthly.promotion_percent / 100)).toFixed(2));
        } else if (monthly?.promotion_price !== undefined) {
          // Use promotion_price divided by 100 (stored in pence)
          monthlyPromotionPrice = monthly.promotion_price / 100;
        }
      }
      
      if (annualIsPromotion) {
        if (annual?.promotion_percent !== undefined) {
          // Calculate promotion price from percentage of the converted price
          annualPromotionPrice = parseFloat((annualPrice * (1 - annual.promotion_percent / 100)).toFixed(2));
        } else if (annual?.promotion_price !== undefined) {
          // Use promotion_price divided by 100 (stored in pence)
          annualPromotionPrice = annual.promotion_price / 100;
        }
      } else if (monthlyIsPromotion && monthlyPromotionPrice !== undefined && monthly?.annual_size_discount && monthly.annual_size_discount > 0) {
        // Calculate annual promotion price from monthly promotion using discount
        const discountMultiplier = (100 - monthly.annual_size_discount) / 100;
        annualPromotionPrice = parseFloat((monthlyPromotionPrice * discountMultiplier).toFixed(2));
      }

      console.log('[Transform] Returning plan data:', {
        name: productName,
        monthlyPrice: parseFloat(monthlyPrice.toFixed(2)),
        description: monthly?.description || annual?.description || '',
        features: realFeatures.length
      });

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
        annualRecurringCount: annual?.commitment_months || monthly?.commitment_months || 12,
        // Add the actual annual plan price for correct total calculation (already converted from cents)
        actualAnnualPrice,
        // Add discount information for display
        annualSizeDiscount: monthly?.annual_size_discount || annual?.annual_size_discount || 0,
        // Store the actual plan ID and features for feature comparison table
        planId: planIdNumber,
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

    console.log('[transformPricingPlans] Output plans:', sortedPlans.length, 'First plan:', sortedPlans[0]);
    return sortedPlans;
  };

  const displayPlans = useMemo(() => transformPricingPlans(pricingPlans), [pricingPlans, planFeatures, userCurrency, currencySymbol]);

  // Check if any plans are one-time payments to hide annual/monthly toggle
  const hasOneTimePlans = useMemo(() => pricingPlans.some(plan => plan.type === 'one_time'), [pricingPlans]);

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
                displayPlans.map((plan) => {
                  console.log('[RENDER] Rendering pricing card:', {
                    name: plan.name,
                    description: plan.description,
                    monthlyPrice: plan.monthlyPrice,
                    features: plan.features.length,
                    realFeatures: plan.realFeatures?.length
                  });
                  
                  return (
                  <PricingCard
                    key={plan.name}
                    name={plan.name}
                    description={plan.description}
                    monthlyPrice={plan.monthlyPrice}
                    annualPrice={plan.annualPrice}
                    currencySymbol={plan.currencySymbol || currencySymbol}
                    annualCurrencySymbol={plan.annualCurrencySymbol}
                    isAnnual={isAnnual}
                    hasOneTimePlans={hasOneTimePlans}
                    annualSizeDiscount={plan.annualSizeDiscount || 0}
                    isPromotion={plan.isPromotion}
                    monthlyPromotionPrice={plan.monthlyPromotionPrice}
                    annualPromotionPrice={plan.annualPromotionPrice}
                    monthlyRecurringCount={plan.monthlyRecurringCount}
                    annualRecurringCount={plan.annualRecurringCount}
                    actualAnnualPrice={plan.actualAnnualPrice}
                    buttonText={plan.buttonText}
                    buttonVariant={plan.buttonVariant}
                    highlighted={plan.highlighted}
                    features={plan.features}
                    realFeatures={plan.realFeatures}
                    productSlug={plan.productSlug}
                    isExpanded={expandedFeatures[plan.name] || false}
                    onToggleExpanded={() => setExpandedFeatures(prev => ({
                      ...prev,
                      [plan.name]: !prev[plan.name]
                    }))}
                    translations={translations}
                    isLoadingFeatures={isLoadingFeatures}
                  />
                  );
                })
              )}
            </div>

            {/* Feature Comparison Table */}
            <PricingComparisonTable
              plans={displayPlans}
              isAnnual={isAnnual}
              hasOneTimePlans={hasOneTimePlans}
              currencySymbol={currencySymbol}
              translations={{
                features: translations.compareAllFeatures,
                limitedTimeOffer: translations.limitedTimeOffer,
              }}
            />

          </div>
        </div>
      </div>
    </div>
  );
}

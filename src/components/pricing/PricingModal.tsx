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

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MagnifyingGlassIcon, XMarkIcon as XMarkIconMini } from '@heroicons/react/20/solid';
import { Search, X } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { getTranslatedMenuContent, getLocaleFromPathname } from '@/utils/menuTranslations';
import { detectUserCurrency, getPriceForCurrency, SUPPORTED_CURRENCIES } from '@/lib/currency';
import { useThemeColors } from '@/hooks/useThemeColors';
import PricingModalProductBadges from '@/components/PricingModalProductBadges';
import { PricingComparisonProduct } from '@/types/product';
import { PricingPlan } from '@/types/pricingplan';
import PricingCard from '@/components/pricing/PricingCard';
import PricingComparisonTable from '@/components/pricing/PricingComparisonTable';
import PricingToggle from '@/components/pricing/PricingToggle';
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
  planId?: string | number; // Plan ID for feature lookup
  realFeatures?: Feature[]; // Real feature objects with full data
  productSlug?: string; // Product slug for linking to product page
  order: number; // Order field for sorting plans
  isPromotion?: boolean; // Promotion flag
  promotionPrice?: number; // Promotional price
  monthlyPromotionPrice?: number; // Monthly promotional price
  annualPromotionPrice?: number; // Annual promotional price
  currencySymbol?: string; // Currency symbol for monthly price
  annualCurrencySymbol?: string; // Currency symbol for annual price
  recurring_interval?: string; // Recurring interval (month, year, etc.)
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
  const themeColors = useThemeColors();
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
  const [hasScrolled, setHasScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pricing_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  // Keyboard shortcuts and autocomplete navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Arrow navigation in autocomplete
      if (showAutocomplete && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        const filteredRecent = recentSearches.filter(search => search.toLowerCase().includes(searchQuery.toLowerCase()));
        const filteredSuggestions = searchSuggestions.filter(suggestion => suggestion.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
        const totalItems = filteredRecent.length + filteredSuggestions.length;
        
        if (totalItems === 0) return;
        
        if (e.key === 'ArrowDown') {
          setActiveIndex(prev => prev < totalItems - 1 ? prev + 1 : prev);
        } else {
          setActiveIndex(prev => prev > -1 ? prev - 1 : -1);
        }
      }

      // Enter to select suggestion
      if (showAutocomplete && e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const filteredRecent = recentSearches.filter(search => search.toLowerCase().includes(searchQuery.toLowerCase()));
        const filteredSuggestions = searchSuggestions.filter(suggestion => suggestion.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
        
        if (activeIndex < filteredRecent.length) {
          // Selected from recent searches
          handleSearchChange(filteredRecent[activeIndex]);
        } else {
          // Selected from suggestions
          const suggestionIndex = activeIndex - filteredRecent.length;
          if (filteredSuggestions[suggestionIndex]) {
            handleSearchChange(filteredSuggestions[suggestionIndex]);
          }
        }
        setShowAutocomplete(false);
      }

      // Escape to close autocomplete
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        setActiveIndex(-1);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAutocomplete, searchQuery, searchSuggestions, recentSearches, activeIndex]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      // Only save to recent searches when user actually searches (not empty and different from last)
      if (value.trim() && !recentSearches.includes(value.trim()) && value.length > 2) {
        const updated = [value.trim(), ...recentSearches.slice(0, 4)];
        setRecentSearches(updated);
        localStorage.setItem('pricing_recent_searches', JSON.stringify(updated));
      }
    }, 50);
  }, [recentSearches]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setShowAutocomplete(false);
    setActiveIndex(-1);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Highlight matching text in search results
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim() || !text) return text;
    
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      const parts = text.split(regex);
      
      return (
        <>
          {parts.map((part, index) => {
            if (!part) return null;
            // When splitting with a capturing group, matched parts appear at odd indices
            const isMatch = index % 2 === 1;
            return isMatch ? (
              <span key={index} style={{ backgroundColor: 'rgb(219 234 254)', color: 'rgb(30 64 175)', padding: '0 2px', borderRadius: '2px' }}>
                {part}
              </span>
            ) : (
              <React.Fragment key={index}>{part}</React.Fragment>
            );
          })}
        </>
      );
    } catch (e) {
      console.error('Error in highlightMatch:', e);
      return text;
    }
  }, []);

  // Generate search suggestions based on pricing plans
  useEffect(() => {
    if (pricingPlans.length === 0) return;
    
    const suggestions = new Set<string>();
    
    pricingPlans.forEach(plan => {
      // Add plan names/packages
      if (plan.package) suggestions.add(plan.package);
      
      // Add product names
      if (plan.product?.product_name) suggestions.add(plan.product.product_name);
      
      // Add pricing info
      if (plan.price) suggestions.add(`$${plan.price}`);
      if (plan.monthly_price_calculated) suggestions.add(`$${plan.monthly_price_calculated}/month`);
      if (plan.total_price_calculated) suggestions.add(`$${plan.total_price_calculated} total`);
      
      // Add intervals
      if (plan.recurring_interval) suggestions.add(plan.recurring_interval);
      
      // Add features from planFeatures
      const planFeaturesForId = planFeatures[plan.id] || [];
      planFeaturesForId.forEach(feature => {
        if (feature.name) suggestions.add(feature.name);
        if (feature.content) {
          // Split content into words and add meaningful ones
          feature.content.split(' ').forEach(word => {
            if (word.length > 3) suggestions.add(word);
          });
        }
      });
    });
    
    setSearchSuggestions(Array.from(suggestions).slice(0, 10));
  }, [pricingPlans, planFeatures]);
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
        
        console.log('[PricingModal] Fetching plans for product:', selectedProduct?.product_name || 'ALL PRODUCTS');
        console.log('[PricingModal] Selected product ID:', selectedProduct?.id);
        console.log('[PricingModal] API URL:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-user-currency': userCurrency,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('[PricingModal] Fetched', data.length, 'plans for product:', selectedProduct?.product_name || 'ALL');
          console.log('[PricingModal] Plan product IDs:', data.map((p: any) => ({ id: p.id, product_id: p.product_id, package: p.package })));
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
  const transformPricingPlans = useCallback((plans: PricingPlan[]): SamplePricingPlan[] => {
    console.log('[transformPricingPlans] Input plans:', plans.length);
    if (!plans || plans.length === 0) return []; // Return empty array when no plans available
    
    // Group by package name to show monthly/annual variants together
    // Each unique package gets its own card
    const plansByPackage: { [key: string]: { monthly?: PricingPlan; annual?: PricingPlan } } = {};
    
    plans.forEach(plan => {
      // Skip null or undefined plans
      if (!plan) return;
      
      // Use package name as the key, with plan ID as fallback for uniqueness
      const packageName = plan.package || `Plan ${plan.id}`;
      
      // For subscription plans with monthly/annual variants, group by package
      // For one-time plans, each gets its own unique key
      let packageKey: string;
      if (plan.recurring_interval === 'month' || plan.recurring_interval === 'year') {
        // Subscription plans: group by package name (monthly and annual variants together)
        packageKey = packageName;
      } else {
        // One-time plans: each plan gets its own card using unique ID
        packageKey = `${plan.id}_${packageName}`;
      }
      
      if (!plansByPackage[packageKey]) {
        plansByPackage[packageKey] = {};
      }
      
      if (plan.recurring_interval === 'month') {
        plansByPackage[packageKey].monthly = plan;
      } else if (plan.recurring_interval === 'year') {
        plansByPackage[packageKey].annual = plan;
      } else {
        // Handle one-time purchases and plans with null recurring_interval
        // Each one-time plan gets its own entry
        plansByPackage[packageKey].monthly = plan;
      }
    });
    
    const transformedPlans = Object.entries(plansByPackage).map(([packageKey, { monthly, annual }], index) => {
      // Use the package name as the card title
      const packageName = monthly?.package || annual?.package || 'Unknown Package';
      
      // Transform plan data
      
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
      const planIdString = planId ? String(planId) : undefined;
      const realFeatures = planIdString ? (planFeatures[planIdString] || []) : [];
      
      console.log('[PricingModal] Plan ID:', planIdString, 'Features found:', realFeatures.length);

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

      // Plan transformed successfully

      return {
        name: packageName,
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
        planId: planIdString,
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
        // Add recurring interval for search
        recurring_interval: monthly?.recurring_interval || annual?.recurring_interval || 'month',
      };
    }).sort((a, b) => a.order - b.order);

    // After sorting, show only explicitly linked features for each plan
    const sortedPlans = transformedPlans.map((plan, sortedIndex) => {
      // Show only the features explicitly linked to this pricing plan
      const displayFeatures = (plan.realFeatures || []).map(feature => feature.name);

      return {
        ...plan,
        features: displayFeatures,
        highlighted: sortedIndex === 1, // Highlight the second plan after sorting
        buttonVariant: (sortedIndex === 1 ? 'primary' : 'secondary') as 'primary' | 'secondary',
      };
    });

    console.log('[transformPricingPlans] Output plans:', sortedPlans.length, 'First plan:', sortedPlans[0]);
    return sortedPlans;
  }, [planFeatures, userCurrency, currencySymbol]);

  const displayPlans = useMemo(() => {
    const transformedPlans = transformPricingPlans(pricingPlans);
    
    if (!searchQuery.trim()) {
      return transformedPlans;
    }
    
    const searchLower = searchQuery.toLowerCase();
    
    return transformedPlans.filter(plan => {
      // Search in plan name
      if (plan.name?.toLowerCase().includes(searchLower)) return true;
      
      // Search in description
      if (plan.description?.toLowerCase().includes(searchLower)) return true;
      
      // Search in features
      if (plan.features?.some(feature => feature.toLowerCase().includes(searchLower))) return true;
      
      // Search in real features
      if (plan.realFeatures?.some(feature => 
        feature.name?.toLowerCase().includes(searchLower) || 
        feature.content?.toLowerCase().includes(searchLower)
      )) return true;
      
      // Search in pricing information
      if (plan.monthlyPrice?.toString().includes(searchLower) || 
          plan.annualPrice?.toString().includes(searchLower)) return true;
      
      // Search in product slug
      if (plan.productSlug?.toLowerCase().includes(searchLower)) return true;
      
      // Search in plan type/interval
      if (plan.recurring_interval?.toLowerCase().includes(searchLower)) return true;
      
      return false;
    });
  }, [transformPricingPlans, pricingPlans, searchQuery]);

  // Check if any plans are one-time payments to hide annual/monthly toggle
  const hasOneTimePlans = useMemo(() => pricingPlans.some(plan => plan.type === 'one_time'), [pricingPlans]);

  // Track scroll position to show fixed toggle
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      const scrollContainer = document.querySelector('[data-pricing-content]');
      if (scrollContainer) {
        setHasScrolled(scrollContainer.scrollTop > 50);
      }
    };

    const scrollContainer = document.querySelector('[data-pricing-content]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen]);

  // Reset scroll state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasScrolled(false);
    }
  }, [isOpen]);

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

  // Ensure the pricing modal always overlays the header (and its portaled menus)
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  if (typeof window === 'undefined') return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        style={{ zIndex: 999998 }}
        onClick={() => {
          onClose();
          // Remove hash when clicking backdrop
          removePricingHash();
        }}
        aria-hidden="true"
      />
      
      {/* Modal - Full Screen */}
      <div className="fixed inset-0 flex" style={{ zIndex: 999999 }}>
        <div className="relative bg-white w-full h-full overflow-hidden flex flex-col">
          
          {/* Fixed Pricing Toggle - appears at top when scrolled */}
          {!hasOneTimePlans && hasScrolled && (
            <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm px-6 py-4 sm:px-8 border-b border-gray-200/50">
              <PricingToggle
                isAnnual={isAnnual}
                onToggle={setIsAnnual}
                translations={translations}
                variant="fixed"
              />
            </div>
          )}
          
          {/* Header */}
          <div className="relative bg-white px-6 py-6 sm:px-8 sm:py-8">
            {/* Logo - Top Left - Hidden on mobile when space is limited */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 hidden sm:block">
              {settings?.image ? (
                <Image
                  src={settings.image}
                  alt="Logo"
                  width={48}
                  height={48}
                  className="h-8 w-auto"
                  priority={true}
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                  sizes="48px"
                  quality={90}
                />
              ) : (
                <span className="text-lg font-semibold text-gray-900">{settings?.company_name || 'Store'}</span>
              )}
            </div>
            
            {/* Search and Close Button Container */}
            <div className="flex items-center gap-3 justify-end min-w-0">
              {/* Search - CRM Style */}
              <div className="relative flex-1 max-w-sm min-w-0">
                {/* Search Icon */}
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className={`h-5 w-5 transition-all duration-200 ${
                    searchQuery ? 'text-gray-600 scale-110' : 'text-gray-400'
                  }`} />
                </span>
                
                {/* Search Input */}
                <input
                  ref={searchInputRef}
                  type="text"
                  role="search"
                  aria-label="Search pricing plans"
                  aria-controls="search-autocomplete"
                  aria-expanded={showAutocomplete}
                  aria-activedescendant={activeIndex >= 0 ? `search-suggestion-${activeIndex}` : undefined}
                  placeholder="Search plans..."
                  value={searchQuery}
                  onChange={(e) => {
                    handleSearchChange(e.target.value);
                    setShowAutocomplete(true);
                    setActiveIndex(-1);
                  }}
                  onFocus={(e) => {
                    setShowAutocomplete(true);
                    setActiveIndex(-1);
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.cssVars.primary.base}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.boxShadow = '';
                    setTimeout(() => {
                      setShowAutocomplete(false);
                      setActiveIndex(-1);
                    }, 200);
                  }}
                  className="w-full pl-12 pr-24 py-3.5 text-base border bg-white border-gray-100 rounded-xl focus:outline-none focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
                
                {/* Right Side Icons */}
                <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
                  {/* Clear Button */}
                  {searchQuery && (
                    <button
                      onClick={handleClearSearch}
                      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  )}
                  
                  {/* Keyboard Shortcut Hint */}
                  <span className="hidden xl:flex items-center gap-0.5 px-2.5 py-1 text-xs text-gray-500 font-medium bg-gray-100 rounded-md">
                    <kbd>⌘</kbd><kbd>K</kbd>
                  </span>
                </div>
                
                {/* Autocomplete Dropdown */}
                {showAutocomplete && searchQuery && (searchSuggestions.length > 0 || recentSearches.filter(search => search.toLowerCase().includes(searchQuery.toLowerCase())).length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                    {/* Recent Searches */}
                    {recentSearches.filter(search => search.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                      <div className="p-3 border-b border-gray-100">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Recent Searches</div>
                        {recentSearches
                          .filter(search => search.toLowerCase().includes(searchQuery.toLowerCase()))
                          .slice(0, 3)
                          .map((search, index) => (
                          <button
                            key={search}
                            onClick={() => {
                              handleSearchChange(search);
                              setShowAutocomplete(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors ${
                              activeIndex === index ? 'font-medium' : 'text-gray-700'
                            }`}
                            style={{
                              backgroundColor: activeIndex === index ? `${themeColors.cssVars.primary.lighter}80` : undefined,
                              color: activeIndex === index ? themeColors.cssVars.primary.base : undefined,
                            }}
                          >
                            {highlightMatch(search, searchQuery)}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Search Suggestions */}
                    {searchSuggestions
                      .filter(suggestion => suggestion.toLowerCase().includes(searchQuery.toLowerCase()))
                      .slice(0, 5)
                      .map((suggestion, index) => {
                      const actualIndex = recentSearches.filter(search => search.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? index + 3 : index;
                      return (
                        <button
                          key={suggestion}
                          id={`search-suggestion-${actualIndex}`}
                          onClick={() => {
                            handleSearchChange(suggestion);
                            setShowAutocomplete(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                            activeIndex === actualIndex ? 'font-medium' : 'text-gray-700'
                          }`}
                          style={{
                            backgroundColor: activeIndex === actualIndex ? `${themeColors.cssVars.primary.lighter}80` : undefined,
                            color: activeIndex === actualIndex ? themeColors.cssVars.primary.base : undefined,
                          }}
                        >
                          {highlightMatch(suggestion, searchQuery)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => {
                  onClose();
                  // Remove hash when clicking close button
                  removePricingHash();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50 flex-shrink-0"
                aria-label="Close pricing modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white px-6 py-6 sm:px-8 sm:py-8 overflow-y-auto relative" data-pricing-content>
            
            {/* Scrollable Title and Description */}
            <div className="text-center max-w-4xl mx-auto mb-8">
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
              
              {/* Search Results Indicator */}
              {searchQuery && (
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-600">
                    {displayPlans.length === 0 
                      ? `No plans found for "${searchQuery}"`
                      : `Found ${displayPlans.length} plan${displayPlans.length === 1 ? '' : 's'} for "${searchQuery}"`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Fixed Pricing Toggle - at the level where buttons appear */}
            {!hasOneTimePlans && !hasScrolled && (
              <div className="sticky top-0 z-20 bg-white/95 px-6 py-4 sm:px-8 mb-6">
                <PricingToggle
                  isAnnual={isAnnual}
                  onToggle={setIsAnnual}
                  translations={translations}
                  variant="inline"
                />
              </div>
            )}
            


            {/* Pricing Cards - Smaller on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-4xl xl:max-w-5xl mx-auto mb-20">
              {isLoadingPlans ? (
                // Loading skeleton
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="relative bg-white rounded-3xl border border-gray-200/60 p-8 animate-pulse"
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
                <>
                  {displayPlans.map((plan) => (
                  <PricingCard
                    key={`${plan.planId}-${plan.name}`}
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
                    searchQuery={searchQuery}
                    highlightMatch={highlightMatch}
                  />
                ))}
                </>
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
    </>,
    document.body
  );
}
